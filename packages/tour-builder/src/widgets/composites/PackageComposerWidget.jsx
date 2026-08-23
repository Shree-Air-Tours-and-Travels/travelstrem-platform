import React, { useEffect, useState } from "react";
import { Button, FormInput, FormTextArea } from "@packages/trem-ui";
import { getPath, joinPath } from "../../utils/paths.js";
import { formatMinor, resolveTierLabel } from "../../utils/money.js";

/** Package assignments only; monetary totals remain backend-owned. */
export default function PackageComposerWidget({ widget, root, basePath, onChange }) {
  const listPath = joinPath(basePath, widget.path);
  const packages = Array.isArray(getPath(root, listPath)) ? getPath(root, listPath) : [];
  const componentsPath = joinPath(basePath, widget.componentsPath || "commercial.components");
  const components = Array.isArray(getPath(root, componentsPath))
    ? getPath(root, componentsPath)
    : [];
  const currency = getPath(root, joinPath(basePath, "commercial.currency")) || "INR";
  const tierLabels = widget.tierLabels || {
    BASIC: "Base",
    STANDARD: "Standard",
    PREMIUM: "Premium",
  };
  const allTiers = ["BASIC", "STANDARD", "PREMIUM"];
  const defaultTiers = widget.defaultTiers || allTiers;
  const [activePackageKey, setActivePackageKey] = useState(packages[0]?.packageKey || "");

  useEffect(() => {
    if (!packages.some((pkg) => pkg.packageKey === activePackageKey)) {
      setActivePackageKey(packages[0]?.packageKey || "");
    }
  }, [activePackageKey, packages]);

  const writeList = (next) => onChange(listPath, next);
  const mutatePackage = (index, patch) =>
    writeList(packages.map((pkg, idx) => (idx === index ? { ...pkg, ...patch } : pkg)));

  const setAssignment = (index, componentKey, mode) => {
    const pkg = packages[index] || {};
    const withoutKey = (values = []) => values.filter((key) => key !== componentKey);
    mutatePackage(index, {
      includedComponentKeys:
        mode === "included"
          ? [...withoutKey(pkg.includedComponentKeys), componentKey]
          : withoutKey(pkg.includedComponentKeys),
      optionalComponentKeys:
        mode === "optional"
          ? [...withoutKey(pkg.optionalComponentKeys), componentKey]
          : withoutKey(pkg.optionalComponentKeys),
    });
  };

  const addPackage = () => {
    if (!packages.length) {
      const next = defaultTiers.map((tier) => ({
        packageKey: tier.toLowerCase(),
        tier,
        name: resolveTierLabel(tier, tierLabels),
        description: "",
        enabled: true,
        recommended: tier === "STANDARD",
        includedComponentKeys: [],
        optionalComponentKeys: [],
      }));
      writeList(next);
      setActivePackageKey(next[0]?.packageKey || "");
      return;
    }
    const tier = allTiers.find((candidate) => !packages.some((pkg) => pkg.tier === candidate));
    if (!tier) return;
    const nextPackage = {
      packageKey: tier.toLowerCase(),
      tier,
      name: resolveTierLabel(tier, tierLabels),
      description: "",
      enabled: true,
      recommended: false,
      includedComponentKeys: [],
      optionalComponentKeys: [],
    };
    writeList([...packages, nextPackage]);
    setActivePackageKey(nextPackage.packageKey);
  };

  const groupedComponents = components.reduce(
    (groups, component) => ({
      ...groups,
      [component.type || "OTHER"]: [...(groups[component.type || "OTHER"] || []), component],
    }),
    {},
  );
  const recommendedIndex = packages.findIndex((pkg) => pkg.recommended === true);
  const foundActiveIndex = packages.findIndex((pkg) => pkg.packageKey === activePackageKey);
  const activeIndex = foundActiveIndex >= 0 ? foundActiveIndex : 0;
  const activePackage = packages[activeIndex];

  return (
    <div className="tb-composer" id={`tb-widget-${widget.key}`}>
      <header className="tb-composer__toolbar">
        <div>
          <h4>Build customer packages</h4>
          <p>
            Configure one package at a time. Component assignments drive the server-calculated
            customer price below.
          </p>
        </div>
        {!widget.readOnly && packages.length < 3 && (
          <Button
            type="button"
            variant="outline"
            color="primary"
            iconLeft="plus"
            text={
              packages.length
                ? `Add ${resolveTierLabel(allTiers.find((tier) => !packages.some((pkg) => pkg.tier === tier)) || "", tierLabels)}`
                : "Create packages"
            }
            onClick={addPackage}
          />
        )}
      </header>

      {packages.length > 0 && (
        <nav className="tb-composer__tabs" aria-label="Customer packages">
          {packages.map((pkg) => {
            const includedCount = (pkg.includedComponentKeys || []).length;
            const optionalCount = (pkg.optionalComponentKeys || []).length;
            const active = pkg.packageKey === activePackage?.packageKey;
            return (
              <button
                key={pkg.packageKey}
                type="button"
                className={`tb-composer__tab${active ? " is-active" : ""}`}
                aria-current={active ? "page" : undefined}
                onClick={() => setActivePackageKey(pkg.packageKey)}
              >
                <span className="tb-composer__tab-tier">
                  {resolveTierLabel(pkg.tier, tierLabels)}
                </span>
                <strong>{pkg.name || "Unnamed package"}</strong>
                <small>
                  {includedCount} included · {optionalCount} optional
                </small>
              </button>
            );
          })}
        </nav>
      )}

      {activePackage ? (
        <article
          className={`tb-card tb-composer__card${activePackage.enabled === false ? " is-disabled" : ""}`}
        >
          <header className="tb-card__head tb-composer__card-head">
            <div>
              <span className="tb-composer__eyebrow">
                {resolveTierLabel(activePackage.tier, tierLabels)} package
              </span>
              <strong>{activePackage.name || "Unnamed package"}</strong>
            </div>
            {!widget.readOnly && (
              <Button
                type="button"
                size="small"
                variant="text"
                color="danger"
                primaryClassName="tb-card__op tb-card__op--remove"
                text="Remove package"
                iconLeft="x"
                onClick={() => writeList(packages.filter((_, idx) => idx !== activeIndex))}
              />
            )}
          </header>

          <div className="tb-composer__details">
            <div className="tb-field">
              <label className="tb-field__label">Display name</label>
              <FormInput
                value={activePackage.name || ""}
                disabled={widget.readOnly}
                onChange={(event) => mutatePackage(activeIndex, { name: event.target.value })}
              />
            </div>
            <div className="tb-composer__toggles">
              <label className="tb-check">
                <input
                  type="checkbox"
                  checked={activePackage.enabled !== false}
                  disabled={widget.readOnly}
                  onChange={(event) =>
                    mutatePackage(activeIndex, { enabled: event.target.checked })
                  }
                />
                <span>Offer this package</span>
              </label>
              <label className="tb-check">
                <input
                  type="radio"
                  name={`${listPath}-recommended`}
                  checked={recommendedIndex === activeIndex}
                  disabled={widget.readOnly}
                  onChange={() =>
                    writeList(
                      packages.map((item, idx) => ({ ...item, recommended: idx === activeIndex })),
                    )
                  }
                />
                <span>Recommended</span>
              </label>
            </div>
            <div className="tb-field tb-composer__description">
              <label className="tb-field__label">Customer description</label>
              <FormTextArea
                rows={3}
                value={activePackage.description || ""}
                disabled={widget.readOnly}
                placeholder="Explain who this package is best for and what makes it different."
                onChange={(event) =>
                  mutatePackage(activeIndex, { description: event.target.value })
                }
              />
            </div>
          </div>

          <div className="tb-composer__assignment">
            <header className="tb-composer__assignment-head">
              <div>
                <h4>Package contents</h4>
                <p>Choose exactly one treatment for every component.</p>
              </div>
              <div className="tb-composer__legend" aria-label="Assignment legend">
                <span>Excluded</span>
                <span>Included</span>
                <span>Optional</span>
              </div>
            </header>
            {Object.entries(groupedComponents).map(([type, group]) => (
              <section key={type} className="tb-composer__group">
                <h5>{String(type).toLowerCase()}</h5>
                <div className="tb-composer__components">
                  {group.map((component) => {
                    const included = (activePackage.includedComponentKeys || []).includes(
                      component.componentKey,
                    );
                    const optional = (activePackage.optionalComponentKeys || []).includes(
                      component.componentKey,
                    );
                    const mode = included ? "included" : optional ? "optional" : "excluded";
                    return (
                      <div className="tb-composer__component" key={component.componentKey}>
                        <div className="tb-composer__component-copy">
                          <strong>{component.name || "Unnamed component"}</strong>
                          <span>
                            Supplier cost{" "}
                            {formatMinor(component.pricing?.costAmountMinor, currency)}
                          </span>
                        </div>
                        <div
                          className="tb-composer__choices"
                          role="group"
                          aria-label={`Assignment for ${component.name || component.componentKey}`}
                        >
                          {["excluded", "included", "optional"].map((choice) => (
                            <button
                              key={choice}
                              type="button"
                              className={mode === choice ? "is-active" : ""}
                              aria-pressed={mode === choice}
                              disabled={widget.readOnly}
                              onClick={() =>
                                setAssignment(activeIndex, component.componentKey, choice)
                              }
                            >
                              {choice.charAt(0).toUpperCase() + choice.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
            {!components.length && (
              <p className="tb-repeater__empty">Add cost components first to compose packages.</p>
            )}
          </div>
        </article>
      ) : (
        <p className="tb-repeater__empty">
          Create your Base, Standard and Premium packages to continue.
        </p>
      )}

      {(widget.validation || [])
        .filter((rule) => rule && rule.type === "ENABLED_COUNT")
        .map((rule) => {
          const enabledCount = packages.filter((pkg) => pkg.enabled !== false).length;
          if (enabledCount >= Number(rule.min) && (!rule.max || enabledCount <= Number(rule.max)))
            return null;
          return (
            <small key={rule.message} className="tb-field__error">
              {rule.message}
            </small>
          );
        })}
    </div>
  );
}
