"use client";

import { useState } from "react";
import type { Contact } from "@/entities/contact/model/types";

export type CreateContactState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; contact: Contact; wasUpdated: boolean }
  | { status: "error"; message: string };

export type CreateContactFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

export function useCreateContact() {
  const [state, setState] = useState<CreateContactState>({ status: "idle" });

  async function submit(values: CreateContactFormValues) {
    setState({ status: "loading" });

    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: values.firstName || undefined,
          lastName: values.lastName || undefined,
          email: values.email,
          phone: values.phone || undefined,
        }),
      });

      const data = (await res.json()) as
        | { contact: Contact; wasUpdated: boolean }
        | { error: string; code: string };

      if (!res.ok) {
        setState({
          status: "error",
          message:
            "error" in data
              ? data.error
              : `Request failed (${res.status})`,
        });
        return;
      }

      if ("contact" in data) {
        setState({
          status: "success",
          contact: data.contact,
          wasUpdated: data.wasUpdated,
        });
      }
    } catch {
      setState({
        status: "error",
        message: "Network error. Please try again.",
      });
    }
  }

  function reset() {
    setState({ status: "idle" });
  }

  return { state, submit, reset };
}
