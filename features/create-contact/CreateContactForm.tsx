"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { FormField } from "@/shared/ui/FormField";
import {
  useCreateContact,
  type CreateContactFormValues,
} from "./useCreateContact";

type CreateContactFormProps = {
  onCancel?: () => void;
  onSuccess?: () => void;
};

export function CreateContactForm({
  onCancel,
  onSuccess,
}: CreateContactFormProps) {
  const router = useRouter();
  const { state, submit } = useCreateContact();

  const [values, setValues] = useState<CreateContactFormValues>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setValues((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ok = await submit(values);
    if (ok && onSuccess) onSuccess();
  }

  if (state.status === "success") {
    return (
      <div className="rounded-md border border-success/30 bg-success-bg p-4 text-sm text-success">
        <p className="font-medium">
          {state.wasUpdated
            ? "Contact updated successfully."
            : "Contact created successfully."}
        </p>
        <p className="mt-1 opacity-90">
          {[state.contact.firstName, state.contact.lastName]
            .filter(Boolean)
            .join(" ") || state.contact.email}
        </p>
        <div className="mt-3 flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              if (onSuccess) {
                onSuccess();
                return;
              }
              router.push("/contacts");
            }}
          >
            {onSuccess ? "Done" : "View all contacts"}
          </Button>
          {!onSuccess && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => router.push(`/contacts/${state.contact.id}/edit`)}
            >
              Edit contact
            </Button>
          )}
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
          className="rounded-md border border-danger/30 bg-danger-bg px-4 py-3 text-sm text-danger"
          role="alert"
        >
          {state.message}
        </div>
      )}

      <div className="flex gap-3 pt-1">
        <Button
          type="submit"
          isLoading={state.status === "loading"}
          disabled={!values.email}
        >
          {state.status === "loading" ? "Saving…" : "Save contact"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            if (onCancel) {
              onCancel();
              return;
            }
            router.push("/contacts");
          }}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
