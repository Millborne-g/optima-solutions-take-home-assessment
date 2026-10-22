import { z } from "zod";

/**
 * Zod schemas for contact input validation.
 *
 * Used by Route Handlers for server-side validation before any HubSpot call.
 * Zod v4 — API is backward-compatible with v3 for these patterns.
 */

export const createContactSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "First name must not be blank")
    .optional(),
  lastName: z.string().trim().min(1, "Last name must not be blank").optional(),
  email: z.string().trim().email("A valid email address is required"),
  phone: z
    .string()
    .trim()
    .min(1, "Phone number must not be blank")
    .optional(),
});

export const updateContactSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(1, "First name must not be blank")
      .optional(),
    lastName: z
      .string()
      .trim()
      .min(1, "Last name must not be blank")
      .optional(),
    email: z.string().trim().email("A valid email address is required").optional(),
    phone: z
      .string()
      .trim()
      .min(1, "Phone number must not be blank")
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for an update",
  });

export const listContactsQuerySchema = z.object({
  after: z.string().optional(),
  q: z.string().optional(),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .default(5),
});

export type CreateContactInput = z.infer<typeof createContactSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
export type ListContactsQuery = z.infer<typeof listContactsQuerySchema>;
