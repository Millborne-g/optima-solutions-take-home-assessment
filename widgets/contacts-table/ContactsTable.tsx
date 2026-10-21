"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { Contact } from "@/entities/contact/model/types";
import { ContactsTableRow } from "./ContactsTableRow";
import { Button } from "@/shared/ui/Button";

type ContactsTableProps = {
  contacts: Contact[];
  nextCursor: string | null;
  onAddContact: () => void;
};

export function ContactsTable({
  contacts,
  nextCursor,
  onAddContact,
}: ContactsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function loadNextPage() {
    if (!nextCursor) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("after", nextCursor);
    router.push(`/contacts?${params.toString()}`);
  }

  if (contacts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface py-16 text-center">
        <p className="text-sm text-muted-foreground">No contacts found.</p>
        <button
          type="button"
          onClick={onAddContact}
          className="mt-3 inline-block text-sm font-medium text-primary hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring rounded"
        >
          Add your first contact →
        </button>
      </div>
    );
  }

  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="border-b border-border bg-surface-subtle">
            <tr>
              <th
                scope="col"
                className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                Name
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                Email
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                Phone
              </th>
              <th
                scope="col"
                className="sr-only px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {contacts.map((contact) => (
              <ContactsTableRow key={contact.id} contact={contact} />
            ))}
          </tbody>
        </table>
      </div>

      {nextCursor && (
        <div className="flex justify-center border-t border-border bg-surface-subtle px-4 py-3">
          <Button variant="secondary" size="sm" onClick={loadNextPage}>
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}
