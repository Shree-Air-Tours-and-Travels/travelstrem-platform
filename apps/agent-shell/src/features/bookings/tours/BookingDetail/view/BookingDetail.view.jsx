import React from "react";
import { Button, InputField, Title, SubTitle, Paragraph } from "@packages/trem-ui";
import "../BookingDetail.scss";

const STATUS_PHASES = [
    { statuses: ["DRAFT", "QUOTE_REQUESTED"], label: "Request" },
    { statuses: ["UNDER_REVIEW", "QUOTE_READY", "QUOTE_SENT"], label: "Quote" },
    { statuses: ["CUSTOMER_ACCEPTED", "CUSTOMER_REJECTED"], label: "Decision" },
    { statuses: ["PAYMENT_PENDING", "PARTIALLY_PAID", "PAID"], label: "Payment" },
    { statuses: ["CONFIRMED", "TICKETING", "TICKETED", "TRAVEL_READY"], label: "Confirmed" },
    { statuses: ["COMPLETED"], label: "Completed" },
];

const statusLabel = (s) => String(s || "").replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

const toDateInput = (v) => {
    if (!v) return ",";
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? "," : d.toLocaleDateString("en-IN", { dateStyle: "long" });
};

const formatCurrency = (v, c = "INR") => {
    const n = Number(v || 0);
    try { return new Intl.NumberFormat("en-IN", { style: "currency", currency: c, maximumFractionDigits: n % 1 ? 2 : 0 }).format(n); }
    catch { return `${c} ${n.toLocaleString("en-IN")}`; }
};

const getPhaseIndex = (status) => {
    const s = String(status || "").toUpperCase();
    for (let i = 0; i < STATUS_PHASES.length; i++) {
        if (STATUS_PHASES[i].statuses.includes(s)) return i;
    }
    return -1;
};

function WidgetSkeleton() {
    return (
        <div className="bd-loading">
            <div className="bd-skeleton-pulse" style={{ height: 24, width: '60%', marginBottom: 16 }} />
            <div className="bd-skeleton-pulse" style={{ height: 16, width: '40%', marginBottom: 12 }} />
            <div className="bd-skeleton-pulse" style={{ height: 16, width: '80%' }} />
        </div>
    );
}

function WidgetError({ message }) {
    return (
        <div className="bd-error">
            <SubTitle text="Something went wrong" />
            <Paragraph>{message}</Paragraph>
        </div>
    );
}

