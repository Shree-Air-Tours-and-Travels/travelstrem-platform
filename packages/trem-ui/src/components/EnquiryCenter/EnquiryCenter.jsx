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
  const selected =
    records.find((item) => item.id === selectedId || item.reference === selectedId) || null;

  if (error && !records.length)
    return <ErrorState title={states.loadErrorTitle} description={error} retry={onRetry} />;

  if (selected) {
    const detailOverride = renderDetailOverride?.(selected);
    if (detailOverride) return detailOverride;
    const detailPanelsVisible =
      typeof showDetailPanels === "function" ? showDetailPanels(selected) : showDetailPanels;

    return (
      <section
        className="trem-enquiries trem-enquiries--detail"
        aria-labelledby="enquiry-detail-title"
      >
        <div className="trem-enquiries__toolbar">
          <StatusBadge value={selected.statusLabel || selected.status} tone={selected.statusTone} />
        </div>
        <header className="trem-enquiries__hero">
          <div>
            <span className="trem-enquiries__eyebrow">
              {selected.directionLabel || selected.recordTypeLabel}
            </span>
            <h1 id="enquiry-detail-title">{selected.service.name}</h1>
            <p>
              {selected.reference}
              {selected.sourceEnquiryRef
                ? ` · ${labels.enquiry || "Enquiry"} ${selected.sourceEnquiryRef}`
                : ""}{" "}
              · {selected.createdDisplay}
            </p>
          </div>
          {renderDetailActions?.(selected)}
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
          mobileCard: {
            titleAccessor: "service.name",
            subtitleAccessor: "reference",
            imageAccessor: "service.image",
            badgeAccessor: "statusDisplay",
            badgeToneAccessor: "statusTone",
            fieldIds: ["recordTypeLabel", "party", "travelDate", "createdDisplay"],
            actionLabel: tableCopy.viewDetails,
            actionIcon: "eye",
            subtitleClickable: true,
            actionClickable: true,
          },
        }}
        columns={[
          {
            id: "reference",
            label: tableCopy.reference,
            minWidth: 145,
            sortable: true,
            emphasis: "reference",
            clickable: true,
            onClick: onSelect,
          },
          {
            id: "service",
            label: tableCopy.tourService,
            type: "mediaText",
            titleAccessor: "service.name",
            subtitleAccessor: "service.type",
            mediaAccessor: "service.image",
            sortAccessor: "service.name",
            minWidth: 260,
            sortable: true,
          },
          {
            id: "recordTypeLabel",
            label: tableCopy.type,
            accessor: "recordTypeLabel",
            minWidth: 120,
          },
          { id: "party", label: tableCopy.customerSpecialist, minWidth: 190 },
          { id: "travellers", label: tableCopy.travellers, minWidth: 120 },
          { id: "travelDate", label: tableCopy.travelDate, minWidth: 155 },
          {
            id: "statusDisplay",
            label: tableCopy.status,
            type: "status",
            toneAccessor: "statusTone",
            minWidth: 145,
          },
          {
            id: "createdAt",
            label: tableCopy.created,
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
            actions: [
              {
                id: "view",
                label: tableCopy.viewDetails,
                icon: "eye",
                clickable: true,
                onClick: onSelect,
              },
            ],
          },
        ]}
        rows={records}
        actions={{
          search: {
            placeholder: tableCopy.searchPlaceholder,
            keys: ["reference", "service.name", "party", "statusDisplay"],
          },
          filters: [
            {
              id: "recordType",
              label: tableCopy.recordType,
              accessor: "recordType",
              options: [
                { label: tableCopy.allRecords, value: "all" },
                { label: tableCopy.bookings, value: "booking" },
                { label: tableCopy.enquiries, value: "enquiry" },
              ],
            },
          ],
        }}
        sortingHeader={{
          label: tableCopy.sortBy,
          defaultValue: "newest",
          options: [
            {
              label: tableCopy.newest,
              value: "newest",
              sort: { columnId: "createdAt", direction: "desc" },
            },
            {
              label: tableCopy.reference,
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
