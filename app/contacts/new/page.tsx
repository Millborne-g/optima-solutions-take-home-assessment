import { ContactFormView } from "@/views/contacts/ContactFormView";

// Opt out of instant navigation — form is client-side interactive.
export const instant = false;

/**
 * New contact page — Server Component.
 * Renders the create contact form (client component) inside a server shell.
 */
export default function NewContactPage() {
  return <ContactFormView mode="create" />;
}
