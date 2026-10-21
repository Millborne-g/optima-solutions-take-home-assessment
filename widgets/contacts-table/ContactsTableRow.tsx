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
    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3 text-sm font-medium text-gray-900">
        {fullName || <span className="text-gray-400 italic">No name</span>}
      </td>
      <td className="px-4 py-3 text-sm text-gray-700">{contact.email}</td>
      <td className="px-4 py-3 text-sm text-gray-500">
        {contact.phone ?? <span className="text-gray-300">—</span>}
      </td>
      <td className="px-4 py-3 text-right">
        <Link
          href={`/contacts/${contact.id}/edit`}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          Edit
        </Link>
      </td>
    </tr>
  );
}
