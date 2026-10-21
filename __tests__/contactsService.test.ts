import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import type { Contact } from "@/entities/contact/model/types";

// ---------------------------------------------------------------------------
// Mocks — declared before module imports so vi.mock hoisting works correctly.
// ---------------------------------------------------------------------------

vi.mock("@/server/hubspot/contactsApi", () => ({
  listContacts: vi.fn(),
  getContactById: vi.fn(),
  searchContactByEmail: vi.fn(),
  createContact: vi.fn(),
  updateContact: vi.fn(),
  HubSpotRateLimitError: class HubSpotRateLimitError extends Error {
    retryAfterMs: number;
    constructor(ms: number) {
      super(`Rate limit`);
      this.name = "HubSpotRateLimitError";
      this.retryAfterMs = ms;
    }
  },
  HubSpotNotFoundError: class HubSpotNotFoundError extends Error {
    constructor(id: string) {
      super(`Not found: ${id}`);
      this.name = "HubSpotNotFoundError";
    }
  },
  HubSpotApiError: class HubSpotApiError extends Error {
    statusCode: number;
    constructor(msg: string, code: number) {
      super(msg);
      this.name = "HubSpotApiError";
      this.statusCode = code;
    }
  },
}));

vi.mock("@/server/supabase/contactsRepository", () => ({
  upsertContact: vi.fn(),
  findByHubspotId: vi.fn(),
}));

// Import modules AFTER mocks are declared.
import {
  listContacts,
  searchContactByEmail,
  createContact,
  updateContact,
  HubSpotRateLimitError,
} from "@/server/hubspot/contactsApi";
import { upsertContact } from "@/server/supabase/contactsRepository";
import {
  getContacts,
  upsertContactByEmail,
  updateContactById,
} from "@/server/services/contactsService";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockContact: Contact = {
  id: "hs-001",
  firstName: "Jane",
  lastName: "Smith",
  email: "jane@example.com",
  phone: "+1 555 000 0000",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-02T00:00:00Z",
};

// ---------------------------------------------------------------------------
// getContacts
// ---------------------------------------------------------------------------

describe("getContacts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (upsertContact as Mock).mockResolvedValue(mockContact);
  });

  it("returns contacts from HubSpot", async () => {
    (listContacts as Mock).mockResolvedValue({
      contacts: [mockContact],
      nextCursor: null,
    });

    const result = await getContacts();
    expect(result.contacts).toHaveLength(1);
    expect(result.contacts[0].email).toBe("jane@example.com");
    expect(result.nextCursor).toBeNull();
  });

  it("passes pagination cursor to HubSpot", async () => {
    (listContacts as Mock).mockResolvedValue({
      contacts: [],
      nextCursor: null,
    });

    await getContacts("cursor-123", 10);
    expect(listContacts).toHaveBeenCalledWith("cursor-123", 10);
  });

  it("returns nextCursor when more pages are available", async () => {
    (listContacts as Mock).mockResolvedValue({
      contacts: [mockContact],
      nextCursor: "next-cursor-456",
    });

    const result = await getContacts();
    expect(result.nextCursor).toBe("next-cursor-456");
  });

  it("propagates HubSpot errors to the caller", async () => {
    (listContacts as Mock).mockRejectedValue(
      new HubSpotRateLimitError(5000),
    );

    await expect(getContacts()).rejects.toThrow("Rate limit");
  });
});

// ---------------------------------------------------------------------------
// upsertContactByEmail
// ---------------------------------------------------------------------------

describe("upsertContactByEmail — create path", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (searchContactByEmail as Mock).mockResolvedValue(null); // no existing contact
    (createContact as Mock).mockResolvedValue(mockContact);
    (upsertContact as Mock).mockResolvedValue(mockContact);
  });

  it("creates a new contact when no existing contact is found", async () => {
    const result = await upsertContactByEmail({
      email: "jane@example.com",
      firstName: "Jane",
    });

    expect(createContact).toHaveBeenCalledOnce();
    expect(updateContact).not.toHaveBeenCalled();
    expect(result.wasUpdated).toBe(false);
    expect(result.contact.email).toBe("jane@example.com");
  });

  it("syncs the new contact to Supabase", async () => {
    await upsertContactByEmail({ email: "jane@example.com" });
    // upsertContact is called with the created contact
    expect(upsertContact).toHaveBeenCalledWith(mockContact);
  });
});

describe("upsertContactByEmail — update path", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (searchContactByEmail as Mock).mockResolvedValue(mockContact); // existing contact
    (updateContact as Mock).mockResolvedValue({
      ...mockContact,
      phone: "+1 555 999 9999",
    });
    (upsertContact as Mock).mockResolvedValue(mockContact);
  });

  it("updates the existing contact when email already exists", async () => {
    const result = await upsertContactByEmail({
      email: "jane@example.com",
      phone: "+1 555 999 9999",
    });

    expect(updateContact).toHaveBeenCalledOnce();
    expect(createContact).not.toHaveBeenCalled();
    expect(result.wasUpdated).toBe(true);
  });

  it("does not overwrite email when updating an existing contact", async () => {
    await upsertContactByEmail({
      email: "jane@example.com",
      firstName: "Janet",
    });

    const [, updatePayload] = (updateContact as Mock).mock.calls[0] as [
      string,
      Record<string, string>,
    ];
    expect(updatePayload.email).toBeUndefined();
    expect(updatePayload.firstName).toBe("Janet");
  });
});

describe("upsertContactByEmail — error handling", () => {
  it("propagates HubSpot rate-limit errors", async () => {
    vi.clearAllMocks();
    (searchContactByEmail as Mock).mockRejectedValue(
      new HubSpotRateLimitError(10_000),
    );

    await expect(
      upsertContactByEmail({ email: "jane@example.com" }),
    ).rejects.toThrow("Rate limit");
  });

  it("continues (returns contact) when Supabase sync fails", async () => {
    vi.clearAllMocks();
    (searchContactByEmail as Mock).mockResolvedValue(null);
    (createContact as Mock).mockResolvedValue(mockContact);
    (upsertContact as Mock).mockResolvedValue(null); // simulate sync failure

    const result = await upsertContactByEmail({ email: "jane@example.com" });

    // HubSpot succeeded; Supabase failed silently.
    expect(result.contact.email).toBe("jane@example.com");
    expect(result.wasUpdated).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// updateContactById
// ---------------------------------------------------------------------------

describe("updateContactById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (updateContact as Mock).mockResolvedValue(mockContact);
    (upsertContact as Mock).mockResolvedValue(mockContact);
  });

  it("calls HubSpot update with the correct ID and payload", async () => {
    await updateContactById("hs-001", { firstName: "Updated" });

    expect(updateContact).toHaveBeenCalledWith("hs-001", {
      firstName: "Updated",
    });
  });

  it("returns the updated contact", async () => {
    const updated = await updateContactById("hs-001", { firstName: "Updated" });
    expect(updated.id).toBe("hs-001");
  });
});
