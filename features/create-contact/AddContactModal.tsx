"use client";

import { Modal } from "@/shared/ui/Modal";
import { CreateContactForm } from "./CreateContactForm";

type AddContactModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
};

export function AddContactModal({
  open,
  onClose,
  onCreated,
}: AddContactModalProps) {
  return (
    <Modal open={open} title="Add contact" onClose={onClose}>
      <CreateContactForm onCancel={onClose} onSuccess={onCreated} />
    </Modal>
  );
}
