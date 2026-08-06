import React, { useState, useMemo } from "react";
import { EmptyState, Spinner } from "@packages/trem-ui";
import "./AdminBookingsView.scss";

const STATUSES = [
  "All",
  "Draft",
  "Quote Requested",
  "Under Review",
  "Quote Ready",
  "Quote Sent",
  "Customer Accepted",
  "Payment Pending",
  "Partially Paid",
  "Paid",
  "Confirmed",
  "Ticketing",
  "Ticketed",
  "Travel Ready",
  "Completed",
  "Cancelled",
  "Refund Pending",
  "Refunded",
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
  if (["PAYMENT_PENDING", "PARTIALLY_PAID", "REFUND_PENDING"].includes(s)) return "warning";
  return "default";
}

export default function AdminBookingsView({ bookings, loading, onViewBooking }) {
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
    <div className="abv">
      <div className="abv__header">
        <div>
          <h1 className="abv__title">Bookings</h1>
          <p className="abv__subtitle">
            {filtered.length} booking{filtered.length !== 1 ? "s" : ""}
            {statusFilter !== "All" && ` · ${statusFilter}`}
            {productFilterLocal !== "All" && ` · ${productFilterLocal}`}
          </p>
        </div>
      </div>

      <div className="abv__filters">
        <div className="abv__filter-tabs">
          {PRODUCTS.map((p) => (
            <button
              key={p}
              className={`abv__filter-tab ${productFilterLocal === p ? "is-active" : ""}`}
              onClick={() => { setProductFilterLocal(p); setPage(1); }}
            >
              {p}
            </button>
          ))}
        </div>
        <div className="abv__filter-tabs abv__filter-tabs--scroll">
          {STATUSES.map((s) => (
            <button
              key={s}
              className={`abv__filter-tab ${statusFilter === s ? "is-active" : ""}`}
              onClick={() => { setStatusFilter(s); setPage(1); }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="abv__loading">
          <Spinner label="Loading bookings..." />
        </div>
      ) : paginated.length > 0 ? (
        <>
          <div className="abv__table-wrap">
            <table className="abv__table">
              <thead>
                <tr>
                  <th className="abv__th--id">Trem ID</th>
                  <th>Trip</th>
                  <th>Product</th>
                  <th>Status</th>
                  <th>Travel Dates</th>
                  <th>Guests</th>
                  <th className="abv__th--amount">Amount</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((b, i) => {
                  const tour = b.tour || {};
                  const tripName = tour.title || b.tripSelection?.packageId || "Trip";
                  const product = b.product || "trevista";
                  const total = b.paymentSummary?.total || b.priceSnapshot?.total || 0;
                  const currency = b.priceSnapshot?.currency || "INR";
                  const cityRaw = tour.city;
                  const cityText = cityRaw && typeof cityRaw === "object" ? `${cityRaw.from || ""} → ${cityRaw.to || ""}` : (cityRaw || "");

                  return (
                    <tr
                      key={b.id || b._id || i}
                      className="abv__row"
                      onClick={() => onViewBooking?.(b)}
                    >
                      <td className="abv__td-id">
                        <span className="abv__trem-id">{b.bookingRef || "—"}</span>
                      </td>
                      <td>
                        <div className="abv__trip">
                          <span className="abv__trip-name">{tripName}</span>
                          {cityText && <span className="abv__trip-city">{cityText}</span>}
                        </div>
                      </td>
                      <td>
                        <span className={`abv__product-badge abv__product-badge--${product}`}>
                          {product === "trevio" ? "Trevio" : "Trevista"}
                        </span>
                      </td>
                      <td>
                        <span className={`abv__status abv__status--${statusClass(b.status)}`}>
                          {normalizeStatus(b.status)}
                        </span>
                      </td>
                      <td className="abv__td-date">
                        {dateRange(b.startDate || b.travelWindow?.startDate, b.endDate || b.travelWindow?.endDate)}
                      </td>
                      <td className="abv__td-center">{b.guestsCount || "—"}</td>
                      <td className="abv__td-amount">{formatCurrency(total, currency)}</td>
                      <td className="abv__td-date">{formatDate(b.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="abv__cards">
            {paginated.map((b, i) => {
              const tour = b.tour || {};
              const tripName = tour.title || b.tripSelection?.packageId || "Trip";
              const product = b.product || "trevista";
              const total = b.paymentSummary?.total || b.priceSnapshot?.total || 0;
              const currency = b.priceSnapshot?.currency || "INR";
              const cityRaw2 = tour.city;
              const cityText2 = cityRaw2 && typeof cityRaw2 === "object" ? `${cityRaw2.from || ""} → ${cityRaw2.to || ""}` : (cityRaw2 || "");

              return (
                <div
                  key={b.id || b._id || i}
                  className="abv__card"
                  onClick={() => onViewBooking?.(b)}
                >
                  <div className="abv__card-top">
                    <div className="abv__card-trip">
                      <span className="abv__card-trip-name">{tripName}</span>
                      {cityText2 && <span className="abv__trip-city">{cityText2}</span>}
                    </div>
                    <span className={`abv__status abv__status--${statusClass(b.status)}`}>
                      {normalizeStatus(b.status)}
                    </span>
                  </div>
                  <div className="abv__card-details">
                    <div className="abv__card-detail">
                      <span className="abv__card-detail-label">Trem ID</span>
                      <span className="abv__trem-id">{b.bookingRef || "—"}</span>
                    </div>
                    <div className="abv__card-detail">
                      <span className="abv__card-detail-label">Product</span>
                      <span className={`abv__product-badge abv__product-badge--${product}`}>
                        {product === "trevio" ? "Trevio" : "Trevista"}
                      </span>
                    </div>
                    <div className="abv__card-detail">
                      <span className="abv__card-detail-label">Travel</span>
                      <span>{dateRange(b.startDate || b.travelWindow?.startDate, b.endDate || b.travelWindow?.endDate)}</span>
                    </div>
                    <div className="abv__card-detail">
                      <span className="abv__card-detail-label">Guests</span>
                      <span>{b.guestsCount || "—"}</span>
                    </div>
                    <div className="abv__card-detail">
                      <span className="abv__card-detail-label">Amount</span>
                      <span className="abv__card-amount">{formatCurrency(total, currency)}</span>
                    </div>
                    <div className="abv__card-detail">
                      <span className="abv__card-detail-label">Created</span>
                      <span>{formatDate(b.createdAt)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="abv__pagination">
              <button
                className="abv__page-btn"
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
                    <span key={`ellipsis-${i}`} className="abv__page-ellipsis">...</span>
                  ) : (
                    <button
                      key={p}
                      className={`abv__page-num ${p === safePage ? "is-active" : ""}`}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </button>
                  )
                )}
              <button
                className="abv__page-btn"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              <span className="abv__page-info">
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
              : "Bookings will appear here as they come in."
          }
        />
      )}
    </div>
  );
}
