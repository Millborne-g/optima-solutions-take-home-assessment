import { redirect } from "next/navigation";

/**
 * Root page — redirects to the contacts dashboard.
 */
export default function RootPage() {
  redirect("/contacts");
}
