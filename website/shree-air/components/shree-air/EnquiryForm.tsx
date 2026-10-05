"use client";
import { useState, type FormEvent } from "react";

export function EnquiryForm() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    setBusy(true);
    setMessage("");
    setErrors({});
    setSuccess(false);
    try {
      const response = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fields: Object.fromEntries(new FormData(form)),
          url: window.location.href,
        }),
      });
      const result = await response.json();
      if (!response.ok || result.status !== "success") {
        setErrors(result.fieldErrors || {});
        setMessage(
          result.message || "We couldn’t send your enquiry. Please call our team or try again.",
        );
        return;
      }
      setSuccess(true);
      setMessage(
        result.message || "Your enquiry has been received. Our travel team will get in touch.",
      );
      form.reset();
    } catch {
      setMessage("We couldn’t connect. Please call our team or try again.");
    } finally {
      setBusy(false);
    }
  }
  const error = (field: string) =>
    errors[field] ? (
      <span id={`${field}-error`} className="sa-field-error">
        {errors[field]}
      </span>
    ) : null;
  return (
    <form className="sa-form" onSubmit={submit}>
      <h2>Tell us what you have in mind.</h2>
      <p>We’ll use these details to respond to your enquiry.</p>
      <fieldset disabled={busy}>
        <label htmlFor="name">
          Your name
          <input
            id="name"
            name="name"
            autoComplete="name"
            required
            maxLength={120}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "name-error" : undefined}
          />
          {error("name")}
        </label>
        <div className="sa-form-row">
          <label htmlFor="email">
            Email address
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
            />
            {error("email")}
          </label>
          <label htmlFor="phone">
            Mobile number
            <input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel-national"
              inputMode="numeric"
              required
              placeholder="10-digit Indian mobile number"
              aria-invalid={!!errors.phone}
              aria-describedby={errors.phone ? "phone-error" : undefined}
            />
            {error("phone")}
          </label>
        </div>
        <div className="sa-form-row">
          <label htmlFor="travellerCount">
            Number of travellers
            <input
              id="travellerCount"
              name="travellerCount"
              type="number"
              min="1"
              max="50"
              defaultValue="1"
              required
              aria-invalid={!!errors.travellerCount}
              aria-describedby={errors.travellerCount ? "travellerCount-error" : undefined}
            />
            {error("travellerCount")}
          </label>
          <label htmlFor="preferredContact">
            How should we contact you?
            <span className="sa-select-field">
              <select id="preferredContact" name="preferredContact" defaultValue="phone">
                <option value="phone">Phone call</option>
                <option value="email">Email</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
              <svg
                className="sa-select-chevron"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                focusable="false"
              >
                <path
                  d="m6 9 6 6 6-6"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            {error("preferredContact")}
          </label>
        </div>
        <label htmlFor="flightPreference">
          Flights for your journey
          <span className="sa-select-field">
            <select
              id="flightPreference"
              name="flightPreference"
              defaultValue="agent_recommendation"
            >
              <option value="agent_recommendation">Discuss with the travel team</option>
              <option value="with_flights">Include flights</option>
              <option value="without_flights">I have arranged my flights</option>
            </select>
            <svg
              className="sa-select-chevron"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              focusable="false"
            >
              <path
                d="m6 9 6 6 6-6"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          {error("flightPreference")}
        </label>
        <label htmlFor="message">
          Your travel plans
          <textarea
            id="message"
            name="message"
            rows={5}
            required
            maxLength={2000}
            placeholder="Destination, dates, interests and anything you’d like us to help with…"
            aria-invalid={!!errors.message}
            aria-describedby={errors.message ? "message-error" : undefined}
          />
          {error("message")}
        </label>
        <button className="sa-button" type="submit">
          {busy ? "Sending your enquiry…" : "Send my enquiry ↗"}
        </button>
      </fieldset>
      <p
        className={success ? "sa-form-success" : "sa-form-status"}
        role={success ? "status" : "alert"}
        aria-live="polite"
      >
        {message}
      </p>
    </form>
  );
}
