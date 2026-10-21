import Link from "next/link";
import type { Contact } from "@/entities/contact/model/types";

type ContactsTableRowProps = {
  contact: Contact;
};

export function ContactsTableRow({ contact }: ContactsTableRowProps) {
  const fullName = [contact.firstName, contact.lastName]
    .filter(Boolean)
    .join(" ");

  return (
    <tr className="transition-colors hover:bg-surface-subtle">
      <td className="px-4 py-3 text-sm font-medium text-foreground">
        {fullName || (
          <span className="italic text-muted-foreground">No name</span>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-foreground">{contact.email}</td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {contact.phone ?? <span className="text-muted-foreground">—</span>}
      </td>
      <td className="px-4 py-3 text-right">
        <Link
          href={`/contacts/${contact.id}/edit`}
          className="text-sm font-medium text-primary hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring rounded"
        >
          Edit
        </Link>
      </td>
    </tr>
  );
}
