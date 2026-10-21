import { type NextRequest } from "next/server";
import { updateContactSchema } from "@/entities/contact/model/schema";
import { updateContactById } from "@/server/services/contactsService";
import {
  ok,
  badRequest,
  notFound,
  handleServiceError,
} from "@/shared/lib/apiResponse";
import { HubSpotNotFoundError } from "@/server/hubspot/contactsApi";

/**
 * PATCH /api/contacts/[id]
 *
 * Partially updates a contact by its HubSpot ID.
 * Only the provided fields are changed.
 *
 * Body: { firstName?, lastName?, email?, phone? }
 * Response: { contact: Contact }
 *
 * Note: Next.js 16 — `params` is a Promise and must be awaited.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;

  if (!id || typeof id !== "string") {
    return badRequest("Contact ID is required");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("Request body must be valid JSON");
  }

  const parseResult = updateContactSchema.safeParse(body);
  if (!parseResult.success) {
    const firstError = parseResult.error.issues[0];
    return badRequest(firstError?.message ?? "Validation failed");
  }

  try {
    const contact = await updateContactById(id, parseResult.data);
    return ok({ contact });
  } catch (err) {
    if (err instanceof HubSpotNotFoundError) {
      return notFound(`Contact ${id} not found`);
    }
    return handleServiceError(err);
  }
}

/**
 * GET /api/contacts/[id]
 *
 * Fetch a single contact by its HubSpot ID.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;

  if (!id || typeof id !== "string") {
    return badRequest("Contact ID is required");
  }

  try {
    const { getContact } = await import("@/server/services/contactsService");
    const contact = await getContact(id);
    return ok({ contact });
  } catch (err) {
    if (err instanceof HubSpotNotFoundError) {
      return notFound(`Contact ${id} not found`);
    }
    return handleServiceError(err);
  }
}
