"use client";

import type { Contact } from "@/entities/contact/model/types";
import { EditContactForm } from "@/features/edit-contact/EditContactForm";
import { Modal } from "@/shared/ui/Modal";
import { CreateContactForm } from "./CreateContactForm";

type ContactModalProps = {
  open: boolean;
  mode: "create" | "edit";
  contact?: Contact;
  onClose: () => void;
  onSaved: () => void;
};

export function ContactModal({
  open,
  mode,
  contact,
  onClose,
  onSaved,
}: ContactModalProps) {
  const title = mode === "edit" ? "Edit contact" : "Add contact";

  return (
    <Modal open={open} title={title} onClose={onClose}>
      {mode === "edit" && contact ? (
        <EditContactForm
          key={contact.id}
          contact={contact}
          onCancel={onClose}
          onSuccess={onSaved}
        />
      ) : (
        <CreateContactForm
          key="create"
          onCancel={onClose}
          onSuccess={onSaved}
        />
      )}
    </Modal>
  );
}
