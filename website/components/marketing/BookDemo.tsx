"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { site } from "@/lib/content";

export function BookDemo({ compact = false }: { compact?: boolean }) {
  const [sent, setSent] = useState(false);
  const [minimumDate, setMinimumDate] = useState("");
  useEffect(() => {
    const date = new Date();
    setMinimumDate(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`);
  }, []);

  if (compact) return <section className="demo-teaser"><div className="shell demo-teaser-inner"><div><span className="eyebrow light">See it in your workflow</span><h2>From travel discovery to daily operations—walk through the connected platform.</h2></div><Link className="button button-light" href={site.demoUrl}>Book a Demo <span aria-hidden="true">↗</span></Link></div></section>;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const lines = [
      "Hello TravelsTREM team,", "", "I would like to book a product demo.", "",
      `Name: ${values.get("name")}`, `Work email: ${values.get("email")}`, `Company: ${values.get("company")}`,
      `Phone: ${values.get("phone")}`, `Explore: ${values.get("scope")}`, `Preferred model: ${values.get("model")}`,
      `Preferred date: ${values.get("date")}`, `Preferred time: ${values.get("time")} IST`, "",
      `Notes: ${values.get("notes") || "None"}`
    ];
    setSent(true);
    window.location.href = `mailto:${site.email}?subject=${encodeURIComponent("TravelsTREM demo request")}&body=${encodeURIComponent(lines.join("\n"))}`;
  }

  return <section id="book-demo" className="section demo-section">
    <div className="shell demo-layout">
      <div className="demo-copy"><span className="eyebrow light">Product walkthrough</span><h2>Book your TravelsTREM demo.</h2><p>Choose the product scope, engagement model and a useful time. Your email app opens with everything prepared for review.</p><div className="demo-note"><strong>What to expect</strong><span>A guided platform walkthrough</span><span>Relevant product and workflow examples</span><span>Commercial discussion based on your scope</span></div></div>
      <form className="demo-form" onSubmit={submit}>
        <div className="form-grid">
          <label>Your name<input name="name" autoComplete="name" required /></label>
          <label>Work email<input name="email" type="email" autoComplete="email" required /></label>
          <label>Company<input name="company" autoComplete="organization" required /></label>
          <label>Phone<input name="phone" type="tel" autoComplete="tel" required /></label>
          <label>What would you like to explore?<select name="scope" defaultValue="Complete TravelsTREM SaaS"><option>Complete TravelsTREM SaaS</option><option>Trevio</option><option>Trevista</option><option>TreHub</option><option>Traveller Dashboard</option><option>PartnerTREM + AdminTREM</option><option>Booking Engine</option></select></label>
          <label>Preferred model<select name="model" defaultValue="Complete SaaS product"><option>Complete SaaS product</option><option>White-labelled platform</option><option>Individual product</option><option>Partnership</option></select></label>
          <label>Preferred date<input name="date" type="date" min={minimumDate} required /></label>
          <label>Preferred time (IST)<select name="time" defaultValue="" required><option value="" disabled>Select a time slot</option><option>10:00 AM</option><option>12:00 PM</option><option>3:00 PM</option><option>5:00 PM</option></select></label>
        </div>
        <label>Anything we should prepare? <small>(optional)</small><textarea name="notes" rows={4} placeholder="Your current setup, priorities or questions" /></label>
        <button className="button" type="submit">Prepare demo request <span aria-hidden="true">↗</span></button>
        <p className="form-help" role="status">{sent ? "Your email app is opening with the request prepared." : "Times are preferences, not confirmed availability. Review and send your prepared email; our team will confirm the meeting."}</p>
      </form>
    </div>
  </section>;
}
