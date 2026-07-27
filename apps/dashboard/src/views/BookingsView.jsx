import React, { useState, useMemo } from "react";
import { EmptyState } from "@packages/trem-ui";
import "./BookingsView.scss";

const STATUSES = [
  "All",
  "Awaiting Token Payment",
  "Confirmed",
  "Completed",
  "Cancelled",
];

const PRODUCTS = ["All", "Trevio", "Trevista"];

const PAGE_SIZE = 10;

function formatCurrency(amount, currency = "INR") {
  const value = Number(amount || 0);
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: value % 1 ? 2 : 0,
    }).format(value);
  } catch {
    return `₹${value.toLocaleString("en-IN")}`;
  }
}

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function dateRange(start, end) {
  if (!start) return "—";
  const s = formatDate(start);
  if (!end) return s;
  return `${s} – ${formatDate(end)}`;
}

function normalizeStatus(status) {
  if (!status) return "Draft";
  return status.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function statusClass(status) {
  const s = String(status || "").toUpperCase();
  if (["CONFIRMED", "PAID", "TICKETED", "TRAVEL_READY", "COMPLETED"].includes(s)) return "confirmed";
  if (["CANCELLED", "REFUNDED"].includes(s)) return "cancelled";
  if (["QUOTE_REQUESTED", "QUOTE_READY", "QUOTE_SENT", "UNDER_REVIEW"].includes(s)) return "pending";
  if (["DRAFT"].includes(s)) return "draft";
  if (["AWAITING_TOKEN_PAYMENT", "PAYMENT_PENDING", "PARTIALLY_PAID", "REFUND_PENDING"].includes(s)) return "warning";
  return "default";
}

export default function BookingsView({ bookings, loading, onViewBooking }) {
  const [statusFilter, setStatusFilter] = useState("All");
  const [productFilterLocal, setProductFilterLocal] = useState("All");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let result = bookings || [];
    if (statusFilter !== "All") {
      const target = statusFilter.toUpperCase().replace(/ /g, "_");
      result = result.filter((b) => String(b.status || "").toUpperCase() === target);
    }
    if (productFilterLocal !== "All") {
      const target = productFilterLocal.toLowerCase();
      result = result.filter((b) => (b.product || "trevista") === target);
    }
    return result;
  }, [bookings, statusFilter, productFilterLocal]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="dbv">
      {/* Header */}
      <div className="dbv__header">
        <div>
          <h1 className="dbv__title">Bookings</h1>
          <p className="dbv__subtitle">
            {filtered.length} booking{filtered.length !== 1 ? "s" : ""}
            {statusFilter !== "All" && ` · ${statusFilter}`}
            {productFilterLocal !== "All" && ` · ${productFilterLocal}`}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="dbv__filters">
        <div className="dbv__filter-group">
          <span className="dbv__filter-label">Product</span>
          <div className="dbv__chips">
            {PRODUCTS.map((p) => (
              <button
                key={p}
                className={`dbv__chip ${productFilterLocal === p ? "is-active" : ""} ${p !== "All" ? `dbv__chip--${p.toLowerCase()}` : ""}`}
                onClick={() => { setProductFilterLocal(p); setPage(1); }}
              >
                {p === "Trevio" && <span className="dbv__chip-dot dbv__chip-dot--trevio" />}
                {p === "Trevista" && <span className="dbv__chip-dot dbv__chip-dot--trevista" />}
                {p}
              </button>
            ))}
          </div>
        </div>
        <div className="dbv__filter-group">
          <span className="dbv__filter-label">Status</span>
          <div className="dbv__chips dbv__chips--scroll">
            {STATUSES.map((s) => (
              <button
                key={s}
                className={`dbv__chip ${statusFilter === s ? "is-active" : ""}`}
                onClick={() => { setStatusFilter(s); setPage(1); }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="dbv__loading">
          <div className="dbv__spinner" />
          <span>Loading bookings...</span>
        </div>
      ) : paginated.length > 0 ? (
        <>
          <div className="dbv__table-wrap">
            <table className="dbv__table">
              <thead>
                <tr>
                  <th className="dbv__th--id">Trem ID</th>
                  <th>Trip</th>
                  <th>Product</th>
                  <th>Status</th>
                  <th>Travel Dates</th>
                  <th>Guests</th>
                  <th className="dbv__th--amount">Amount</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((b, i) => {
                  const tour = b.trip || b.tour || {};
                  const tripName = tour.title || b.tripSelection?.packageId || "Trip";
                  const product = b.product || "trevista";
                  const total = b.paymentSummary?.total || b.priceSnapshot?.total || 0;
                  const currency = b.priceSnapshot?.currency || "INR";

                  return (
                    <tr
                      key={b.id || b._id || i}
                      className="dbv__row"
                      onClick={() => onViewBooking?.(b)}
                    >
                      <td className="dbv__td-id">
                        <span className="dbv__trem-id">{b.bookingRef || "—"}</span>
                      </td>
                      <td>
                        <div className="dbv__trip">
                          <span className="dbv__trip-name">{tripName}</span>
                          {tour.city && <span className="dbv__trip-city">{tour.city}</span>}
                        </div>
                      </td>
                      <td>
                        <span className={`dbv__product-badge dbv__product-badge--${product}`}>
                          {product === "trevio" ? "Trevio" : "Trevista"}
                        </span>
                      </td>
                      <td>
                        <span className={`dbv__status dbv__status--${statusClass(b.status)}`}>
                          {normalizeStatus(b.status)}
                          <small>{normalizeStatus(b.paymentStatus)}</small>
                        </span>
                      </td>
                      <td className="dbv__td-date">
                        {dateRange(b.startDate || b.travelWindow?.startDate, b.endDate || b.travelWindow?.endDate)}
                      </td>
                      <td className="dbv__td-center">{b.guestsCount || "—"}</td>
                      <td className="dbv__td-amount">{formatCurrency(total, currency)}</td>
                      <td className="dbv__td-date">{formatDate(b.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="dbv__cards">
            {paginated.map((b, i) => {
              const tour = b.trip || b.tour || {};
              const tripName = tour.title || b.tripSelection?.packageId || "Trip";
              const product = b.product || "trevista";
              const total = b.paymentSummary?.total || b.priceSnapshot?.total || 0;
              const currency = b.priceSnapshot?.currency || "INR";

              return (
                <div
                  key={b.id || b._id || i}
                  className="dbv__card"
                  onClick={() => onViewBooking?.(b)}
                >
                  <div className="dbv__card-top">
                    <div className="dbv__card-trip">
                      <span className="dbv__card-trip-name">{tripName}</span>
                      {tour.city && <span className="dbv__trip-city">{tour.city}</span>}
                    </div>
                    <span className={`dbv__status dbv__status--${statusClass(b.status)}`}>
                      {normalizeStatus(b.status)}
                      <small>{normalizeStatus(b.paymentStatus)}</small>
                    </span>
                  </div>
                  <div className="dbv__card-details">
                    <div className="dbv__card-detail">
                      <span className="dbv__card-detail-label">Trem ID</span>
                      <span className="dbv__trem-id">{b.bookingRef || "—"}</span>
                    </div>
                    <div className="dbv__card-detail">
                      <span className="dbv__card-detail-label">Product</span>
                      <span className={`dbv__product-badge dbv__product-badge--${product}`}>
                        {product === "trevio" ? "Trevio" : "Trevista"}
                      </span>
                    </div>
                    <div className="dbv__card-detail">
                      <span className="dbv__card-detail-label">Travel</span>
                      <span>{dateRange(b.startDate || b.travelWindow?.startDate, b.endDate || b.travelWindow?.endDate)}</span>
                    </div>
                    <div className="dbv__card-detail">
                      <span className="dbv__card-detail-label">Guests</span>
                      <span>{b.guestsCount || "—"}</span>
                    </div>
                    <div className="dbv__card-detail">
                      <span className="dbv__card-detail-label">Amount</span>
                      <span className="dbv__card-amount">{formatCurrency(total, currency)}</span>
                    </div>
                    <div className="dbv__card-detail">
                      <span className="dbv__card-detail-label">Created</span>
                      <span>{formatDate(b.createdAt)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="dbv__pagination">
              <button
                className="dbv__page-btn"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 2)
                .reduce((acc, p, idx, arr) => {
                  if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === "..." ? (
                    <span key={`ellipsis-${i}`} className="dbv__page-ellipsis">…</span>
                  ) : (
                    <button
                      key={p}
                      className={`dbv__page-num ${p === safePage ? "is-active" : ""}`}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </button>
                  )
                )}
              <button
                className="dbv__page-btn"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              <span className="dbv__page-info">
                Page {safePage} of {totalPages}
              </span>
            </div>
          )}
        </>
      ) : (
        <EmptyState
          icon="calendar"
          title="No bookings found"
          description={
            statusFilter !== "All" || productFilterLocal !== "All"
              ? "Try adjusting your filters."
              : "When you book a trip, it will appear here."
          }
        />
      )}
    </div>
  );
}
