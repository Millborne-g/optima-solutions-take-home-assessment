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
    <div className="mx-auto max-w-xl min-w-0">
      <nav className="mb-6 text-sm text-muted-foreground" aria-label="Breadcrumb">
        <Link
          href="/contacts"
          className="hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring rounded"
        >
          Contacts
        </Link>
        <span className="mx-2" aria-hidden="true">
          ›
        </span>
        <span className="text-foreground">
          {isEdit ? "Edit contact" : "New contact"}
        </span>
      </nav>

      <h1 className="mb-6 hidden text-2xl font-bold text-foreground md:block">
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