function BookingActionsPanel({ booking, bookingId, actions, actionState }) {
    const status = String(booking.status || "").toUpperCase();
    const priceSnapshot = booking.priceSnapshot || {};
    const paymentSummary = booking.paymentSummary || {};
    const currency = priceSnapshot.currency || booking.currentQuote?.currency || "INR";
    const remaining = Number(paymentSummary.remaining || priceSnapshot.total || 0);
    const paid = Number(paymentSummary.paid || 0);
    const isTerminal = ["CANCELLED", "COMPLETED", "REFUNDED"].includes(status);
    const canGenerateQuote = ["DRAFT", "QUOTE_REQUESTED", "UNDER_REVIEW"].includes(status);
    const statusActions = {
        PAID: [{ label: "Confirm Booking", action: "confirm", target: "CONFIRMED" }],
        CONFIRMED: [
            { label: "Start Ticketing", action: "ticketing", target: "TICKETING" },
            { label: "Mark Travel Ready", action: "travelReady", target: "TRAVEL_READY" },
        ],
        TICKETING: [{ label: "Mark Ticketed", action: "ticketed", target: "TICKETED" }],
        TICKETED: [
            { label: "Mark Travel Ready", action: "travelReady", target: "TRAVEL_READY" },
            { label: "Mark Complete", action: "complete", target: "COMPLETED" },
        ],
        TRAVEL_READY: [{ label: "Mark Complete", action: "complete", target: "COMPLETED" }],
    };

    const [quoteAmount, setQuoteAmount] = React.useState(priceSnapshot.total || booking.currentQuote?.finalAmount || 0);
    const [payAmount, setPayAmount] = React.useState(remaining || 0);
    const [refundAmount, setRefundAmount] = React.useState(paid || 0);
    const [showPayInput, setShowPayInput] = React.useState(false);
    const [showRefundInput, setShowRefundInput] = React.useState(false);

    React.useEffect(() => {
        setQuoteAmount(priceSnapshot.total || booking.currentQuote?.finalAmount || 0);
        setPayAmount(remaining || 0);
        setRefundAmount(paid || 0);
    }, [booking.currentQuote?.finalAmount, paid, priceSnapshot.total, remaining]);

    const loadingAction = actionState?.loading || "";
    const isLoading = Boolean(loadingAction);
    const actionId = bookingId || booking.id || booking._id;

    return (
        <aside className="bd-actions-panel" aria-label="Booking actions">
            <div className="bd-actions-panel__header">
                <SubTitle text="Booking Actions" />
                <span>{statusLabel(status)}</span>
            </div>

            {actionState?.message ? <div className="bd-action-note is-success">{actionState.message}</div> : null}
            {actionState?.error ? <div className="bd-action-note is-error">{actionState.error}</div> : null}

            {canGenerateQuote ? (
                <div className="bd-action-group">
                    <span className="bd-action-label">Quote amount</span>
                    <InputField
                        variant="number"
                        value={quoteAmount}
                        onChange={setQuoteAmount}
                        placeholder="Quote amount"
                    />
                    <Button
                        primaryClassName="bd-action-btn"
                        variant="solid"
                        color="primary"
                        disabled={isLoading}
                        onClick={() => actions?.generateQuote?.(actionId, { finalAmount: Number(quoteAmount) || 0, currency })}
                        text={loadingAction === "quote" ? "Sending..." : "Generate & Send Quote"}
                    />
                </div>
            ) : null}

            {(statusActions[status] || []).map((item) => (
                <Button
                    key={item.action}
                    primaryClassName="bd-action-btn"
                    variant="solid"
                    color="primary"
                    disabled={isLoading}
                    onClick={() => actions?.statusTransition?.(actionId, item.target)}
                    text={loadingAction === item.target ? "Processing..." : item.label}
                />
            ))}

            {!isTerminal && remaining > 0 ? (
                <div className="bd-action-group">
                    {showPayInput ? (
                        <>
                            <span className="bd-action-label">Payment amount</span>
                            <InputField
                                variant="number"
                                value={payAmount}
                                onChange={setPayAmount}
                                placeholder="Payment amount"
                            />
                            <div className="bd-action-row">
                                <Button primaryClassName="bd-action-btn" variant="outline" disabled={isLoading} onClick={() => setShowPayInput(false)} text="Cancel" />
                                <Button
                                    primaryClassName="bd-action-btn"
                                    variant="solid"
                                    color="primary"
                                    disabled={isLoading}
                                    onClick={async () => {
                                        await actions?.recordPayment?.(actionId, Number(payAmount), currency);
                                        setShowPayInput(false);
                                    }}
                                    text={loadingAction === "payment" ? "Recording..." : "Record"}
                                />
                            </div>
                        </>
                    ) : (
                        <Button primaryClassName="bd-action-btn" variant="solid" disabled={isLoading} onClick={() => { setPayAmount(remaining); setShowPayInput(true); }} text="Record Payment" />
                    )}
                </div>
            ) : null}

            {!isTerminal && paid > 0 ? (
                <div className="bd-action-group">
                    {showRefundInput ? (
                        <>
                            <span className="bd-action-label">Refund amount</span>
                            <InputField
                                variant="number"
                                value={refundAmount}
                                onChange={setRefundAmount}
                                placeholder="Refund amount"
                            />
                            <div className="bd-action-row">
                                <Button primaryClassName="bd-action-btn" variant="outline" disabled={isLoading} onClick={() => setShowRefundInput(false)} text="Cancel" />
                                <Button
                                    primaryClassName="bd-action-btn"
                                    variant="solid"
                                    color="danger"
                                    disabled={isLoading}
                                    onClick={async () => {
                                        await actions?.refund?.(actionId, Number(refundAmount), currency);
                                        setShowRefundInput(false);
                                    }}
                                    text={loadingAction === "refund" ? "Refunding..." : "Refund"}
                                />
                            </div>
                        </>
                    ) : (
                        <Button primaryClassName="bd-action-btn" variant="outline" color="danger" disabled={isLoading} onClick={() => setShowRefundInput(true)} text="Process Refund" />
                    )}
                </div>
            ) : null}

            {!isTerminal ? (
                <Button
                    primaryClassName="bd-action-btn"
                    variant="outline"
                    color="danger"
                    disabled={isLoading}
                    onClick={() => actions?.cancel?.(actionId)}
                    text={loadingAction === "cancel" ? "Cancelling..." : "Cancel Booking"}
                />
            ) : null}
        </aside>
    );
}

