import React from "react";
import { Button, SubTitle, Paragraph, RecordReview } from "@packages/trem-ui";
import "../tours/TourView.scss";

function displayDuration(d) {
    if (!d) return "—";
    if (typeof d === "string") return d;
    if (typeof d === "object") return `${d.from || "—"} – ${d.to || "—"}`;
    return String(d);
}

export default function TripViewView({ trip, onClose, onEdit, panelRef }) {
    if (!trip) return null;

    const imageSrc = trip.image || (Array.isArray(trip.photos) && trip.photos[0]) || "";

    return (
        <div className="tour-view-overlay" role="dialog" aria-modal="true" aria-label={`${trip.title} details`} onClick={onClose}>
            <aside className="tour-view" ref={panelRef} tabIndex={-1} onClick={(e) => e.stopPropagation()}>
                <header className="tv-header">
                    <div className="tv-title">
                        <SubTitle text={trip.title || "Untitled Trip"} variant="primary" size="large" />
                        <div className="tv-meta">
                            {trip.location || ""}{trip.country && trip.country !== "India" ? `, ${trip.country}` : ""}
                        </div>
                    </div>
                    <div className="tv-actions">
                        <Button primaryClassName="btn" variant="solid" color="primary" onClick={() => onEdit(trip)} text="Edit" />
                        <Button primaryClassName="btn" variant="outline" onClick={onClose} aria-label="Close view" text="Close" />
                    </div>
                </header>

                <div className="tv-body">
                    <div className="tv-aside">
                        {imageSrc
                            ? <img src={imageSrc} alt={trip.title} className="tv-photo" />
                            : <div className="tv-photo tv-photo--fallback" aria-label="No trip image">No image available</div>}
                    </div>

                    <main className="tv-main" aria-label="Trip content">
                        <div className="tv-row">
                            <div className="tv-summary">
                                <Paragraph><strong>Duration:</strong> {displayDuration(trip.duration)}</Paragraph>
                                {trip.startDate && <Paragraph><strong>Start:</strong> {new Date(trip.startDate).toLocaleDateString()}</Paragraph>}
                                {trip.endDate && <Paragraph><strong>End:</strong> {new Date(trip.endDate).toLocaleDateString()}</Paragraph>}
                                <Paragraph><strong>Category:</strong> {trip.category || "—"}</Paragraph>
                                <Paragraph><strong>Status:</strong> {trip.status || "draft"}</Paragraph>
                                <Paragraph><strong>Price:</strong> {trip.price?.amount ? `₹${Number(trip.price.amount).toLocaleString("en-IN")}` : "—"}{trip.price?.currency && trip.price.currency !== "INR" ? ` ${trip.price.currency}` : ""}</Paragraph>
                                <Paragraph><strong>Token:</strong> {trip.price?.tokenAmount ? `₹${Number(trip.price.tokenAmount).toLocaleString("en-IN")}` : "—"}</Paragraph>
                                <Paragraph><strong>Seats:</strong> {trip.availability?.seatsAvailable ?? "—"} / {trip.availability?.totalSeats ?? "—"}</Paragraph>
                            </div>
                        </div>

                        <section className="tv-section">
                            <SubTitle text="Description" />
                            <Paragraph>{trip.description || "No description available."}</Paragraph>
                        </section>

                        <section className="tv-section">
                            <SubTitle text="Itinerary" />
                            {(trip.itinerary || []).length === 0 && <Paragraph>No itinerary provided.</Paragraph>}
                            {(trip.itinerary || []).map((it, idx) => (
                                <div key={it._id || idx} className="tv-it">
                                    <strong>Day {it.day || idx + 1}{it.title ? `, ${it.title}` : ""}</strong>
                                    {it.summary && <Paragraph>{it.summary}</Paragraph>}
                                </div>
                            ))}
                        </section>

                        {trip.inclusions && trip.inclusions.length > 0 && (
                            <section className="tv-section">
                                <SubTitle text="Inclusions" />
                                <ul>{trip.inclusions.map((item, i) => <li key={i}>{item}</li>)}</ul>
                            </section>
                        )}

                        {trip.exclusions && trip.exclusions.length > 0 && (
                            <section className="tv-section">
                                <SubTitle text="Exclusions" />
                                <ul>{trip.exclusions.map((item, i) => <li key={i}>{item}</li>)}</ul>
                            </section>
                        )}

                        {trip.preferences && Object.values(trip.preferences).some((items) => Array.isArray(items) && items.length) && (
                            <section className="tv-section"><SubTitle text="Guest preferences" />
                                {Object.entries(trip.preferences).map(([name, items]) => Array.isArray(items) && items.length ? <Paragraph key={name}><strong>{name.replace(/([A-Z])/g, " $1")}:</strong> {items.map((item) => item.label || item.value || item).join(", ")}</Paragraph> : null)}
                            </section>
                        )}
                        {trip.includedStays?.length > 0 && <section className="tv-section"><SubTitle text="Included stays" />{trip.includedStays.map((stay, index) => <Paragraph key={stay._id || index}><strong>{stay.propertyName || "Stay"}</strong> · {stay.location || "—"} · {stay.nights ?? 0} night(s) · {stay.roomType || "Room details not set"}{stay.meals?.length ? ` · ${stay.meals.join(", ")}` : ""}{stay.description ? ` — ${stay.description}` : ""}</Paragraph>)}</section>}
                        {trip.hotelOptions?.length > 0 && <section className="tv-section"><SubTitle text="Hotel upgrades" />{trip.hotelOptions.map((option, index) => <Paragraph key={option._id || index}><strong>{option.title || "Upgrade"}</strong>{option.recommended ? " · Recommended" : ""} · {option.costLabel || "Cost"}: {option.cost || "—"}{option.description ? ` — ${option.description}` : ""}</Paragraph>)}</section>}
                        {trip.extras?.length > 0 && <section className="tv-section"><SubTitle text="Optional extras" />{trip.extras.map((extra, index) => <Paragraph key={extra._id || index}><strong>{extra.title || "Extra"}</strong> · {extra.included ? "Included" : `${extra.currency || trip.price?.currency || "INR"} ${extra.price ?? 0}`}{extra.priceLabel ? ` (${extra.priceLabel})` : ""}{extra.description ? ` — ${extra.description}` : ""}</Paragraph>)}</section>}
                        {(trip.cancellationPolicy || trip.cancellation?.policy || trip.cancellation?.tiers?.length) && <section className="tv-section"><SubTitle text="Cancellation" /><Paragraph>{trip.cancellationPolicy || trip.cancellation?.policy || "—"}</Paragraph>{trip.cancellation?.tiers?.map((tier, index) => <Paragraph key={tier._id || index}>{tier.label || "Refund"}: {tier.refundPercent ?? "—"}% · {tier.daysBefore ?? "—"} days before departure{tier.description ? ` — ${tier.description}` : ""}</Paragraph>)}</section>}
                        <section className="tv-section"><SubTitle text="Ownership & audit" /><Paragraph><strong>Agency:</strong> {trip.agency?.name || "TravelsTREM platform"}</Paragraph><Paragraph><strong>Agent:</strong> {trip.ownerAgentName || "Master admin"}{trip.ownerAgentRef ? ` · ${trip.ownerAgentRef}` : ""}</Paragraph><Paragraph><strong>Verification:</strong> {trip.tremVerified ? `TREM verified${trip.tremVerifiedAt ? ` on ${new Date(trip.tremVerifiedAt).toLocaleDateString()}` : ""}` : "Not verified"}</Paragraph><Paragraph><strong>Created:</strong> {trip.createdAt ? new Date(trip.createdAt).toLocaleString() : "—"}</Paragraph><Paragraph><strong>Last updated:</strong> {trip.updatedAt ? new Date(trip.updatedAt).toLocaleString() : "—"}</Paragraph></section>
                        <RecordReview
                            data={trip}
                            title="Complete trip record"
                            description="Every available trip value, including pricing, itinerary, preferences, ownership, verification, and audit fields."
                        />
                    </main>
                </div>

                <footer className="tv-footer">
                    <div className="tv-footer-left">
                        <small>Tags: {(trip.tags || []).join(", ") || "—"}</small>
                    </div>
                </footer>
            </aside>
        </div>
    );
}
