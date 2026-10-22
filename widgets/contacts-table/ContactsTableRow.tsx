import type { Contact } from "@/entities/contact/model/types";
import { AvatarInitials } from "@/shared/ui/AvatarInitials";

type ContactsTableRowProps = {
  contact: Contact;
  onEditContact: (contact: Contact) => void;
};

export function ContactsTableRow({
  contact,
  onEditContact,
}: ContactsTableRowProps) {
  const fullName = [contact.firstName, contact.lastName]
    .filter(Boolean)
    .join(" ");

  return (
    <tr className="transition-colors hover:bg-surface-subtle">
      <td className="px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <AvatarInitials name={fullName || null} email={contact.email} />
          <span className="truncate text-sm font-medium text-foreground">
            {fullName || (
              <span className="italic text-muted-foreground">No name</span>
            )}
          </span>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">{contact.email}</td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {contact.phone ?? <span className="text-muted-foreground">—</span>}
      </td>
      <td className="px-4 py-3 text-right">
        <button
          type="button"
          onClick={() => onEditContact(contact)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring rounded"
        >
          <EditIcon />
          Edit
        </button>
      </td>
    </tr>
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