export default function BookingDetailView({ booking, bookingId, loading, error, navigate, backTarget, actions, actionState }) {
    const backPath = backTarget?.path || "/agent/bookings";
    const backLabel = backTarget?.label ? `Back to ${backTarget.label}` : "Back to Bookings";

    if (loading) {
        return (
            <div className="bd-page">
                <WidgetSkeleton />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bd-page">
                <WidgetError message={error} />
                <div style={{ marginTop: 16 }}>
                    <Button variant="text" onClick={() => navigate(backPath)} text={backLabel} />
                </div>
            </div>
        );
    }

    if (!booking) {
        return (
            <div className="bd-page">
                <div className="bd-error">
                    <Title text="Booking not found" />
                    <Button variant="text" onClick={() => navigate(backPath)} text={backLabel} />
                </div>
            </div>
        );
    }

    const tour = booking.tour || {};
    const status = String(booking.status || "").toUpperCase();
    const phaseIndex = getPhaseIndex(status);
    const { paymentSummary } = booking;

    return (
        <div className="bd-page">
            <div className="bd-shell">
                <header className="bd-header">
                    <div>
                        <Button primaryClassName="bd-back" variant="text" iconLeft="arrowLeft" onClick={() => navigate(backPath)} text={backLabel} />
                        <Title text={tour.title || "Booking Details"} variant="primary" size="large" />
                        <div className="bd-ref">{booking.bookingRef}</div>
                    </div>
                    <div className="bd-status">{statusLabel(status)}</div>
                </header>

                {booking.assignedAgent ? (
                    <div className="bd-agent">
                        Assigned to <strong>{booking.assignedAgent.name}</strong>
                        {booking.assignedAgent.email ? ` (${booking.assignedAgent.email})` : ""}
                        {booking.quoteDueAt ? ` , Quote due: ${toDateInput(booking.quoteDueAt)}` : ""}
                    </div>
                ) : null}

                {phaseIndex >= 0 ? (
                    <div className="bd-progress">
                        {STATUS_PHASES.map((phase, i) => {
                            const isComplete = i < phaseIndex;
                            const isCurrent = i === phaseIndex && !["CANCELLED", "REFUNDED", "REFUND_PENDING"].includes(status);
                            return (
                                <div key={phase.label} className={`bd-progress__step ${isComplete ? "is-complete" : ""} ${isCurrent ? "is-current" : ""}`}>
                                    <div className="bd-progress__dot" />
                                    <span className="bd-progress__label">{phase.label}</span>
                                    {i < STATUS_PHASES.length - 1 ? <div className="bd-progress__line" /> : null}
                                </div>
                            );
                        })}
                        {["CANCELLED", "REFUNDED", "REFUND_PENDING"].includes(status) ? (
                            <div className="bd-progress__step is-cancelled">
                                <div className="bd-progress__dot" />
                                <span className="bd-progress__label">Cancelled</span>
                            </div>
                        ) : null}
                    </div>
                ) : null}

                <div className="bd-content">
                    <div className="bd-grid">
                        <div className="bd-card bd-card--tour">
                            <Title text="Tour Details" />
                            <Paragraph>{tour.desc || "No description available."}</Paragraph>
                            <div className="bd-meta-grid">
                                <div><span>Guests</span><strong>{booking.guestsCount || 1}</strong></div>
                                <div><span>Per Person</span><strong>{formatCurrency(booking.priceSnapshot?.perPerson, booking.priceSnapshot?.currency)}</strong></div>
                                <div><span>Total</span><strong>{formatCurrency(paymentSummary?.total || booking.priceSnapshot?.total, booking.priceSnapshot?.currency)}</strong></div>
                                <div><span>Paid</span><strong className="bd-green">{formatCurrency(paymentSummary?.paid, booking.priceSnapshot?.currency)}</strong></div>
                                <div><span>Remaining</span><strong>{formatCurrency(paymentSummary?.remaining, booking.priceSnapshot?.currency)}</strong></div>
                                <div><span>Refunded</span><strong>{formatCurrency(paymentSummary?.refunded, booking.priceSnapshot?.currency)}</strong></div>
                            </div>
                            {booking.currentQuote ? (
                                <div className="bd-quote-info">
                                    <strong>Latest Quote v{booking.currentQuote.version}</strong>
                                    <span>, {formatCurrency(booking.currentQuote.finalAmount, booking.currentQuote.currency)}</span>
                                    {booking.currentQuote.expirationDate ? <span> (valid until {toDateInput(booking.currentQuote.expirationDate)})</span> : null}
                                </div>
                            ) : null}
                        </div>

                        <div className="bd-card">
                            <Title text="Contact" />
                            <div className="bd-meta-grid">
                                <div><span>Name</span><strong>{booking.primaryContact?.name || ","}</strong></div>
                                <div><span>Email</span><strong>{booking.primaryContact?.email || ","}</strong></div>
                                <div><span>Phone</span><strong>{booking.primaryContact?.phone || ","}</strong></div>
                                <div><span>Start Date</span><strong>{toDateInput(booking.startDate)}</strong></div>
                                <div><span>End Date</span><strong>{toDateInput(booking.endDate)}</strong></div>
                            </div>
                        </div>

                        <div className="bd-card">
                            <Title text={`Travelers (${booking.travelers?.length || 0})`} />
                            {booking.travelers?.length ? (
                                <div className="bd-travelers">
                                    {booking.travelers.map((t, i) => (
                                        <div key={t.id || t._id || i} className="bd-traveler">
                                            <strong>{t.firstName || ""} {t.lastName || ""}</strong>
                                            <span>{t.email || ""}</span>
                                            {t.nationality ? <span>{t.nationality}</span> : null}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <Paragraph primaryClassname="bd-muted">No traveler details.</Paragraph>
                            )}
                        </div>

                        <div className="bd-card">
                            <Title text="Payment History" />
                            <div className="bd-payment-list">
                                {booking.payments?.length ? (
                                    booking.payments.map((pmt, i) => (
                                        <div key={pmt.id || pmt._id || i} className="bd-payment-item">
                                            <span className="bd-payment-date">{toDateInput(pmt.paymentDate)}</span>
                                            <span className="bd-payment-amount">{formatCurrency(pmt.amount, pmt.currency)}</span>
                                            <span className={`bd-payment-status bd-payment-status--${(pmt.status || "").toLowerCase()}`}>{pmt.status}</span>
                                            {pmt.transactionId ? <span className="bd-payment-txn">Txn: {pmt.transactionId}</span> : null}
                                        </div>
                                    ))
                                ) : (
                                    <Paragraph primaryClassname="bd-muted">No payment records yet.</Paragraph>
                                )}
                            </div>
                        </div>

                        <div className="bd-card">
                            <Title text="Journey Timeline" />
                            <div className="bd-timeline">
                                {(booking.timeline || booking.statusHistory || []).slice(0, 15).map((item) => (
                                    <div key={item.id || item._id || item.createdAt} className="bd-timeline-item">
                                        <div className="bd-timeline-dot" />
                                        <div>
                                            <strong>{item.action || statusLabel(item.to || item.status)}</strong>
                                            <time>{toDateInput(item.createdAt)}</time>
                                            {item.metadata ? (
                                                <div className="bd-timeline-meta">
                                                    {item.metadata.amount ? <span>Amount: {formatCurrency(item.metadata.amount)}</span> : null}
                                                    {item.metadata.version ? <span>Version: {item.metadata.version}</span> : null}
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                ))}
                                {!(booking.timeline || booking.statusHistory || []).length ? <Paragraph primaryClassname="bd-muted">No timeline updates yet.</Paragraph> : null}
                            </div>
                        </div>
                    </div>
                    <BookingActionsPanel booking={booking} bookingId={bookingId} actions={actions} actionState={actionState} />
                </div>
            </div>
        </div>
    );
}
