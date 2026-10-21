import { redirect } from "next/navigation";

export const instant = false;

/** Add-contact now opens as a modal on /contacts. */
export default function NewContactPage() {
  redirect("/contacts?add=1");
}
