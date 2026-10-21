import { Suspense } from "react";

// Opt out of instant navigation — this page fetches live CRM data on demand.
export const instant = false;
import { getContacts } from "@/server/services/contactsService";
import { ContactsView } from "@/views/contacts/ContactsView";
import { LoadingSpinner } from "@/shared/ui/LoadingSpinner";

// Next.js 16: searchParams is a Promise (async Request API).
type SearchParams = Promise<{ after?: string; limit?: string }>;
type PageProps = { searchParams: SearchParams };

/**
 * Contacts list page — Server Component.
 *
 * Fetches the first page of contacts directly from HubSpot on the server,
 * then streams the result to the client. Subsequent pages are loaded via
 * client-side navigation in the ContactsTable widget.
 */
async function ContactsPageContent(props: PageProps) {
  const searchParams = await props.searchParams;
  const after = typeof searchParams?.after === "string" ? searchParams.after : undefined;

  let page;
  let fetchError: string | null = null;

  try {
    page = await getContacts(after, 20);
  } catch (err) {
    fetchError =
      err instanceof Error
        ? err.message
        : "Failed to load contacts from HubSpot.";
    page = { contacts: [], nextCursor: null };
  }

  if (fetchError) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
        <div className="mt-6 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <strong>Error:</strong> {fetchError}
        </div>
      </div>
    );
  }

  return <ContactsView page={page} />;
}

export default function ContactsPage(props: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner size="lg" label="Loading contacts…" />
        </div>
      }
    >
      <ContactsPageContent {...props} />
    </Suspense>
  );
}
