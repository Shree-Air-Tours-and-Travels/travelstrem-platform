import React from "react";
import { Button, Title, SubTitle, Paragraph } from "@packages/trem-ui";
import TimelineStepper from "@packages/trem-ui/components/TimelineStepper/TimelineStepper.jsx";
import { QuoteComposer, createQuoteDraft } from "@packages/trem-docengine";
import "../BookingDetail.scss";

const STATUS_PHASES = [
    { statuses: ["DRAFT", "QUOTE_REQUESTED"], label: "Created" },
    { statuses: ["UNDER_REVIEW", "QUOTE_READY", "QUOTE_SENT"], label: "Quote" },
    { statuses: ["CUSTOMER_ACCEPTED", "CUSTOMER_REJECTED"], label: "Accepted" },
    { statuses: ["AWAITING_TOKEN_PAYMENT", "PAYMENT_PENDING"], label: "Token" },
    { statuses: ["CONFIRMED", "TICKETING", "TICKETED", "TRAVEL_READY"], label: "Confirmed" },
    { statuses: ["COMPLETED"], label: "Completed" },
];

const statusLabel = (s) => String(s || "").replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
const getPaymentStageLabel = (booking = {}) => (booking.enquiryRef || booking.contactLead) && !booking.currentQuote
    ? "Quote not sent"
    : statusLabel(booking.paymentStatus);

const getProofUrl = (value) => {
    if (typeof value === "string") {
        const normalized = value.trim();
        return /^\[object Object\](?:\.html)?$/i.test(normalized) ? "" : normalized;
    }
    if (!value || typeof value !== "object") return "";
    for (const key of ["secure_url", "secureUrl", "url", "href", "path", "downloadUrl", "receiptUrl", "paymentScreenshot", "file", "asset", "data"]) {
        const resolved = getProofUrl(value[key]);
        if (resolved) return resolved;
    }
    return "";
};

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

