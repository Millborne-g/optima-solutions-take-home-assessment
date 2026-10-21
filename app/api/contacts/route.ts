import { type NextRequest } from "next/server";
import {
  createContactSchema,
  listContactsQuerySchema,
} from "@/entities/contact/model/schema";
import {
  getContacts,
  upsertContactByEmail,
} from "@/server/services/contactsService";
import {
  ok,
  created,
  badRequest,
  handleServiceError,
} from "@/shared/lib/apiResponse";

/**
 * GET /api/contacts
 *
 * Query params:
 *   after  - Pagination cursor (from a previous response's `nextCursor`)
 *   limit  - Number of contacts per page (1–100, default 20)
 *
 * Response: { contacts: Contact[], nextCursor: string | null }
 */
export async function GET(request: NextRequest): Promise<Response> {
  const { searchParams } = request.nextUrl;

  const parseResult = listContactsQuerySchema.safeParse({
    after: searchParams.get("after") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
  });

  if (!parseResult.success) {
    return badRequest(parseResult.error.issues[0]?.message ?? "Invalid query parameters");
  }

  const { after, limit } = parseResult.data;

  try {
    const page = await getContacts(after, limit);
    return ok(page);
  } catch (err) {
    return handleServiceError(err);
  }
}

/**
 * POST /api/contacts
 *
 * Body: { firstName?, lastName?, email, phone? }
 *
 * Checks for an existing contact with the same email in HubSpot.
 * - If found: updates the existing contact and returns 200 with wasUpdated: true.
 * - If not found: creates a new contact and returns 201 with wasUpdated: false.
 */
export async function POST(request: NextRequest): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("Request body must be valid JSON");
  }

  const parseResult = createContactSchema.safeParse(body);
  if (!parseResult.success) {
    const firstError = parseResult.error.issues[0];
    return badRequest(firstError?.message ?? "Validation failed");
  }

  try {
    const result = await upsertContactByEmail(parseResult.data);
    // Return 200 if updated (contact already existed), 201 if created.
    if (result.wasUpdated) {
      return ok(result);
    }
    return created(result);
  } catch (err) {
    return handleServiceError(err);
  }
}
