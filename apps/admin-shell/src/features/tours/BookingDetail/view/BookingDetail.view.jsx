import React from "react";
import { Button, Title, SubTitle, Paragraph } from "@packages/trem-ui";
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
    const paymentStatus = String(booking.paymentStatus || "").toUpperCase();
    const priceSnapshot = booking.priceSnapshot || {};
    const paymentSummary = booking.paymentSummary || {};
    const currency = priceSnapshot.currency || booking.currentQuote?.currency || "INR";
    const remaining = Number(paymentSummary.remaining || priceSnapshot.total || 0);
    const paid = Number(paymentSummary.paid || 0);
    const isTerminal = ["CANCELLED", "COMPLETED"].includes(status);
    const canGenerateQuote = ["DRAFT", "QUOTE_REQUESTED", "UNDER_REVIEW"].includes(status);
    const pendingProof = (booking.payments || []).find((payment) => payment.status === "VERIFICATION" && ["TOKEN", "deposit"].includes(payment.type));
    const isAwaitingToken = status === "AWAITING_TOKEN_PAYMENT" && paymentStatus === "TOKEN_PENDING";
    const [quoteAmount, setQuoteAmount] = React.useState(priceSnapshot.total || booking.currentQuote?.finalAmount || 0);
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
        setQuoteAmount(priceSnapshot.total || booking.currentQuote?.finalAmount || 0);
        setRefundAmount(paid || 0);
        setTokenDetails((value) => ({ ...value, amount: Number(booking.tokenAmount || 0) }));
    }, [booking.currentQuote?.finalAmount, booking.tokenAmount, paid, priceSnapshot.total, remaining]);

    const loadingAction = actionState?.loading || "";
    const isLoading = Boolean(loadingAction);
    const actionId = bookingId || booking.id || booking._id;

    return (
        <aside className="bd-actions-panel" aria-label="Booking actions">
            <div className="bd-actions-panel__header">
                <SubTitle text="Booking Actions" />
                <span>{statusLabel(paymentStatus)}</span>
            </div>

            {actionState?.message ? <div className="bd-action-note is-success">{actionState.message}</div> : null}
            {actionState?.error ? <div className="bd-action-note is-error">{actionState.error}</div> : null}

            {canGenerateQuote ? (
                <div className="bd-action-group">
                    <label htmlFor="quoteAmount">Quote amount</label>
                    <input
                        id="quoteAmount"
                        type="number"
                        min="0"
                        value={quoteAmount}
                        onChange={(event) => setQuoteAmount(event.target.value)}
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

            {pendingProof ? (
                <div className="bd-action-group">
                    <strong>Token proof awaiting review</strong>
                    {pendingProof.paymentScreenshot ? (
                        <button type="button" className="bd-proof-download" disabled={loadingAction === "downloadProof"} onClick={() => actions?.downloadProof?.(actionId, pendingProof.id || pendingProof._id)}>
                            {loadingAction === "downloadProof" ? "Downloading..." : "Download uploaded screenshot"}
                        </button>
                    ) : null}
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

    return (
        <div className="bd-page">
            <div className="bd-shell">
                <header className="bd-header">
                    <div>
                        <Button primaryClassName="bd-back" variant="text" iconLeft="arrowLeft" onClick={() => navigate("/manage/tours")} text="Back to Manage" />
                        <Title text={tour.title || "Booking Details"} variant="primary" size="large" />
                        <div className="bd-ref">{booking.bookingRef}</div>
                    </div>
                    <div>
                        <div className="bd-status">{statusLabel(status)}</div>
                        <div className="bd-ref">Payment: {statusLabel(booking.paymentStatus)}</div>
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
                            <Title text={booking.product === "trevio" ? "Trip Details" : "Tour Details"} />
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
                                            {pmt.paymentScreenshot ? (
                                                <button type="button" className="bd-proof-download" disabled={actionState?.loading === "downloadProof"} onClick={() => actions?.downloadProof?.(bookingId, pmt.id || pmt._id)}>
                                                    {actionState?.loading === "downloadProof" ? "Downloading..." : "Download proof"}
                                                </button>
                                            ) : null}
                                            {pmt.rejectionReason ? <span className="bd-payment-txn">Reason: {pmt.rejectionReason}</span> : null}
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
                                {(booking.paymentTimeline || booking.timeline || booking.statusHistory || []).slice(0, 15).map((item) => (
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
                                {!(booking.paymentTimeline || booking.timeline || booking.statusHistory || []).length ? <Paragraph primaryClassname="bd-muted">No timeline updates yet.</Paragraph> : null}
                            </div>
                        </div>
                    </div>
                    <BookingActionsPanel booking={booking} bookingId={bookingId} actions={actions} actionState={actionState} />
                </div>
            </div>
        </div>
    );
}
