import { pageMetadata } from "@/lib/seo";
import Link from "next/link";

export const metadata = pageMetadata(
  "Meet Our Travel Agency Leadership",
  "Meet Shreekant Goyal, Founder and Managing Director, and Nisha Goyal, Chairperson, who guide Shree Air Tours & Travels and its travel services.",
  "/leads",
);

export default function LeadsPage() {
  const directorPhoto = process.env.SHREE_AIR_SHREEKANT_PHOTO_URL;
  const chairpersonPhoto = process.env.SHREE_AIR_NISHA_PHOTO_URL;
  return (
    <section className="sa-shell sa-section">
      <p className="sa-eyebrow">THE PEOPLE WHO GUIDE YOUR JOURNEY</p>
      <h1>
        Personal service.
        <br />
        Experienced leadership.
      </h1>
      <div className="sa-director-grid">
        <figure className="sa-director-frame">
          {directorPhoto ? (
            <img
              src={directorPhoto}
              alt="Mr. Shreekant Goyal, Founder and Managing Director of Shree Air Tours & Travels"
              width="420"
              height="525"
              fetchPriority="high"
            />
          ) : (
            <div
              className="sa-director-placeholder"
              role="img"
              aria-label="Portrait placeholder for Mr. Shreekant Goyal"
            >
              <span aria-hidden="true">SG</span>
              <p>Mr. Shreekant Goyal</p>
            </div>
          )}
          <figcaption>
            Mr. Shreekant Goyal <span>Founder &amp; Managing Director</span>
          </figcaption>
        </figure>
        <div className="sa-story-body">
          <p className="sa-eyebrow">MEET OUR DIRECTOR</p>
          <h2>Mr. Shreekant Goyal</h2>
          <p>
            As Founder &amp; Managing Director, Shreekant Goyal leads Shree Air’s travel operations
            and relationships. His work brings personal attention to the details of planning a
            journey, from discussing options to helping travellers understand their choices.
          </p>
          <h2>Experience shaped around travellers.</h2>
          <p>
            His focus spans flight planning, hotel stays, holidays and group journeys. Understanding
            a traveller’s dates, preferences and budget is the starting point for a conversation
            about the available options.
          </p>
          <p>
            Working with travellers and travel partners, he guides the agency’s approach to clear
            communication, thoughtful planning and dependable customer service.
          </p>
          <Link href="/contact" className="sa-button">
            Speak to our team ↗
          </Link>
        </div>
      </div>
      <div className="sa-director-grid">
        <figure className="sa-director-frame">
          {chairpersonPhoto ? (
            <img
              src={chairpersonPhoto}
              alt="Mrs. Nisha Goyal, Chairperson of Shree Air Tours & Travels"
              width="420"
              height="525"
              loading="lazy"
            />
          ) : (
            <div
              className="sa-director-placeholder"
              role="img"
              aria-label="Portrait placeholder for Mrs. Nisha Goyal"
            >
              <span aria-hidden="true">NG</span>
              <p>Mrs. Nisha Goyal</p>
            </div>
          )}
          <figcaption>
            Mrs. Nisha Goyal <span>Chairperson</span>
          </figcaption>
        </figure>
        <div className="sa-story-body">
          <p className="sa-eyebrow">MEET OUR CHAIRPERSON</p>
          <h2>Mrs. Nisha Goyal</h2>
          <p>
            As Chairperson, Nisha Goyal guides Shree Air’s service culture and long-term direction,
            supporting the agency’s commitment to personal travel planning.
          </p>
          <h2>Personal attention at the heart of our agency.</h2>
          <p>
            Her focus supports thoughtful customer service and clear communication, keeping
            travellers at the centre of the agency’s approach.
          </p>
          <Link href="/contact" className="sa-button">
            Speak to our team ↗
          </Link>
        </div>
      </div>
    </section>
  );
}
