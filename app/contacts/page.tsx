import { Suspense } from "react";
import { notFound } from "next/navigation";

// Opt out of instant navigation — this page fetches live CRM data on demand.
export const instant = false;
import {
  CONTACTS_PAGE_SIZE,
  getContact,
  getContacts,
  getContactsCount,
  searchContactsPage,
} from "@/server/services/contactsService";
import type { Contact } from "@/entities/contact/model/types";
import { HubSpotNotFoundError } from "@/server/hubspot/contactsApi";
import { ContactsView } from "@/views/contacts/ContactsView";
import { LoadingSpinner } from "@/shared/ui/LoadingSpinner";
import { PageContainer, PageHeader } from "@/shared/ui/PageContainer";

// Next.js 16: searchParams is a Promise (async Request API).
type SearchParams = Promise<{
  after?: string;
  limit?: string;
  add?: string;
  edit?: string;
  history?: string;
  q?: string;
}>;
type PageProps = { searchParams: SearchParams };

/**
 * Contacts list page — Server Component.
 *
 * Fetches contacts from HubSpot (list or search), then streams to the client.
 */
async function ContactsPageContent(props: PageProps) {
  const searchParams = await props.searchParams;
  const after =
    typeof searchParams?.after === "string" ? searchParams.after : undefined;
  const query =
    typeof searchParams?.q === "string" ? searchParams.q.trim() : "";
  const editId =
    typeof searchParams?.edit === "string" && searchParams.edit.trim() !== ""
      ? searchParams.edit.trim()
      : undefined;

  let page;
  let total: number | null = null;
  let fetchError: string | null = null;
  let startEditContact: Contact | null = null;

  try {
    if (query !== "") {
      page = await searchContactsPage(query, after, CONTACTS_PAGE_SIZE);
      total = page.total ?? page.contacts.length;
    } else {
      const [listPage, count] = await Promise.all([
        getContacts(after, CONTACTS_PAGE_SIZE),
        getContactsCount().catch(() => null),
      ]);
      page = listPage;
      total = count;
    }
  } catch (err) {
    fetchError =
      err instanceof Error
        ? err.message
        : "Failed to load contacts from HubSpot.";
    page = { contacts: [], nextCursor: null, total: null };
  }

  if (!fetchError && editId) {
    try {
      startEditContact = await getContact(editId);
    } catch (err) {
      if (err instanceof HubSpotNotFoundError) {
        notFound();
      }
      throw err;
    }
  }

  if (fetchError) {
    return (
      <PageContainer>
        <PageHeader title="Contacts" />
        <div className="rounded-md border border-danger/30 bg-danger-bg px-4 py-3 text-sm text-danger">
          <strong>Error:</strong> {fetchError}
        </div>
      </PageContainer>
    );
  }

  return (
    <ContactsView
      page={page}
      query={query}
      total={total}
      startAdd={searchParams?.add === "1"}
      startEditContact={startEditContact}
    />
  );
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
