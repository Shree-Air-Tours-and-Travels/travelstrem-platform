"use client";

import Link from "next/link";
import { useState } from "react";

type AgencyCardProps = { brandName: string; description: string; phone: string; email: string; address?: string };

export function AgencyCard({ brandName, description, phone, email, address }: AgencyCardProps) {
  const [toggled, setToggled] = useState(false);
  const [hovered, setHovered] = useState(false);
  const flipped = toggled || hovered;
  return <div className={`sa-agency-card${flipped ? " is-flipped" : ""}`}>
    <div className="sa-agency-hover-area" onPointerEnter={event => { if (event.pointerType === "mouse" && matchMedia("(hover: hover)").matches) setHovered(true); }} onPointerLeave={() => setHovered(false)}>
    <div className="sa-agency-turn">
      <div className="sa-agency-face sa-agency-front" inert={flipped} aria-hidden={flipped}>
        <div className="sa-agency-top"><p className="sa-eyebrow">YOUR TRAVEL AGENCY IN JAIPUR</p><span aria-hidden="true">✈</span></div>
        <h1 className="sa-eyebrow">{brandName}</h1>
        <p className="sa-lead">{description}</p>
        <div className="sa-agency-route" aria-hidden="true"><div><small>FROM</small><strong>Your everyday</strong></div><span className="sa-agency-route-line">✈</span><div><small>TO</small><strong>Somewhere new</strong></div></div>
        <div className="sa-agency-tags">
          <div><span aria-hidden="true">✈</span><p><strong>Flights</strong><small>Near or far, take off</small></p></div>
          <div><span aria-hidden="true">⌂</span><p><strong>Stays</strong><small>Find your happy place</small></p></div>
          <div><span aria-hidden="true">☀</span><p><strong>Holidays</strong><small>Make room for adventure</small></p></div>
          <div><span aria-hidden="true">◎</span><p><strong>Travel services</strong><small>Visa, passport, cabs, trains &amp; insurance</small></p></div>
        </div>
        <p className="sa-agency-signoff"><span aria-hidden="true">✧</span> Personal plans. Unforgettable journeys.</p>
      </div>
      <div className="sa-agency-face sa-agency-back" inert={!flipped} aria-hidden={!flipped}>
        <p className="sa-eyebrow">LET’S MAKE YOUR NEXT JOURNEY HAPPEN</p>
        <h2 className="sa-eyebrow">{brandName}</h2>
        <p>One travel team for every part of your journey.</p>
        <div className="sa-hero-services"><span>Domestic &amp; international flights</span><span>Holiday packages &amp; tours</span><span>Hotel bookings &amp; group trips</span><span>Visa &amp; passport assistance</span><span>Cab &amp; train bookings</span><span>Travel insurance</span></div>
        <div className="sa-agency-details">{phone && <a href={`tel:${phone}`}><small>CALL OUR TEAM</small>{phone} ↗</a>}{email && <a href={`mailto:${email}`}><small>WRITE TO US</small>{email} ↗</a>}{address && <p><small>FIND OUR AGENCY</small>{address}</p>}</div>
        <Link href="/about" className="sa-text-link">Get to know our agency ↗</Link>
      </div>
    </div>
    </div>
    <div className="sa-agency-primary-action"><Link href="/contact" className="sa-button">Plan my journey ↗</Link></div>
    <button className="sa-agency-flip" type="button" onClick={() => { setToggled(!flipped); setHovered(false); }} aria-label={flipped ? "Show front of agency card" : "Show agency services and contact details"} aria-pressed={flipped}><span aria-hidden="true">↻</span> {flipped ? "Back to Shree Air" : "Flip for services & contact"}</button>
  </div>;
}
