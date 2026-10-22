"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { Contact } from "@/entities/contact/model/types";
import { ContactsCard } from "./ContactsCard";
import { ContactsTableRow } from "./ContactsTableRow";
import { TablePagination } from "@/shared/ui/TablePagination";

type ContactsTableProps = {
  contacts: Contact[];
  nextCursor: string | null;
  total: number | null;
  onAddContact: () => void;
  onEditContact: (contact: Contact) => void;
};

/** Sentinel for “came from page 1” (empty `after`). Must not serialize to "". */
const FIRST_PAGE_TOKEN = ".";

/** Parse comma-separated history stack (`.` means page 1 / no after). */
function parseHistory(raw: string | null): string[] {
  if (raw == null || raw === "") return [];
  return raw.split(",").map((s) => (s === FIRST_PAGE_TOKEN ? "" : s));
}

function serializeHistory(stack: string[]): string | null {
  if (stack.length === 0) return null;
  return stack.map((s) => (s === "" ? FIRST_PAGE_TOKEN : s)).join(",");
}

export function ContactsTable({
  contacts,
  nextCursor,
  total,
  onAddContact,
  onEditContact,
}: ContactsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentAfter = searchParams.get("after");
  const history = parseHistory(searchParams.get("history"));

  function pushContactsQuery(next: {
    after?: string | null;
    history?: string[] | null;
  }) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("add");
    params.delete("edit");

    if (next.after == null || next.after === "") {
      params.delete("after");
    } else {
      params.set("after", next.after);
    }

    const hist =
      next.history === undefined
        ? searchParams.get("history")
        : serializeHistory(next.history ?? []);
    if (hist == null || hist === "") {
      params.delete("history");
    } else {
      params.set("history", hist);
    }

    const query = params.toString();
    router.push(query ? `/contacts?${query}` : "/contacts");
  }

  function goNext() {
    if (!nextCursor) return;
    const newHistory = [...history, currentAfter ?? ""];
    pushContactsQuery({ after: nextCursor, history: newHistory });
  }

  function goPrevious() {
    if (history.length === 0) return;
    const previousAfter = history[history.length - 1];
    const newHistory = history.slice(0, -1);
    pushContactsQuery({
      after: previousAfter === "" ? null : previousAfter,
      history: newHistory,
    });
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

  const showing = contacts.length;
  const meta =
    total != null && total > 0
      ? `Showing ${showing} of ${total} contacts`
      : `Showing ${showing} contacts`;

  return (
    <div className="min-w-0 rounded-xl border border-border bg-surface shadow-sm">
      <div className="space-y-3 p-3 md:hidden">
        {contacts.map((contact) => (
          <ContactsCard
            key={contact.id}
            contact={contact}
            onEditContact={onEditContact}
          />
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
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
              <ContactsTableRow
                key={contact.id}
                contact={contact}
                onEditContact={onEditContact}
              />
            ))}
          </tbody>
        </table>
      </div>

      <TablePagination
        hasPrevious={history.length > 0}
        hasNext={!!nextCursor}
        onPrevious={goPrevious}
        onNext={goNext}
        meta={meta}
        trailingMeta="Synced from HubSpot"
      />
    </div>
  );
}
