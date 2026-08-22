import React from "react";
import { Icon } from "@packages/trem-ui";
import { getPath } from "../../utils/paths.js";
import { resolveTierLabel, enabledPackages } from "../../utils/money.js";

const formatPackagePrice = (minor, currency = "INR", fallback = "") => {
    if (!Number.isFinite(Number(minor))) return fallback;
    return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(Number(minor) / 100);
};

const formatTourPrice = (amount, currency = "INR") => new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
}).format(Number(amount));

/**
 * Customer-facing package preview rendered from the same backend data the
 * booking engine sees. No hardcoded marketing copy.
 */
export default function CustomerPreviewWidget({ widget, root }) {
    const preview = getPath(root, widget.path || "preview") || {};
    const copy = widget.copy || {};
    const commercial = preview.commercial || {};
    const packages = enabledPackages(commercial.packages || []);
    const componentsById = {};
    (commercial.components || []).forEach((component) => {
        componentsById[component.componentKey] = component.name || component.componentKey;
    });

    const period = preview.period || {};
    const price = preview.price || {};
    const pricePrefix = commercial.displayMode === "STARTING_FROM" ? `${copy.from?.label || ""} ` : commercial.displayMode === "ESTIMATED" ? `${copy.approximate?.label || ""} ` : "";
    const duration = period.days
        ? `${period.days} ${period.days === 1 ? copy.day?.label : copy.days?.label} · ${period.nights || 0} ${period.nights === 1 ? copy.night?.label : copy.nights?.label}`
        : copy.durationPending?.label;

    return (
        <div className="tb-preview" id={`tb-widget-${widget.key}`}>
            <header className="tb-preview__head">
                <div className="tb-preview__identity">
                    <h3>{preview.title || copy.untitled?.label}</h3>
                    <p>
                        <span><Icon name="mapPin" size={16} /> {[preview.city?.from, preview.city?.to].filter(Boolean).join(" → ") || copy.destinationPending?.label}</span>
                        <span><Icon name="calendarDays" size={16} /> {duration}</span>
                    </p>
                </div>
                {(price.min != null && Number(price.min) > 0) && (
                    <div className="tb-preview__price">
                        <small>{copy.from?.label}</small>
                        <strong>{formatTourPrice(price.min, price.currency || commercial.currency)}</strong>
                    </div>
                )}
            </header>

            {commercial.version !== "COMPONENTS_V1" && (
                <p className="tb-repeater__empty">{copy.packagePending?.label}</p>
            )}

            {packages.length > 0 && (
                <div className="tb-preview__grid">
                    {packages.map((pkg) => (
                        <article key={pkg.packageKey} className={`tb-card tb-preview__card${pkg.recommended ? " is-recommended" : ""}`}>
                            <header className="tb-preview__card-head">
                                <div>
                                    <span className="tb-preview__tier">{resolveTierLabel(pkg.tier)}</span>
                                    <h4>{pkg.name || resolveTierLabel(pkg.tier)}</h4>
                                </div>
                                {pkg.recommended && <span className="tb-preview__badge"><Icon name="star" size={12} /> {copy.recommended?.label}</span>}
                            </header>
                            <strong className="tb-preview__package-price">{pricePrefix}{formatPackagePrice(pkg.pricing?.sellingTotalMinor, commercial.currency, copy.pricePending?.label)}</strong>
                            {pkg.description && <p className="tb-preview__desc">{pkg.description}</p>}
                            {!!pkg.includedComponentKeys?.length && <section className="tb-preview__items"><h5>{copy.included?.label}</h5><ul>
                                {pkg.includedComponentKeys.map((key) => <li key={key}><span className="tb-preview__item-icon"><Icon name="check" size={13} /></span>{componentsById[key] || key}</li>)}
                            </ul></section>}
                            {!!pkg.optionalComponentKeys?.length && <section className="tb-preview__items is-optional"><h5>{copy.optional?.label}</h5><ul>
                                {pkg.optionalComponentKeys.map((key) => <li key={key}><span className="tb-preview__item-icon"><Icon name="plus" size={13} /></span>{componentsById[key] || key}</li>)}
                            </ul></section>}
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
}
