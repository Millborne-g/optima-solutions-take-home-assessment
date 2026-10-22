import { redirect } from "next/navigation";

export const instant = false;

/** Edit contact opens as a modal on /contacts. */
export default async function EditContactPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/contacts?edit=${encodeURIComponent(id)}`);
}
