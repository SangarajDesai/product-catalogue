import { useMutation } from "@tanstack/react-query";
import { useId, useRef, useState, type FormEvent } from "react";
import { Button } from "../../../shared/components/button";
import { ApiError } from "../../../shared/http/api-client";
import { enquiryContactSchema, type EnquiryContact } from "../api/schemas/enquiry-contact.schema";
import { submitEnquiry } from "../api/submit-enquiry";

type ContactErrors = { name?: string; email?: string };

export function EnquiryForm({ productId }: { productId: number }) {
  const fieldId = useId();
  const [fields, setFields] = useState({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState<ContactErrors>({});
  const submitting = useRef(false);
  const mutation = useMutation({
    mutationFn: (contact: EnquiryContact) => submitEnquiry(productId, contact),
    retry: false,
    onSettled: () => { submitting.current = false; },
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;

    const result = enquiryContactSchema.safeParse(fields);
    if (!result.success) {
      setErrors({
        name: result.error.issues.find(({ path }) => path[0] === "name")?.message,
        email: result.error.issues.find(({ path }) => path[0] === "email")?.message,
      });
      return;
    }

    setErrors({});
    submitting.current = true;
    mutation.mutate(result.data);
  }

  if (mutation.isSuccess) {
    return <p className="enquiry-confirmation" role="status">Thank you. Your enquiry was sent.</p>;
  }

  const error = mutation.error;
  return (
    <form className="enquiry-form" aria-label="Product enquiry" noValidate onSubmit={submit}>
      <fieldset disabled={mutation.isPending}>
        <legend>Product enquiry</legend>
        <div className="enquiry-field">
          <label htmlFor={`${fieldId}-name`}>Name</label>
          <input
            id={`${fieldId}-name`}
            name="name"
            autoComplete="name"
            autoFocus
            required
            value={fields.name}
            onChange={(event) => setFields({ ...fields, name: event.target.value })}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? `${fieldId}-name-error` : undefined}
          />
          {errors.name && <p id={`${fieldId}-name-error`} role="alert">{errors.name}</p>}
        </div>
        <div className="enquiry-field">
          <label htmlFor={`${fieldId}-email`}>Email address</label>
          <input
            id={`${fieldId}-email`}
            name="email"
            type="email"
            autoComplete="email"
            required
            value={fields.email}
            onChange={(event) => setFields({ ...fields, email: event.target.value })}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? `${fieldId}-email-error` : undefined}
          />
          {errors.email && <p id={`${fieldId}-email-error`} role="alert">{errors.email}</p>}
        </div>
        <div className="enquiry-field">
          <label htmlFor={`${fieldId}-message`}>Message (optional)</label>
          <textarea
            id={`${fieldId}-message`}
            name="message"
            rows={3}
            value={fields.message}
            onChange={(event) => setFields({ ...fields, message: event.target.value })}
          />
        </div>
        {mutation.isError && (
          <div className="enquiry-request-error" role="alert">
            <p>{error instanceof ApiError ? error.message : "Could not send the enquiry. Try again."}</p>
            {error instanceof ApiError && error.requestId && <p>Request ID: {error.requestId}</p>}
          </div>
        )}
        <Button type="submit" className="enquiry-button">
          {mutation.isPending ? "Sending…" : mutation.isError ? "Try again" : "Send enquiry"}
        </Button>
      </fieldset>
    </form>
  );
}
