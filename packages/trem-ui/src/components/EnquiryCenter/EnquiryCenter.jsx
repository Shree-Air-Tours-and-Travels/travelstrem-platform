import React from "react";
import BookingTable from "../BookingTable/BookingTable.jsx";
import Button from "../Button/Button.jsx";
import ErrorState from "../ErrorState/ErrorState.jsx";
import StatusBadge from "../StatusBadge/StatusBadge.jsx";
import QuoteComparison from "../QuoteComparison/QuoteComparison.jsx";
import "./EnquiryCenter.styles.scss";

const Detail = ({ label, value, wide = false }) =>
  value ? (
    <div className={`trem-enquiries__detail${wide ? " trem-enquiries__detail--wide" : ""}`}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  ) : null;

const statusTone = (status) => {
  const key = String(status || "").toLowerCase();
  if (["confirmed", "completed", "paid", "closed", "responded"].includes(key)) return "success";
  if (["cancelled", "canceled", "failed", "rejected"].includes(key)) return "danger";
  if (["pending", "in_review", "quote_requested", "quote_sent"].includes(key)) return "warning";
  if (["new", "sent", "ready"].includes(key)) return "info";
  return "neutral";
};

export default function EnquiryCenter({
  title = "Bookings & enquiries",
  description = "View and track tour enquiries and confirmed bookings.",
  enquiries = [],
  bookings = [],
  selectedId = "",
  loading = false,
  error = "",
  onSelect = () => {},
  onBack = () => {},
  onRetry = () => {},
}) {
  const records = [...bookings, ...enquiries].map((item) => {
    const recordType = String(
      item.recordType || (item.bookingRef ? "booking" : "enquiry"),
    ).toLowerCase();
    const reference = item.bookingRef || item.enquiryRef || item.reference || item.id;
    return {
      ...item,
      recordType,
      recordTypeLabel: recordType === "booking" ? "Booking" : "Enquiry",
      reference,
      service: {
        name: item.title || item.tourTitle || item.service?.name || "Travel request",
        type: item.product
          ? String(item.product).replace(/^./, (letter) => letter.toUpperCase())
          : item.service?.type || "Tour",
        image: item.image || item.service?.image || "",
      },
      party: item.counterpart?.name || item.customer?.name || item.traveller?.name || "—",
      travelDate: item.request?.departure || item.startDateLabel || item.travelDate || "Flexible",
      travellers: item.request?.travellers || item.travellers || item.guestsCount || "—",
      statusDisplay: item.statusLabel || item.status || "Pending",
      statusTone: item.statusTone || statusTone(item.status),
      createdDisplay: item.createdLabel || item.createdDisplay || "",
    };
  });
  const selected =
    records.find((item) => item.id === selectedId || item.reference === selectedId) || null;

  if (error && !records.length)
    return (
      <ErrorState
        title="Bookings and enquiries could not be loaded"
        description={error}
        retry={onRetry}
      />
    );

  if (selected) {
    return (
      <section
        className="trem-enquiries trem-enquiries--detail"
        aria-labelledby="enquiry-detail-title"
      >
        <div className="trem-enquiries__toolbar">
          <Button
            text="Back to bookings & enquiries"
            variant="outline"
            iconLeft="arrowLeft"
            onClick={onBack}
          />
          <StatusBadge value={selected.statusLabel || selected.status} />
        </div>
        <header className="trem-enquiries__hero">
          <div>
            <span className="trem-enquiries__eyebrow">
              {selected.directionLabel || selected.recordTypeLabel}
            </span>
            <h1 id="enquiry-detail-title">{selected.service.name}</h1>
            <p>
              {selected.reference} · {selected.createdDisplay}
            </p>
          </div>
        </header>

        <div className="trem-enquiries__detail-grid">
          <article className="trem-enquiries__panel">
            <h2>
              {selected.counterpart?.label ||
                (selected.recordType === "booking" ? "Traveller" : "Contact")}
            </h2>
            <dl className="trem-enquiries__details">
              <Detail label="Name" value={selected.counterpart?.name} />
              <Detail label="Email" value={selected.counterpart?.email} />
              <Detail label="Phone" value={selected.counterpart?.phone} />
              <Detail label="Preferred contact" value={selected.request?.preferredContact} />
              <Detail
                label="Booking amount"
                value={selected.amountDisplay || selected.priceDisplay}
              />
            </dl>
          </article>
          <article className="trem-enquiries__panel">
            <h2>What was requested</h2>
            <dl className="trem-enquiries__details">
              <Detail label="Travellers" value={selected.request?.travellers} />
              <Detail label="Departure" value={selected.request?.departure} />
              <Detail label="Flight preference" value={selected.request?.flightPreference} />
              <Detail label="Package" value={selected.request?.package} />
              <Detail label="Hotel and room" value={selected.request?.hotelRoom} wide />
              {(selected.request?.hotelRequests || []).map((request) => {
                const budget =
                  request.budgetPerNightMinor == null
                    ? ""
                    : new Intl.NumberFormat("en-IN", {
                        style: "currency",
                        currency: request.currency || "INR",
                        maximumFractionDigits: 0,
                      }).format(Number(request.budgetPerNightMinor) / 100);
                const preference = [
                  request.propertyClass,
                  request.roomType,
                  budget ? `${budget} per room / night` : "",
                  request.requirements,
                ]
                  .filter(Boolean)
                  .join(" · ");
                return (
                  <Detail
                    key={request.stayKey}
                    label={`Hotel request · ${request.location || request.stayKey}`}
                    value={preference}
                    wide
                  />
                );
              })}
              {Object.entries(selected.request?.customizationAnswers || {}).map(
                ([question, answer]) => (
                  <Detail key={question} label={question} value={answer} wide />
                ),
              )}
              <Detail label="Message" value={selected.request?.message} wide />
            </dl>
          </article>
        </div>
        <QuoteComparison preview={selected.request?.pricing} />
      </section>
    );
  }

  return (
    <section className="trem-enquiries" aria-labelledby="enquiries-title">
      <header className="trem-enquiries__hero">
        <div>
          <span className="trem-enquiries__eyebrow">Tour support</span>
          <h1 id="enquiries-title">{title}</h1>
          <p>{description}</p>
        </div>
        <span className="trem-enquiries__count">{records.length} total</span>
      </header>
      <BookingTable
        table={{
          title: "All records",
          description: "Search and open an enquiry or confirmed booking.",
          loading,
          error,
          viewportMinHeight: "28rem",
          contentMinWidth: "68rem",
          mobileScrollMode: "page",
          emptyState: {
            icon: "calendar",
            title: "No bookings or enquiries yet",
            description: "New enquiries and confirmed bookings will appear here.",
          },
          mobileCard: {
            titleAccessor: "service.name",
            subtitleAccessor: "reference",
            imageAccessor: "service.image",
            badgeAccessor: "statusDisplay",
            badgeToneAccessor: "statusTone",
            fieldIds: ["recordTypeLabel", "party", "travelDate", "createdDisplay"],
            actionLabel: "View details",
          },
        }}
        columns={[
          {
            id: "reference",
            label: "Reference",
            minWidth: 145,
            sortable: true,
            emphasis: "danger",
          },
          {
            id: "service",
            label: "Tour / service",
            type: "mediaText",
            titleAccessor: "service.name",
            subtitleAccessor: "service.type",
            mediaAccessor: "service.image",
            sortAccessor: "service.name",
            minWidth: 260,
            sortable: true,
          },
          { id: "recordTypeLabel", label: "Type", accessor: "recordTypeLabel", minWidth: 120 },
          { id: "party", label: "Customer / specialist", minWidth: 190 },
          { id: "travellers", label: "Travellers", minWidth: 120 },
          { id: "travelDate", label: "Travel date", minWidth: 155 },
          {
            id: "statusDisplay",
            label: "Status",
            type: "status",
            toneAccessor: "statusTone",
            minWidth: 145,
          },
          {
            id: "createdAt",
            label: "Created",
            accessor: "createdDisplay",
            sortAccessor: "createdAt",
            minWidth: 135,
            sortable: true,
          },
          {
            id: "actions",
            label: "",
            type: "actions",
            minWidth: 64,
            align: "right",
            actions: [{ id: "view", label: "View details", icon: "eye", onClick: onSelect }],
          },
        ]}
        rows={records}
        actions={{
          search: {
            placeholder: "Search reference, tour or person",
            keys: ["reference", "service.name", "party", "statusDisplay"],
          },
          filters: [
            {
              id: "recordType",
              label: "Record type",
              accessor: "recordType",
              options: [
                { label: "All records", value: "all" },
                { label: "Bookings", value: "booking" },
                { label: "Enquiries", value: "enquiry" },
              ],
            },
          ],
        }}
        sortingHeader={{
          label: "Sort by",
          defaultValue: "newest",
          options: [
            {
              label: "Newest",
              value: "newest",
              sort: { columnId: "createdAt", direction: "desc" },
            },
            {
              label: "Reference",
              value: "reference",
              sort: { columnId: "reference", direction: "asc" },
            },
          ],
        }}
        pagination={{ pageSize: 10, pageSizeOptions: [10, 25, 50] }}
        onRowClick={onSelect}
      />
    </section>
  );
}
