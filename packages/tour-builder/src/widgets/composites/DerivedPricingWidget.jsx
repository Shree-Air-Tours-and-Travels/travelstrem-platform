import React from "react";
import { Spinner } from "@packages/trem-ui";
import { getPath, joinPath } from "../../utils/paths.js";
import { formatMinor, resolveTierLabel } from "../../utils/money.js";
import FieldShell from "../fields/FieldShell.jsx";

/** Read-only projection of the price returned by the API. */
export default function DerivedPricingWidget({ widget, root, basePath, runtime }) {
    const persisted = getPath(root, joinPath(basePath, widget.path)) || {};
    const previewState = runtime?.pricingPreview || {};
    const derived = previewState.data?.derived || persisted;
    const currency = previewState.data?.price?.currency
        || getPath(root, joinPath(basePath, "commercial.currency"))
        || "INR";
    const packages = Array.isArray(derived.packages) ? derived.packages : [];
    const copy = widget.copy || {};
    const modeLabel = derived.displayMode === "FINAL" ? copy.finalMode?.label
        : derived.displayMode === "STARTING_FROM" ? copy.startingMode?.label
            : copy.estimatedMode?.label;
    const hasAmount = (value) => value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value));
    const hasRange = hasAmount(derived.minAmountMinor) && hasAmount(derived.maxAmountMinor);
    const rangeLabel = !hasRange ? "—"
        : Number(derived.minAmountMinor) === Number(derived.maxAmountMinor)
            ? formatMinor(derived.minAmountMinor, currency)
            : `${formatMinor(derived.minAmountMinor, currency)} — ${formatMinor(derived.maxAmountMinor, currency)}`;

    return (
        <FieldShell widget={widget} error={null}>
            <div className={`tb-derived${previewState.loading ? " is-loading" : ""}`}>
                <header className="tb-derived__hero">
                    <div>
                        <span className="tb-derived__eyebrow">{modeLabel}</span>
                        <strong>{rangeLabel}</strong>
                        <small>
                            {previewState.data
                                ? copy.preview?.label
                                : derived.calculatedAt
                                    ? `${copy.updated?.label || ""} ${new Date(derived.calculatedAt).toLocaleString()}`
                                    : copy.addItems?.label}
                        </small>
                    </div>
                    <div className="tb-derived__status" role="status">
                        {previewState.loading ? <><Spinner size={18} /> {copy.updating?.label}</> : previewState.data ? copy.ready?.label : copy.waiting?.label}
                    </div>
                </header>

                {previewState.error && <div className="tb-derived__error" role="alert">{previewState.error}</div>}

                {packages.length > 0 ? (
                    <div className="tb-derived__packages">
                        {packages.map((item) => (
                            <article className="tb-derived__package" key={item.packageKey}>
                                <header>
                                    <div>
                                        <span>{resolveTierLabel(item.tier)}</span>
                                        <strong>{item.name || item.packageKey}</strong>
                                    </div>
                                    {item.requiresRepricing && <small>{copy.repricing?.label}</small>}
                                </header>
                                <div className="tb-derived__total">
                                    <span>{copy.customerPrice?.label}</span>
                                    <strong>{formatMinor(item.sellingTotalMinor, currency)}</strong>
                                </div>
                                <dl className="tb-derived__breakdown">
                                    <div><dt>{copy.supplierComponents?.label}</dt><dd>{formatMinor(item.costTotalMinor, currency)}</dd></div>
                                    <div><dt>{copy.agentFee?.label}</dt><dd>{formatMinor(item.agentFeeMinor, currency)}</dd></div>
                                    <div><dt>{copy.gst?.label}</dt><dd>{formatMinor(item.agentGstMinor, currency)}</dd></div>
                                    <div className="tb-derived__equation"><dt>{copy.finalAmount?.label}</dt><dd>{formatMinor(item.sellingTotalMinor, currency)}</dd></div>
                                </dl>
                            </article>
                        ))}
                    </div>
                ) : (
                    <p className="tb-repeater__empty">{copy.empty?.label}</p>
                )}

            </div>
        </FieldShell>
    );
}