function buildMilestoneSteps(status) {
    const phaseIndex = getPhaseIndex(status);
    const isCancelled = ["CANCELLED", "REFUNDED", "REFUND_PENDING"].includes(String(status || "").toUpperCase());
    return STATUS_PHASES.map((phase, i) => ({
        key: phase.label,
        label: phase.label,
        status: isCancelled ? "pending" : i < phaseIndex ? "completed" : i === phaseIndex ? "current" : "pending",
    }));
}

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
    const paymentStatus = String(booking.paymentStatus || "").toUpperCase();
    const priceSnapshot = booking.priceSnapshot || {};
    const paymentSummary = booking.paymentSummary || {};
    const currency = priceSnapshot.currency || booking.currentQuote?.currency || "INR";
    const remaining = Number(paymentSummary.remaining || priceSnapshot.total || 0);
    const paid = Number(paymentSummary.paid || 0);
    const isTerminal = ["CANCELLED", "COMPLETED"].includes(status);
    const pendingProof = (booking.payments || []).find((payment) => payment.status === "VERIFICATION" && ["TOKEN", "deposit"].includes(payment.type));
    const isAwaitingToken = status === "AWAITING_TOKEN_PAYMENT" && paymentStatus === "TOKEN_PENDING";
    const paymentStageLabel = getPaymentStageLabel(booking);
    const statusActions = {
        PAID: [{ label: "Confirm Booking", target: "CONFIRMED" }],
        CONFIRMED: [
            { label: "Start Ticketing", target: "TICKETING" },
            { label: "Mark Travel Ready", target: "TRAVEL_READY" },
            { label: "Mark Complete", target: "COMPLETED" },
        ],
        TICKETING: [{ label: "Mark Ticketed", target: "TICKETED" }],
        TICKETED: [
            { label: "Mark Travel Ready", target: "TRAVEL_READY" },
            { label: "Mark Complete", target: "COMPLETED" },
        ],
        TRAVEL_READY: [{ label: "Mark Complete", target: "COMPLETED" }],
    };
    const [refundAmount, setRefundAmount] = React.useState(paid || 0);
    const [refundReason, setRefundReason] = React.useState("");
    const [rejectReason, setRejectReason] = React.useState("");
    const [tokenDetails, setTokenDetails] = React.useState({ amount: Number(booking.tokenAmount || 0), paymentMethod: "UPI", transactionId: "", remarks: "" });
    const [balanceDetails, setBalanceDetails] = React.useState({ paymentMethod: "BANK", transactionId: "", remarks: "" });
    const [showTokenInput, setShowTokenInput] = React.useState(false);
    const [showBalanceInput, setShowBalanceInput] = React.useState(false);
    const [showRejectInput, setShowRejectInput] = React.useState(false);
    const [showRefundInput, setShowRefundInput] = React.useState(false);

    React.useEffect(() => {
        setRefundAmount(paid || 0);
        setTokenDetails((value) => ({ ...value, amount: Number(booking.tokenAmount || 0) }));
    }, [booking.tokenAmount, paid]);

    const loadingAction = actionState?.loading || "";
    const isLoading = Boolean(loadingAction);
    const actionId = bookingId || booking.id || booking._id;

    return (
        <aside className="bd-actions-panel" aria-label="Booking actions">
            <div className="bd-actions-panel__header">
                <h2>Booking actions</h2>
                <span>{paymentStageLabel}</span>
            </div>

            {actionState?.message ? <div className="bd-action-note is-success">{actionState.message}</div> : null}
            {actionState?.error ? <div className="bd-action-note is-error">{actionState.error}</div> : null}

            {booking.currentQuote && booking.quoteDocument?.available ? (
                <Button
                    primaryClassName="bd-action-btn"
                    variant="outline"
                    disabled={isLoading}
                    onClick={() => actions?.downloadQuote?.(actionId, booking.quoteDocument?.filename)}
                    text={loadingAction === "downloadQuote" ? "Preparing PDF..." : "Download Quote PDF"}
                />
            ) : null}

            {(statusActions[status] || []).map((item) => (
                <Button
                    key={item.target}
                    primaryClassName="bd-action-btn"
                    variant="solid"
                    color="primary"
                    disabled={isLoading}
                    onClick={() => actions?.statusTransition?.(actionId, item.target)}
                    text={loadingAction === item.target ? "Processing..." : item.label}
                />
            ))}

            {pendingProof ? (
                <div className="bd-action-group">
                    <strong>Token proof awaiting review</strong>
                    {getProofUrl(pendingProof.paymentScreenshot || pendingProof.receiptUrl) ? (
                        <button type="button" className="bd-proof-download" disabled={loadingAction === "downloadProof"} onClick={() => actions?.downloadProof?.(actionId, pendingProof.id || pendingProof._id, getProofUrl(pendingProof.paymentScreenshot || pendingProof.receiptUrl))}>
                            {loadingAction === "downloadProof" ? "Downloading..." : "Download uploaded screenshot"}
                        </button>
                    ) : <span className="bd-proof-unavailable">The stored proof file is unavailable. Ask the customer to upload it again.</span>}
                    <Button
                        primaryClassName="bd-action-btn"
                        variant="solid"
                        color="primary"
                        disabled={isLoading}
                        onClick={() => actions?.approveToken?.(actionId, pendingProof.id || pendingProof._id)}
                        text={loadingAction === "approveToken" ? "Approving..." : "Approve Token"}
                    />
                    {showRejectInput ? (
                        <>
                            <label htmlFor="rejectReason">Rejection reason</label>
                            <input
                                id="rejectReason"
                                value={rejectReason}
                                onChange={(event) => setRejectReason(event.target.value)}
                            />
                            <div className="bd-action-row">
                                <Button primaryClassName="bd-action-btn" variant="outline" disabled={isLoading} onClick={() => setShowRejectInput(false)} text="Cancel" />
                                <Button
                                    primaryClassName="bd-action-btn"
                                    variant="solid"
                                    color="danger"
                                    disabled={isLoading || !rejectReason.trim()}
                                    onClick={async () => {
                                        await actions?.rejectToken?.(actionId, pendingProof.id || pendingProof._id, rejectReason.trim());
                                        setShowRejectInput(false);
                                    }}
                                    text={loadingAction === "rejectToken" ? "Rejecting..." : "Reject Token"}
                                />
                            </div>
                        </>
                    ) : (
                        <Button primaryClassName="bd-action-btn" variant="outline" color="danger" disabled={isLoading} onClick={() => setShowRejectInput(true)} text="Reject Token" />
                    )}
                </div>
            ) : null}

            {isAwaitingToken && !pendingProof ? (
                <div className="bd-action-group">
                    <strong>Token due: {formatCurrency(tokenDetails.amount, currency)}</strong>
                    {showTokenInput ? (
                        <>
                            <label htmlFor="tokenAmount">Token amount</label>
                            <input id="tokenAmount" type="number" min="1" max={remaining} value={tokenDetails.amount} onChange={(event) => setTokenDetails((value) => ({ ...value, amount: Number(event.target.value) }))} />
                            <label htmlFor="tokenMethod">Payment method</label>
                            <select id="tokenMethod" value={tokenDetails.paymentMethod} onChange={(event) => setTokenDetails((value) => ({ ...value, paymentMethod: event.target.value }))}>
                                <option value="UPI">UPI</option>
                                <option value="BANK">Bank transfer</option>
                                <option value="CASH">Cash</option>
                            </select>
                            <label htmlFor="tokenTransaction">Transaction/reference ID</label>
                            <input id="tokenTransaction" value={tokenDetails.transactionId} onChange={(event) => setTokenDetails((value) => ({ ...value, transactionId: event.target.value }))} placeholder="Optional for cash" />
                            <label htmlFor="tokenRemarks">Remarks</label>
                            <textarea id="tokenRemarks" value={tokenDetails.remarks} onChange={(event) => setTokenDetails((value) => ({ ...value, remarks: event.target.value }))} placeholder="How and when the token was received" />
                            <div className="bd-action-row">
                                <Button primaryClassName="bd-action-btn" variant="outline" disabled={isLoading} onClick={() => setShowTokenInput(false)} text="Cancel" />
                                <Button
                                    primaryClassName="bd-action-btn"
                                    variant="solid"
                                    color="primary"
                                    disabled={isLoading || Number(tokenDetails.amount) <= 0}
                                    onClick={async () => {
                                        await actions?.markTokenPaid?.(actionId, tokenDetails);
                                        setShowTokenInput(false);
                                    }}
                                    text={loadingAction === "token" ? "Updating..." : "Confirm Token Paid"}
                                />
                            </div>
                        </>
                    ) : (
                        <Button primaryClassName="bd-action-btn" variant="solid" color="primary" disabled={isLoading} onClick={() => setShowTokenInput(true)} text="Mark Token Paid" />
                    )}
                </div>
            ) : null}

            {status === "CONFIRMED" && paymentStatus !== "FULLY_PAID" && remaining > 0 ? (
                <div className="bd-action-group">
                    <strong>Balance due: {formatCurrency(remaining, currency)}</strong>
                    {showBalanceInput ? (
                        <>
                            <label htmlFor="balanceMethod">Payment method</label>
                            <select id="balanceMethod" value={balanceDetails.paymentMethod} onChange={(event) => setBalanceDetails((value) => ({ ...value, paymentMethod: event.target.value }))}>
                                <option value="UPI">UPI</option>
                                <option value="BANK">Bank transfer</option>
                                <option value="CASH">Cash</option>
                            </select>
                            <label htmlFor="balanceTransaction">Transaction/reference ID</label>
                            <input id="balanceTransaction" value={balanceDetails.transactionId} onChange={(event) => setBalanceDetails((value) => ({ ...value, transactionId: event.target.value }))} placeholder="Optional for cash" />
                            <label htmlFor="balanceRemarks">Remarks</label>
                            <textarea id="balanceRemarks" value={balanceDetails.remarks} onChange={(event) => setBalanceDetails((value) => ({ ...value, remarks: event.target.value }))} />
                            <div className="bd-action-row">
                                <Button primaryClassName="bd-action-btn" variant="outline" disabled={isLoading} onClick={() => setShowBalanceInput(false)} text="Cancel" />
                                <Button
                                    primaryClassName="bd-action-btn"
                                    variant="solid"
                                    color="primary"
                                    disabled={isLoading}
                                    onClick={async () => {
                                        await actions?.markBalancePaid?.(actionId, balanceDetails);
                                        setShowBalanceInput(false);
                                    }}
                                    text={loadingAction === "balance" ? "Updating..." : "Confirm Fully Paid"}
                                />
                            </div>
                        </>
                    ) : (
                        <Button primaryClassName="bd-action-btn" variant="solid" color="primary" disabled={isLoading} onClick={() => setShowBalanceInput(true)} text="Mark Balance Paid" />
                    )}
                </div>
            ) : null}

            {paid > 0 && paymentStatus !== "REFUNDED" ? (
                <div className="bd-action-group">
                    {showRefundInput ? (
                        <>
                            <label htmlFor="refundAmount">Refund amount</label>
                            <input
                                id="refundAmount"
                                type="number"
                                min="0"
                                value={refundAmount}
                                onChange={(event) => setRefundAmount(event.target.value)}
                            />
                            <label htmlFor="refundReason">Refund reason</label>
                            <textarea id="refundReason" value={refundReason} onChange={(event) => setRefundReason(event.target.value)} />
                            <div className="bd-action-row">
                                <Button primaryClassName="bd-action-btn" variant="outline" disabled={isLoading} onClick={() => setShowRefundInput(false)} text="Cancel" />
                                <Button
                                    primaryClassName="bd-action-btn"
                                    variant="solid"
                                    color="danger"
                                    disabled={isLoading}
                                    onClick={async () => {
                                        await actions?.refund?.(actionId, { amount: Number(refundAmount), currency, reason: refundReason });
                                        setShowRefundInput(false);
                                    }}
                                    text={loadingAction === "refund" ? "Refunding..." : "Refund"}
                                />
                            </div>
                        </>
                    ) : (
                        <Button primaryClassName="bd-action-btn" variant="outline" color="danger" disabled={isLoading} onClick={() => setShowRefundInput(true)} text="Refund" />
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

const quoteNumber = (value) => Math.max(0, Number(value) || 0);
const getQuoteLineQuantity = (item = {}, booking = {}) => {
    const people = quoteNumber(booking.guestsCount || booking.tripSelection?.adultCount || 1);
    const adults = quoteNumber(booking.tripSelection?.adultCount || booking.guestsCount || 1);
    const children = quoteNumber(booking.tripSelection?.childCount);
    const rooms = quoteNumber(booking.tripSelection?.roomCount || 1);
    const start = new Date(booking.startDate || booking.travelWindow?.startDate);
    const end = new Date(booking.endDate || booking.travelWindow?.endDate);
    const nights = Math.max(1, Math.ceil((end - start) / 86400000) || 1);
    if (item.pricingType === "PER_PERSON") return people;
    if (item.pricingType === "PER_ADULT") return adults;
    if (item.pricingType === "PER_CHILD") return children;
    if (item.pricingType === "PER_ROOM") return rooms;
    if (item.pricingType === "PER_NIGHT") return nights;
    if (item.pricingType === "PER_BOOKING" || item.pricingType === "FIXED") return 1;
    return quoteNumber(item.quantity || 1);
};

const getQuoteDraftTotal = (quote = {}, booking = {}) => {
    const fieldsToAdd = ["basePrice", "flightPrice", "hotelPrice", "transferPrice", "activitiesPrice", "mealsPrice", "visaFee", "insuranceFee", "platformFee", "serviceFee"];
    const fieldTotal = fieldsToAdd.reduce((sum, key) => sum + quoteNumber(quote[key]), 0);
    const itemTotal = (quote.items || []).filter((item) => item.selected !== false).reduce((sum, item) => sum + quoteNumber(item.amount ?? quoteNumber(item.unitAmount) * getQuoteLineQuantity(item, booking)), 0);
    return Math.max(0, fieldTotal + itemTotal - quoteNumber(quote.discount));
};

function QuoteBuilderCard({ booking, bookingId, actions, actionState }) {
    const status = String(booking.status || "").toUpperCase();
    const canGenerateQuote = !["CANCELLED", "REFUNDED", "REFUND_PENDING", "COMPLETED"].includes(status);
    const priceSnapshot = booking.priceSnapshot || {};
    const catalogEstimate = booking.catalogEstimate || {};
    const [quoteDraft, setQuoteDraft] = React.useState(() => createQuoteDraft(booking, { ...booking.currentQuote, basePrice: booking.currentQuote?.basePrice || priceSnapshot.total || catalogEstimate.total || 0 }));

    React.useEffect(() => {
        setQuoteDraft(createQuoteDraft(booking, { ...booking.currentQuote, basePrice: booking.currentQuote?.basePrice || priceSnapshot.total || catalogEstimate.total || 0 }));
    }, [booking, booking.currentQuote?.finalAmount, booking.tokenAmount, catalogEstimate.total, priceSnapshot.total]);

    if (!canGenerateQuote) return null;

    const loadingAction = actionState?.loading || "";
    const isLoading = Boolean(loadingAction);
    const actionId = bookingId || booking.id || booking._id;
    const quoteAmount = getQuoteDraftTotal(quoteDraft, booking);

    return (
        <section className="bd-card bd-quote-builder-card" aria-label="Build customer quote">
            <div className="bd-quote-builder-card__header">
                <div>
                    <h2>Build customer quote</h2>
                    <p>Catalog values are prefilled. Verify pricing, payment dates, notes, and terms before sending.</p>
                </div>
                <span>{booking.currentQuote ? `Latest Quote v${booking.currentQuote.version}` : "Quote not sent"}</span>
            </div>
            <QuoteComposer booking={booking} value={quoteDraft} onChange={setQuoteDraft} />
            <div className="bd-quote-builder-card__actions">
                <Button
                    primaryClassName="bd-action-btn"
                    variant="outline"
                    disabled={isLoading}
                    onClick={() => actions?.saveQuoteDraft?.(actionId, quoteDraft)}
                    text={loadingAction === "quoteDraft" ? "Saving..." : "Save Quote Draft"}
                />
                <Button
                    primaryClassName="bd-action-btn"
                    variant="solid"
                    color="primary"
                    disabled={isLoading || Number(quoteAmount) <= 0}
                    onClick={() => actions?.generateQuote?.(actionId, quoteDraft)}
                    text={loadingAction === "quote" ? "Sending..." : "Generate & Send Quote"}
                />
            </div>
        </section>
    );
}

export default function BookingDetailView({ booking, bookingId, loading, error, navigate, actions, actionState }) {
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
                    <Button variant="text" onClick={() => navigate("/manage/tours")} text="Back to Manage" />
                </div>
            </div>
        );
    }

    if (!booking) {
        return (
            <div className="bd-page">
                <div className="bd-error">
                    <Title text="Booking not found" />
                    <Button variant="text" onClick={() => navigate("/manage/tours")} text="Back to Manage" />
                </div>
            </div>
        );
    }

    const tour = booking.trip || booking.tour || {};
    const status = String(booking.status || "").toUpperCase();
    const phaseIndex = getPhaseIndex(status);
    const { paymentSummary } = booking;
    const catalogEstimate = booking.catalogEstimate || {};
    const paymentStageLabel = getPaymentStageLabel(booking);

    return (
        <div className="bd-page">
            <div className="bd-shell">
                <header className="bd-header">
                    <div className="bd-header__identity">
                        <Button primaryClassName="bd-back" variant="text" iconLeft="arrowLeft" onClick={() => navigate("/manage/tours")} text="Back to Manage" />
                        <span className="bd-header__eyebrow">Booking {booking.bookingRef}</span>
                        <h1>{tour.title || "Booking details"}</h1>
                    </div>
                    <div className="bd-header__status">
                        <div className="bd-status">{statusLabel(status)}</div>
                        <div className="bd-ref">{paymentStageLabel}</div>
                    </div>
                </header>

                {booking.assignedAgent ? (
                    <div className="bd-agent">
                        Assigned to <strong>{booking.assignedAgent.name}</strong>
                        {booking.assignedAgent.email ? ` (${booking.assignedAgent.email})` : ""}
                        {booking.quoteDueAt ? ` , Quote due: ${toDateInput(booking.quoteDueAt)}` : ""}
                    </div>
                ) : null}

                {phaseIndex >= 0 ? (
                    <div className="bd-journey-card">
                        <Title text="Booking Progress" />
                        <TimelineStepper steps={buildMilestoneSteps(status)} />
                    </div>
                ) : null}

                <div className="bd-content">
                    <div className="bd-grid">
                        <div className="bd-card bd-card--tour">
                            <h2 className="bd-card__title">{booking.product === "trevio" ? "Trip details" : "Tour details"}</h2>
                            <Paragraph>{tour.desc || "No description available."}</Paragraph>
                            <div className="bd-meta-grid">
                                <div><span>Guests</span><strong>{booking.guestsCount || 1}</strong></div>
                                <div><span>{booking.currentQuote ? "Quoted per person" : "Catalog estimate / person"}</span><strong>{formatCurrency(booking.currentQuote ? booking.priceSnapshot?.perPerson : catalogEstimate.perPerson, booking.priceSnapshot?.currency || catalogEstimate.currency)}</strong></div>
                                <div><span>{booking.currentQuote ? "Quoted total" : "Catalog estimate"}</span><strong>{formatCurrency(booking.currentQuote ? (paymentSummary?.total || booking.priceSnapshot?.total) : catalogEstimate.total, booking.priceSnapshot?.currency || catalogEstimate.currency)}</strong></div>
                                {booking.currentQuote ? <div><span>Paid</span><strong className="bd-green">{formatCurrency(paymentSummary?.paid, booking.priceSnapshot?.currency)}</strong></div> : null}
                                {booking.currentQuote ? <div><span>Remaining</span><strong>{formatCurrency(paymentSummary?.remaining, booking.priceSnapshot?.currency)}</strong></div> : null}
                                {booking.currentQuote ? <div><span>Refunded</span><strong>{formatCurrency(paymentSummary?.refunded, booking.priceSnapshot?.currency)}</strong></div> : null}
                            </div>
                            {booking.currentQuote ? (
                                <div className="bd-quote-info">
                                    <strong>Latest Quote v{booking.currentQuote.version}</strong>
                                    <span>, {formatCurrency(booking.currentQuote.finalAmount, booking.currentQuote.currency)}</span>
                                    {booking.currentQuote.expirationDate ? <span> (valid until {toDateInput(booking.currentQuote.expirationDate)})</span> : null}
                                </div>
                            ) : null}
                            {booking.currentQuote?.changeRequest?.requestedAt ? (
                                <div className="bd-change-request">
                                    <strong>Customer Change Request</strong>
                                    {booking.currentQuote.changeRequest.guestCountChange !== 0 && <span>Guests: {booking.currentQuote.changeRequest.guestCountChange > 0 ? `+${booking.currentQuote.changeRequest.guestCountChange}` : booking.currentQuote.changeRequest.guestCountChange}</span>}
                                    {booking.currentQuote.changeRequest.withFlights !== null && <span>Flights: {booking.currentQuote.changeRequest.withFlights ? "Include" : "Exclude"}</span>}
                                    {booking.currentQuote.changeRequest.notes && <span>{booking.currentQuote.changeRequest.notes}</span>}
                                </div>
                            ) : null}
                        </div>

                        <div className="bd-card">
                            <h2 className="bd-card__title">Contact</h2>
                            <div className="bd-meta-grid">
                                <div><span>Name</span><strong>{booking.primaryContact?.name || ","}</strong></div>
                                <div><span>Email</span><strong>{booking.primaryContact?.email || ","}</strong></div>
                                <div><span>Phone</span><strong>{booking.primaryContact?.phone || ","}</strong></div>
                                <div><span>Start Date</span><strong>{toDateInput(booking.startDate)}</strong></div>
                                <div><span>End Date</span><strong>{toDateInput(booking.endDate)}</strong></div>
                            </div>
                        </div>

                        {(booking.tripPreferences?.addFlights || booking.tripSelection?.roomType || booking.tripPreferences?.mealPreference || booking.tripPreferences?.extraActivities?.length || booking.tripSelection?.specialRequirements || booking.tripPreferences?.specialRequests) && (
                            <div className="bd-card">
                                <h2 className="bd-card__title">Enquiry Details</h2>
                                <div className="bd-meta-grid">
                                    {booking.tripPreferences?.addFlights && <div><span>Flights</span><strong>{booking.tripPreferences.addFlights === "yes" ? "With flights" : "Without flights"}</strong></div>}
                                    {booking.tripSelection?.roomType && <div><span>Room type</span><strong>{booking.tripSelection.roomType}</strong></div>}
                                    {booking.tripPreferences?.mealPreference && <div><span>Meal preference</span><strong>{booking.tripPreferences.mealPreference}</strong></div>}
                                    {booking.tripPreferences?.extraActivities?.length > 0 && <div><span>Activities</span><strong>{booking.tripPreferences.extraActivities.join(", ")}</strong></div>}
                                    {(booking.tripSelection?.specialRequirements || booking.tripPreferences?.specialRequests) && <div><span>Notes</span><strong>{booking.tripPreferences?.specialRequests || booking.tripSelection?.specialRequirements}</strong></div>}
                                </div>
                            </div>
                        )}

                        <div className="bd-card">
                            <h2 className="bd-card__title">Travelers <span>{booking.travelers?.length || 0}</span></h2>
                            {booking.travelers?.length ? (
                                <div className="bd-travelers">
                                    {booking.travelers.map((t, i) => (
                                        <div key={t.id || t._id || i} className="bd-traveler">
                                            <strong>{t.firstName || ""} {t.lastName || ""}</strong>
                                            <div className="bd-traveler__details">
                                                {t.age ? <span>Age: {t.age}</span> : null}
                                                {t.gender ? <span>{t.gender}</span> : null}
                                                {t.nationality ? <span>{t.nationality}</span> : null}
                                                {t.passportNumber ? <span>Passport: {t.passportNumber}</span> : null}
                                                {t.email ? <span>{t.email}</span> : null}
                                                {t.phone ? <span>{t.phone}</span> : null}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <Paragraph primaryClassname="bd-muted">No traveler details.</Paragraph>
                            )}
                        </div>

                        <div className="bd-card">
                            <h2 className="bd-card__title">Payment history</h2>
                            <div className="bd-payment-list">
                                {booking.payments?.length ? (
                                    booking.payments.map((pmt, i) => (
                                        <div key={pmt.id || pmt._id || i} className="bd-payment-item">
                                            <span className="bd-payment-date">{toDateInput(pmt.paymentDate)}</span>
                                            <span className="bd-payment-amount">{formatCurrency(pmt.amount, pmt.currency)}</span>
                                            <span className={`bd-payment-status bd-payment-status--${(pmt.status || "").toLowerCase()}`}>{pmt.status}</span>
                                            {pmt.transactionId ? <span className="bd-payment-txn">Txn: {pmt.transactionId}</span> : null}
                                            {getProofUrl(pmt.paymentScreenshot || pmt.receiptUrl) ? (
                                                <button type="button" className="bd-proof-download" disabled={actionState?.loading === "downloadProof"} onClick={() => actions?.downloadProof?.(bookingId, pmt.id || pmt._id, getProofUrl(pmt.paymentScreenshot || pmt.receiptUrl))}>
                                                    {actionState?.loading === "downloadProof" ? "Downloading..." : "Download proof"}
                                                </button>
                                            ) : pmt.type === "TOKEN" ? <span className="bd-proof-unavailable">Proof unavailable</span> : null}
                                            {pmt.rejectionReason ? <span className="bd-payment-txn">Reason: {pmt.rejectionReason}</span> : null}
                                        </div>
                                    ))
                                ) : (
                                    <Paragraph primaryClassname="bd-muted">No payment records yet.</Paragraph>
                                )}
                            </div>
                        </div>

                        <div className="bd-card">
                            <h2 className="bd-card__title">Journey timeline</h2>
                            <div className="bd-timeline">
                                {(booking.paymentTimeline || booking.timeline || booking.statusHistory || []).slice(0, 15).map((item) => (
                                    <div key={item.id || item._id || item.createdAt} className="bd-timeline-item">
                                        <div className="bd-timeline-dot" />
                                        <div>
                                            <strong>{statusLabel(item.action || item.to || item.status)}</strong>
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
                                {!(booking.paymentTimeline || booking.timeline || booking.statusHistory || []).length ? <Paragraph primaryClassname="bd-muted">No timeline updates yet.</Paragraph> : null}
                            </div>
                        </div>
                    </div>
                    <BookingActionsPanel booking={booking} bookingId={bookingId} actions={actions} actionState={actionState} />
                </div>
                <QuoteBuilderCard booking={booking} bookingId={bookingId} actions={actions} actionState={actionState} />
            </div>
        </div>
    );
}
