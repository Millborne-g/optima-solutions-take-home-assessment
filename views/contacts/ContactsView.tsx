"use client";

import { useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { ContactsPage } from "@/entities/contact/model/types";
import { AddContactModal } from "@/features/create-contact/AddContactModal";
import { ContactsTable } from "@/widgets/contacts-table/ContactsTable";
import { Button } from "@/shared/ui/Button";

type ContactsViewProps = {
  page: ContactsPage;
  startAdd?: boolean;
};

export function ContactsView({ page, startAdd = false }: ContactsViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(startAdd);

  const clearAddParam = useCallback(() => {
    if (searchParams.get("add") !== "1") return;
    const params = new URLSearchParams(searchParams.toString());
    params.delete("add");
    const query = params.toString();
    router.replace(query ? `/contacts?${query}` : "/contacts");
  }, [router, searchParams]);

  const close = useCallback(() => {
    setOpen(false);
    clearAddParam();
  }, [clearAddParam]);

  const created = useCallback(() => {
    setOpen(false);
    clearAddParam();
    router.refresh();
  }, [clearAddParam, router]);

  return (
    <div className="mx-auto max-w-5xl min-w-0">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="hidden md:block">
          <h1 className="text-2xl font-bold text-foreground">Contacts</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Synced from your HubSpot CRM
          </p>
        </div>
        <Button className="md:ml-auto" onClick={() => setOpen(true)}>
          Add contact
        </Button>
      </header>

      <ContactsTable
        contacts={page.contacts}
        nextCursor={page.nextCursor}
        onAddContact={() => setOpen(true)}
      />

      <AddContactModal open={open} onClose={close} onCreated={created} />
    </div>
  );
}
