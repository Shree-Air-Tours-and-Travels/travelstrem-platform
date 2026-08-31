import React from "react";
import BookingTable from "../BookingTable/BookingTable.jsx";
import ErrorState from "../ErrorState/ErrorState.jsx";
import StatusBadge from "../StatusBadge/StatusBadge.jsx";
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
  if (["accepted", "confirmed", "completed", "paid", "closed", "responded"].includes(key))
    return "success";
  if (["cancelled", "canceled", "failed", "rejected"].includes(key)) return "danger";
  if (["pending", "in_review", "quote_requested", "quote_sent", "change_requested"].includes(key))
    return "warning";
  if (["new", "sent", "ready"].includes(key)) return "info";
  return "neutral";
};

export default function EnquiryCenter({
  title = "",
  description = "",
  view = {},
  enquiries = [],
  bookings = [],
  selectedId = "",
  loading = false,
  error = "",
  onSelect = () => {},
  onRetry = () => {},
  renderDetailActions = null,
  renderDetailContent = null,
  renderDetailOverride = null,
  showDetailPanels = true,
}) {
  const labels = view.labels || {};
  const tableCopy = view.table || {};
  const states = view.states || {};
  const records = [...bookings, ...enquiries].map((item) => {
    const recordType = String(
      item.recordType || (item.bookingRef ? "booking" : "enquiry"),
    ).toLowerCase();
    const reference = item.bookingRef || item.enquiryRef || item.reference || item.id;
    return {
      ...item,
      recordType,
      recordTypeLabel:
        item.recordTypeLabel || (recordType === "booking" ? labels.booking : labels.enquiry),
      reference,
      service: {
        name: item.title || item.tourTitle || item.service?.name || "",
        type: item.product
          ? String(item.product).replace(/^./, (letter) => letter.toUpperCase())
          : item.service?.type || "",
        image: item.image || item.service?.image || "",
      },
      party: item.counterpart?.name || item.customer?.name || item.traveller?.name || "",
      travelDate: item.request?.departure || item.startDateLabel || item.travelDate || "",
      travellers: item.request?.travellers || item.travellers || item.guestsCount || "",
      statusDisplay: item.statusLabel || item.status || "",
      statusTone: item.statusTone || statusTone(item.status),
      createdDisplay: item.createdLabel || item.createdDisplay || "",
    };
  });
  const tableColumns = (tableCopy.columns || []).map((column) => ({
    ...column,
    ...(column.interaction === "open-record" ? { clickable: true, onClick: onSelect } : {}),
    ...(Array.isArray(column.actions)
      ? {
          actions: column.actions.map((action) => ({
            ...action,
            ...(action.interaction === "open-record"
              ? { clickable: true, onClick: onSelect }
              : {}),
          })),
        }
      : {}),
  }));
  const selected =
    records.find((item) => item.id === selectedId || item.reference === selectedId) || null;

  if (error && !records.length)
    return <ErrorState title={states.loadErrorTitle} description={error} retry={onRetry} />;

  if (selected) {
    const detailOverride = renderDetailOverride?.(selected);
    if (detailOverride) return detailOverride;
    const detailPanelsVisible =
      typeof showDetailPanels === "function" ? showDetailPanels(selected) : showDetailPanels;
    const providerVisible = Boolean(
      selected.assignedAgent?.name ||
        selected.assignedAgent?.email ||
        selected.agency?.name ||
        selected.agency?.logo,
    );

    return (
      <section
        className="trem-enquiries trem-enquiries--detail"
        aria-labelledby="enquiry-detail-title"
      >
        <header className="trem-enquiries__hero">
          <div className="trem-enquiries__hero-main">
            <span className="trem-enquiries__eyebrow">
              {selected.directionLabel || selected.recordTypeLabel}
            </span>
            <h1 id="enquiry-detail-title">{selected.service.name}</h1>
            <div className="trem-enquiries__hero-meta">
              <p>
                {selected.reference}
                {selected.sourceEnquiryRef
                  ? ` · ${labels.enquiry || "Enquiry"} ${selected.sourceEnquiryRef}`
                  : ""}{" "}
                · {selected.createdDisplay}
              </p>
              <StatusBadge
                value={selected.statusLabel || selected.status}
                tone={selected.statusTone}
              />
            </div>
          </div>
          <div className="trem-enquiries__hero-actions">
            {providerVisible ? (
              <div className="trem-enquiries__provider">
                {selected.agency?.logo ? (
                  <img
                    className="trem-enquiries__provider-logo"
                    src={selected.agency.logo}
                    alt={selected.agency.name || "Agency"}
                  />
                ) : null}
                <div className="trem-enquiries__provider-copy">
                  <span>{selected.agency?.name || labels.travelSpecialist}</span>
                  {selected.assignedAgent?.name ? (
                    <strong>{selected.assignedAgent.name}</strong>
                  ) : null}
                  {selected.assignedAgent?.email ? (
                    <small>
                      {labels.agentEmail}: {selected.assignedAgent.email}
                    </small>
                  ) : null}
                </div>
              </div>
            ) : null}
            {renderDetailActions?.(selected)}
          </div>
        </header>

        {selected.guidance ? (
          <div className="trem-enquiries__guidance" role="status">
            {selected.guidance}
          </div>
        ) : null}

        {renderDetailContent?.(selected)}

        {detailPanelsVisible ? (
          <div className="trem-enquiries__detail-grid">
            <article className="trem-enquiries__panel">
              <h2>{labels.contact}</h2>
              <dl className="trem-enquiries__details">
                <Detail label={labels.name} value={selected.submittedBy?.name} />
                <Detail label={labels.email} value={selected.submittedBy?.email} />
                <Detail label={labels.phone} value={selected.submittedBy?.phone} />
                <Detail
                  label={labels.preferredContact}
                  value={selected.request?.preferredContact}
                />
                <Detail
                  label={labels.bookingAmount}
                  value={selected.amountDisplay || selected.priceDisplay}
                />
              </dl>
            </article>
            <article className="trem-enquiries__panel">
              <h2>{labels.requested}</h2>
              <dl className="trem-enquiries__details">
                <Detail label={labels.travellers} value={selected.request?.travellers} />
                <Detail label={labels.departure} value={selected.request?.departure} />
                <Detail
                  label={labels.flightPreference}
                  value={selected.request?.flightPreference}
                />
                <Detail label={labels.package} value={selected.request?.package} />
                <Detail label={labels.hotelRoom} value={selected.request?.hotelRoom} wide />
                {(selected.request?.hotelRequests || []).map((request) => (
                  <Detail key={request.stayKey} label={request.label} value={request.value} wide />
                ))}
                {(selected.request?.addOns || []).map((addOn) => (
                  <Detail
                    key={addOn.id}
                    label={`Optional add-on · ${addOn.label}`}
                    value={addOn.value}
                    wide
                  />
                ))}
                {Object.entries(selected.request?.customizationAnswers || {}).map(
                  ([question, answer]) => (
                    <Detail key={question} label={question} value={answer} wide />
                  ),
                )}
                <Detail label={labels.message} value={selected.request?.message} wide />
              </dl>
            </article>
          </div>
        ) : null}
      </section>
    );
  }

  return (
    <section className="trem-enquiries" aria-labelledby="enquiries-title">
      <header className="trem-enquiries__hero">
        <div>
          <span className="trem-enquiries__eyebrow">{labels.listEyebrow}</span>
          <h1 id="enquiries-title">{title}</h1>
          <p>{description}</p>
        </div>
        <span className="trem-enquiries__count">
          {records.length} {labels.totalSuffix}
        </span>
      </header>
      <BookingTable
        table={{
          title: tableCopy.title,
          description: tableCopy.description,
          loading,
          error,
          viewportMinHeight: "28rem",
          contentMinWidth: "68rem",
          mobileScrollMode: "page",
          emptyState: {
            icon: "calendar",
            title: states.emptyTitle,
            description: states.emptyDescription,
          },
          mobileCard: tableCopy.mobileCard,
        }}
        columns={tableColumns}
        rows={records}
        actions={{
          search: tableCopy.search,
          filters: tableCopy.filters || [],
        }}
        sortingHeader={tableCopy.sorting || {}}
        pagination={tableCopy.pagination || { enabled: false }}
        onRowClick={onSelect}
      />
    </section>
  );
}
