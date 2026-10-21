import Link from "next/link";
import type { ContactsPage } from "@/entities/contact/model/types";
import { ContactsTable } from "@/widgets/contacts-table/ContactsTable";
import { Button } from "@/shared/ui/Button";

type ContactsViewProps = {
  page: ContactsPage;
};

export function ContactsView({ page }: ContactsViewProps) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
          <p className="mt-1 text-sm text-gray-500">
            Synced from your HubSpot CRM
          </p>
        </div>
        <Link href="/contacts/new">
          <Button>Add contact</Button>
        </Link>
      </div>

      <ContactsTable
        contacts={page.contacts}
        nextCursor={page.nextCursor}
      />
    </div>
  );
}
