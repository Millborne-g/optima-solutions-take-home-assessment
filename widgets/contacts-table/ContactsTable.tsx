"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { Contact } from "@/entities/contact/model/types";
import { ContactsTableRow } from "./ContactsTableRow";
import { Button } from "@/shared/ui/Button";

type ContactsTableProps = {
  contacts: Contact[];
  nextCursor: string | null;
};

export function ContactsTable({ contacts, nextCursor }: ContactsTableProps) {
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
      <div className="rounded-lg border border-dashed border-gray-300 py-16 text-center">
        <p className="text-gray-500 text-sm">No contacts found.</p>
        <Link
          href="/contacts/new"
          className="mt-3 inline-block text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          Add your first contact →
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
      <table className="w-full text-left">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Name
            </th>
            <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Email
            </th>
            <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Phone
            </th>
            <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide sr-only">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {contacts.map((contact) => (
            <ContactsTableRow key={contact.id} contact={contact} />
          ))}
        </tbody>
      </table>

      {nextCursor && (
        <div className="flex justify-center border-t border-gray-100 bg-gray-50 px-4 py-3">
          <Button variant="secondary" size="sm" onClick={loadNextPage}>
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}
