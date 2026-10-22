import { describe, it, expect } from "vitest";
import {
  createContactSchema,
  updateContactSchema,
  listContactsQuerySchema,
} from "@/entities/contact/model/schema";

describe("createContactSchema", () => {
  it("accepts a valid contact with email only", () => {
    const result = createContactSchema.safeParse({ email: "jane@example.com" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("jane@example.com");
    }
  });

  it("accepts a fully populated contact", () => {
    const result = createContactSchema.safeParse({
      firstName: "Jane",
      lastName: "Smith",
      email: "jane@example.com",
      phone: "+1 555 000 0000",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a missing email", () => {
    const result = createContactSchema.safeParse({
      firstName: "Jane",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const emailIssue = result.error.issues.find((i) =>
        i.path.includes("email"),
      );
      expect(emailIssue).toBeDefined();
    }
  });

  it("rejects an invalid email format", () => {
    const result = createContactSchema.safeParse({ email: "not-an-email" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const emailIssue = result.error.issues.find((i) =>
        i.path.includes("email"),
      );
      expect(emailIssue).toBeDefined();
    }
  });

  it("rejects a blank email string", () => {
    const result = createContactSchema.safeParse({ email: "" });
    expect(result.success).toBe(false);
  });

  it("trims whitespace from email", () => {
    const result = createContactSchema.safeParse({
      email: "  jane@example.com  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("jane@example.com");
    }
  });

  it("rejects a blank firstName when provided", () => {
    const result = createContactSchema.safeParse({
      email: "jane@example.com",
      firstName: "  ",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateContactSchema", () => {
  it("accepts a partial update with firstName only", () => {
    const result = updateContactSchema.safeParse({ firstName: "Updated" });
    expect(result.success).toBe(true);
  });

  it("accepts a partial update with email only", () => {
    const result = updateContactSchema.safeParse({
      email: "updated@example.com",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty object (no fields provided)", () => {
    const result = updateContactSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email in an update", () => {
    const result = updateContactSchema.safeParse({ email: "bad-email" });
    expect(result.success).toBe(false);
  });
});

describe("listContactsQuerySchema", () => {
  it("defaults limit to 5", () => {
    const result = listContactsQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(5);
    }
  });

  it("coerces string limit to number", () => {
    const result = listContactsQuerySchema.safeParse({ limit: "50" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(50);
    }
  });

  it("rejects limit above 100", () => {
    const result = listContactsQuerySchema.safeParse({ limit: "200" });
    expect(result.success).toBe(false);
  });

  it("accepts an after cursor", () => {
    const result = listContactsQuerySchema.safeParse({ after: "abc123" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.after).toBe("abc123");
    }
  });

  it("accepts a search query", () => {
    const result = listContactsQuerySchema.safeParse({ q: "brian" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.q).toBe("brian");
    }
  });
});
