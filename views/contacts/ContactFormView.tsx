import Link from "next/link";
import type { Contact } from "@/entities/contact/model/types";
import { CreateContactForm } from "@/features/create-contact/CreateContactForm";
import { EditContactForm } from "@/features/edit-contact/EditContactForm";

type ContactFormViewProps =
  | { mode: "create" }
  | { mode: "edit"; contact: Contact };

export function ContactFormView(props: ContactFormViewProps) {
  const isEdit = props.mode === "edit";

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <nav className="mb-6 text-sm text-gray-500">
        <Link href="/contacts" className="hover:text-gray-700">
          Contacts
        </Link>
        <span className="mx-2">›</span>
        <span className="text-gray-900">
          {isEdit ? "Edit contact" : "New contact"}
        </span>
      </nav>

      <h1 className="mb-6 text-2xl font-bold text-gray-900">
        {isEdit ? "Edit contact" : "New contact"}
      </h1>

      {isEdit ? (
        <EditContactForm contact={props.contact} />
      ) : (
        <CreateContactForm />
      )}
    </div>
  );
}
