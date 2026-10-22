"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Contact, ContactsPage } from "@/entities/contact/model/types";
import { ContactModal } from "@/features/create-contact/ContactModal";
import { ContactsTable } from "@/widgets/contacts-table/ContactsTable";
import { Button } from "@/shared/ui/Button";
import { DebouncedSearchField } from "@/shared/ui/DebouncedSearchField";
import { PageContainer, PageHeader } from "@/shared/ui/PageContainer";
import { useState } from "react";

type ContactsViewProps = {
  page: ContactsPage;
  query?: string;
  total?: number | null;
  startAdd?: boolean;
  startEditContact?: Contact | null;
};

export function ContactsView({
  page,
  query = "",
  total = null,
  startAdd = false,
  startEditContact = null,
}: ContactsViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [modalOpen, setModalOpen] = useState(
    startAdd || startEditContact != null,
  );
  const [modalMode, setModalMode] = useState<"create" | "edit">(
    startEditContact != null ? "edit" : "create",
  );
  const [editingContact, setEditingContact] = useState<Contact | null>(
    startEditContact,
  );

  const commitSearch = useCallback(
    (next: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("after");
      params.delete("history");
      params.delete("add");
      params.delete("edit");
      if (next === "") {
        params.delete("q");
      } else {
        params.set("q", next);
      }
      const qs = params.toString();
      router.push(qs ? `/contacts?${qs}` : "/contacts");
    },
    [router, searchParams],
  );

  const clearModalParams = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    let changed = false;
    if (params.get("add") === "1") {
      params.delete("add");
      changed = true;
    }
    if (params.has("edit")) {
      params.delete("edit");
      changed = true;
    }
    if (!changed) return;
    const qs = params.toString();
    router.replace(qs ? `/contacts?${qs}` : "/contacts");
  }, [router, searchParams]);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setEditingContact(null);
    clearModalParams();
  }, [clearModalParams]);

  const saved = useCallback(() => {
    setModalOpen(false);
    setEditingContact(null);
    clearModalParams();
    router.refresh();
  }, [clearModalParams, router]);

  const openCreate = useCallback(() => {
    setModalMode("create");
    setEditingContact(null);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((contact: Contact) => {
    setModalMode("edit");
    setEditingContact(contact);
    setModalOpen(true);
  }, []);

  const resolvedTotal = total ?? page.total ?? page.contacts.length;

  return (
    <PageContainer>
      <PageHeader
        title="Contacts"
        description="Synced from your HubSpot CRM"
        actions={
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center md:ml-auto">
            <DebouncedSearchField
              key={query || "__empty"}
              initialValue={query}
              onCommit={commitSearch}
              placeholder="Search contacts"
              aria-label="Search contacts"
            />
            <Button onClick={openCreate}>
              <span className="mr-1" aria-hidden="true">
                +
              </span>
              Add contact
            </Button>
          </div>
        }
      />

      <ContactsTable
        contacts={page.contacts}
        nextCursor={page.nextCursor}
        total={resolvedTotal}
        onAddContact={openCreate}
        onEditContact={openEdit}
      />

      <ContactModal
        open={modalOpen}
        mode={modalMode}
        contact={modalMode === "edit" ? editingContact ?? undefined : undefined}
        onClose={closeModal}
        onSaved={saved}
      />
    </PageContainer>
  );
}
