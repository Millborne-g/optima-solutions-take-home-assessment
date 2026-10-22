import type { Contact } from "@/entities/contact/model/types";
import { AvatarInitials } from "@/shared/ui/AvatarInitials";

type ContactsCardProps = {
  contact: Contact;
  onEditContact: (contact: Contact) => void;
};

export function ContactsCard({ contact, onEditContact }: ContactsCardProps) {
  const fullName = [contact.firstName, contact.lastName]
    .filter(Boolean)
    .join(" ");

  return (
    <article
      className="rounded-xl border border-border bg-surface p-4 shadow-sm"
    >
      <div className="flex min-w-0 items-center gap-3">
        <AvatarInitials name={fullName || null} email={contact.email} />
        <span className="min-w-0 truncate text-sm font-medium text-foreground">
          {fullName || (
            <span className="italic text-muted-foreground">No name</span>
          )}
        </span>
      </div>

      <dl className="mt-3 space-y-2 text-sm">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Email
          </dt>
          <dd className="mt-0.5 break-all text-muted-foreground">
            {contact.email}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Phone
          </dt>
          <dd className="mt-0.5 text-muted-foreground">
            {contact.phone ?? "—"}
          </dd>
        </div>
      </dl>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={() => onEditContact(contact)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring rounded"
        >
          <EditIcon />
          Edit
        </button>
      </div>
    </article>
  );
}

function EditIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 16.5V20h3.5L18 9.5 14.5 6 4 16.5z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M12.5 7.5l4 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
