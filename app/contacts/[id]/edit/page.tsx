import { notFound } from "next/navigation";

// Opt out of instant navigation — this page fetches live CRM data on demand.
export const instant = false;
import { getContact } from "@/server/services/contactsService";
import { ContactFormView } from "@/views/contacts/ContactFormView";
import { HubSpotNotFoundError } from "@/server/hubspot/contactsApi";

// Next.js 16: params is a Promise (async Request API).
type EditPageProps = { params: Promise<{ id: string }> };

/**
 * Edit contact page — Server Component.
 * Fetches the contact from HubSpot on the server and passes it to the form.
 */
export default async function EditContactPage({ params }: EditPageProps) {
  const { id } = await params;

  let contact;
  try {
    contact = await getContact(id);
  } catch (err) {
    if (err instanceof HubSpotNotFoundError) {
      notFound();
    }
    throw err;
  }

  return <ContactFormView mode="edit" contact={contact} />;
}
