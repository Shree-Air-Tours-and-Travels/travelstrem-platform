import React from "react";
import { Button, SubTitle, Paragraph } from "@packages/trem-ui";
import "../tours/TourView.scss";

function displayDuration(d) {
    if (!d) return "—";
    if (typeof d === "string") return d;
    if (typeof d === "object") return `${d.from || "—"} – ${d.to || "—"}`;
    return String(d);
}

export default function TripViewView({ trip, onClose, onEdit }) {
    if (!trip) return null;

    const imageSrc = trip.image || (Array.isArray(trip.photos) && trip.photos[0]) || "";

    return (
        <div className="tour-view-overlay" role="dialog" aria-modal="true" aria-label={`${trip.title} details`} onClick={onClose}>
            <aside className="tour-view" tabIndex={-1} onClick={(e) => e.stopPropagation()}>
                <header className="tv-header">
                    <div className="tv-title">
                        <SubTitle text={trip.title || "Untitled Trip"} variant="primary" size="large" />
                        <div className="tv-meta">
                            {trip.location || ""}{trip.country && trip.country !== "India" ? `, ${trip.country}` : ""}
                        </div>
                    </div>
                    <div className="tv-actions">
                        <Button primaryClassName="btn" variant="solid" color="primary" onClick={() => onEdit(trip)} text="Edit" />
                        <Button primaryClassName="btn" variant="outline" onClick={onClose} text="Close" />
                    </div>
                </header>

                <div className="tv-body">
                    <div className="tv-aside">
                        <img src={imageSrc} alt={trip.title} className="tv-photo" />
                        {trip.photos && trip.photos.length > 1 && (
                            <div className="ctf-photo-grid" style={{ marginTop: 8 }}>
                                {trip.photos.map((url, idx) => (
                                    <div key={idx} className={`ctf-photo-thumb ${url === imageSrc ? "ctf-photo-thumb--main" : ""}`}>
                                        <img src={url} alt={`Photo ${idx + 1}`} />
                                    </div>
                                ))}
                            </div>
                        )}
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

                        {trip.itinerary && trip.itinerary.length > 0 && (
                            <section className="tv-section">
                                <SubTitle text="Itinerary" />
                                {trip.itinerary.map((it, idx) => (
                                    <div key={it._id || idx} className="tv-it">
                                        <strong>Day {it.day || idx + 1}{it.title ? `, ${it.title}` : ""}</strong>
                                        {it.summary && <Paragraph>{it.summary}</Paragraph>}
                                    </div>
                                ))}
                            </section>
                        )}

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
