import React, { useState } from "react";
import { tripId } from "../utils";

export default function Profile({ trips, labels, wishlist }) {
  const [activeTab, setActiveTab] = useState("bookings");
  const wishedTrips = wishlist.map((id) => trips.find((trip) => tripId(trip) === id)).filter(Boolean);

  return (
    <main className="trevio-container trevio-profile">
      <aside className="trevio-profile-sidebar">
        <div className="trevio-profile-avatar">{labels.brandMark}</div>
        <h3>{labels.profileTitle}</h3>
        <button className={activeTab === "bookings" ? "is-active" : ""} onClick={() => setActiveTab("bookings")}>{labels.profileBookingsTab}</button>
        <button className={activeTab === "wishlist" ? "is-active" : ""} onClick={() => setActiveTab("wishlist")}>{labels.profileWishlistTab} ({wishlist.length})</button>
        <button className={activeTab === "details" ? "is-active" : ""} onClick={() => setActiveTab("details")}>{labels.profileDetailsTab}</button>
      </aside>
      <section className="trevio-content-card">
        {activeTab === "bookings" && <><h2>{labels.profileBookingsTitle}</h2><p>{labels.profileBookingsDescription}</p><div className="trevio-empty">{labels.profileBookingsEmpty}</div></>}
        {activeTab === "wishlist" && <><h2>{labels.profileWishlistTab}</h2>{wishedTrips.length ? wishedTrips.map((trip) => <div className="trevio-profile-row" key={tripId(trip)}><strong>{trip.title}</strong><span>{trip.location} · {trip.duration}</span></div>) : <div className="trevio-empty">{labels.profileWishlistEmpty}</div>}</>}
        {activeTab === "details" && <><h2>{labels.profileDetailsTitle}</h2><p>{labels.profileDetailsDescription}</p><div className="trevio-list"><div>{labels.profileDetailsAccount}</div><div>{labels.profileDetailsPlatform}</div></div></>}
      </section>
    </main>
  );
}
