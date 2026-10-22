"use client";

import { useState } from "react";
import type { Contact } from "@/entities/contact/model/types";

export type EditContactState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; contact: Contact }
  | { status: "error"; message: string };

export type EditContactFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

export function useEditContact(contactId: string) {
  const [state, setState] = useState<EditContactState>({ status: "idle" });

  async function submit(values: EditContactFormValues): Promise<boolean> {
    setState({ status: "loading" });

    // Only send fields that have a value (partial update).
    const payload: Record<string, string> = {};
    if (values.firstName) payload.firstName = values.firstName;
    if (values.lastName) payload.lastName = values.lastName;
    if (values.email) payload.email = values.email;
    if (values.phone) payload.phone = values.phone;

    try {
      const res = await fetch(`/api/contacts/${contactId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as
        | { contact: Contact }
        | { error: string; code: string };

      if (!res.ok) {
        setState({
          status: "error",
          message:
            "error" in data
              ? data.error
              : `Request failed (${res.status})`,
        });
        return false;
      }

      if ("contact" in data) {
        setState({ status: "success", contact: data.contact });
        return true;
      }

      return false;
    } catch {
      setState({
        status: "error",
        message: "Network error. Please try again.",
      });
      return false;
    }
  }

  return { state, submit };
}
