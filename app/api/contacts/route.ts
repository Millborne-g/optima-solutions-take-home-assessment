import { type NextRequest } from "next/server";
import {
  createContactSchema,
  listContactsQuerySchema,
} from "@/entities/contact/model/schema";
import {
  getContacts,
  getContactsCount,
  searchContactsPage,
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
 *   q      - Free-text HubSpot search (name / email)
 *   limit  - Number of contacts per page (1–100, default 5)
 *
 * Response: { contacts, nextCursor, total? }
 */
export async function GET(request: NextRequest): Promise<Response> {
  const { searchParams } = request.nextUrl;

  const parseResult = listContactsQuerySchema.safeParse({
    after: searchParams.get("after") ?? undefined,
    q: searchParams.get("q") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
  });

  if (!parseResult.success) {
    return badRequest(parseResult.error.issues[0]?.message ?? "Invalid query parameters");
  }

  const { after, q, limit } = parseResult.data;
  const query = q?.trim() ?? "";

  try {
    if (query !== "") {
      const page = await searchContactsPage(query, after, limit);
      return ok(page);
    }

    const [page, total] = await Promise.all([
      getContacts(after, limit),
      // Cheap total for badges when listing (not searching).
      limit <= 1 && !after
        ? getContactsCount().catch(() => null)
        : Promise.resolve(null),
    ]);

    return ok({
      ...page,
      total: total ?? page.total ?? null,
    });
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
    if (result.wasUpdated) {
      return ok(result);
    }
    return created(result);
  } catch (err) {
    return handleServiceError(err);
  }
}
