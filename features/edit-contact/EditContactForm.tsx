"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Contact } from "@/entities/contact/model/types";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { FormField } from "@/shared/ui/FormField";
import { useEditContact, type EditContactFormValues } from "./useEditContact";

type EditContactFormProps = {
  contact: Contact;
};

export function EditContactForm({ contact }: EditContactFormProps) {
  const router = useRouter();
  const { state, submit } = useEditContact(contact.id);

  const [values, setValues] = useState<EditContactFormValues>({
    firstName: contact.firstName ?? "",
    lastName: contact.lastName ?? "",
    email: contact.email,
    phone: contact.phone ?? "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setValues((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submit(values);
  }

  if (state.status === "success") {
    return (
      <div className="rounded-md bg-green-50 border border-green-200 p-4 text-sm text-green-800">
        <p className="font-medium">Contact updated successfully.</p>
        <div className="mt-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => router.push("/contacts")}
          >
            Back to contacts
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="First name" htmlFor="firstName">
          <Input
            id="firstName"
            name="firstName"
            type="text"
            value={values.firstName}
            onChange={handleChange}
            placeholder="Jane"
            autoComplete="given-name"
          />
        </FormField>

        <FormField label="Last name" htmlFor="lastName">
          <Input
            id="lastName"
            name="lastName"
            type="text"
            value={values.lastName}
            onChange={handleChange}
            placeholder="Smith"
            autoComplete="family-name"
          />
        </FormField>
      </div>

      <FormField label="Email address" htmlFor="email" required>
        <Input
          id="email"
          name="email"
          type="email"
          value={values.email}
          onChange={handleChange}
          placeholder="jane@example.com"
          required
          autoComplete="email"
        />
      </FormField>

      <FormField label="Phone number" htmlFor="phone">
        <Input
          id="phone"
          name="phone"
          type="tel"
          value={values.phone}
          onChange={handleChange}
          placeholder="+1 555 000 0000"
          autoComplete="tel"
        />
      </FormField>

      {state.status === "error" && (
        <div
          className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {state.message}
        </div>
      )}

      <div className="flex gap-3 pt-1">
        <Button
          type="submit"
          isLoading={state.status === "loading"}
        >
          {state.status === "loading" ? "Saving…" : "Save changes"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push("/contacts")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
