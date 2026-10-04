import React, { useEffect, useMemo, useState } from "react";
import { useMasterOptions } from "@packages/trem-utils";
import Button from "../Button/Button.jsx";
import WizardSectionNav from "../WizardSectionNav/WizardSectionNav.jsx";
import { FormInput, FormSelect } from "../FormControls/FormControls.jsx";
import "./CommercialPackageBuilder.styles.scss";

const makeKey = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export const createCommercialDefaults = (period = {}) => ({
  version: "COMPONENTS_V1",
  currency: "",
  defaultBasis: {
    adults: 1,
    children: 0,
    infants: 0,
    rooms: 1,
    vehicles: 1,
    nights: period.nights ?? 1,
    days: period.days ?? 1,
  },
  components: [],
  packages: [],
});

const money = (minor, currency) =>
  currency
    ? new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(
        (Number(minor) || 0) / 100,
      )
    : `${Number(minor) || 0} minor units`;

export default function CommercialPackageBuilder({
  value,
  onChange,
  period = {},
  onProcessAction,
  processSaving = false,
}) {
  const [activePanel, setActivePanel] = useState("basis");
  const [activeChild, setActiveChild] = useState("details");
  const [activeAssignment, setActiveAssignment] = useState(0);
  const { options } = useMasterOptions([
    "trevista.commercialComponentTypeOptions",
    "trevista.commercialPricingUnitOptions",
    "trevista.commercialStatusOptions",
    "trevista.packageTierOptions",
    "common.currencyOptions",
    "trevista.commercialBasisFieldOptions",
    "trevista.commercialComponentStepOptions",
    "trevista.commercialPackageStepOptions",
  ]);
  const typeOptions = options["trevista.commercialComponentTypeOptions"] || [];
  const unitOptions = options["trevista.commercialPricingUnitOptions"] || [];
  const statusOptions = options["trevista.commercialStatusOptions"] || [];
  const tierOptions = options["trevista.packageTierOptions"] || [];
  const currencyOptions = options["common.currencyOptions"] || [];
  const basisFields = options["trevista.commercialBasisFieldOptions"] || [];
  const componentSteps = options["trevista.commercialComponentStepOptions"] || [];
  const packageSteps = options["trevista.commercialPackageStepOptions"] || [];
  const commercial = value?.version === "COMPONENTS_V1" ? value : createCommercialDefaults(period);
  const update = (patch) => onChange({ ...commercial, ...patch });
  const updateComponent = (index, patch) =>
    update({
      components: commercial.components.map((item, idx) =>
        idx === index ? { ...item, ...patch } : item,
      ),
    });
  const updatePricing = (index, patch) =>
    updateComponent(index, {
      pricing: { ...commercial.components[index].pricing, ...patch },
    });
  const updatePackage = (index, patch) =>
    update({
      packages: commercial.packages.map((item, idx) =>
        idx === index ? { ...item, ...patch } : item,
      ),
    });
  useEffect(() => {
    const patch = {};
    if (!commercial.currency && currencyOptions[0]?.value)
      patch.currency = currencyOptions[0].value;
    if (!commercial.packages.length && tierOptions.length >= 2) {
      patch.packages = tierOptions.slice(0, 2).map((option, index) => ({
        packageKey: String(option.value).toLowerCase(),
        tier: option.value,
        name: option.label,
        enabled: true,
        recommended: index === 1,
        includedComponentKeys: [],
        optionalComponentKeys: [],
      }));
    }
    if (Object.keys(patch).length) update(patch);
  }, [commercial.currency, commercial.packages.length, currencyOptions, tierOptions]);
  const toggleKey = (index, field, key) => {
    const current = commercial.packages[index][field] || [];
    updatePackage(index, {
      [field]: current.includes(key) ? current.filter((item) => item !== key) : [...current, key],
    });
  };
  const addComponent = () => {
    const componentKey = makeKey("component");
    update({
      components: [
        ...commercial.components,
        {
          componentKey,
          type: typeOptions[0]?.value || "",
          name: "",
          description: "",
          active: true,
          status: statusOptions[0]?.value || "",
          pricing: {
            unit: unitOptions[0]?.value || "",
            costAmountMinor: 0,
            sellingAmountMinor: 0,
            currency: commercial.currency || currencyOptions[0]?.value || "",
          },
        },
      ],
    });
    setActivePanel(`component:${componentKey}`);
  };
  const addPackage = () => {
    if (commercial.packages.length >= 3) return;
    const tier = tierOptions
      .map((item) => item.value)
      .find((item) => !commercial.packages.some((pkg) => pkg.tier === item));
    if (!tier) return;
    update({
      packages: [
        ...commercial.packages,
        {
          packageKey: tier.toLowerCase(),
          tier,
          name: tier[0] + tier.slice(1).toLowerCase(),
          enabled: true,
          recommended: false,
          includedComponentKeys: [],
          optionalComponentKeys: [],
        },
      ],
    });
    setActivePanel(`package:${tier.toLowerCase()}`);
  };

  const panels = useMemo(
    () => [
      { id: "basis", label: "Pricing basis" },
      ...commercial.components.map((component, index) => ({
        id: `component:${component.componentKey}`,
        label: component.name || `Component ${index + 1}`,
      })),
      ...commercial.packages.map((pkg, index) => ({
        id: `package:${pkg.packageKey}`,
        label: pkg.name || `Package ${index + 1}`,
      })),
    ],
    [commercial.components, commercial.packages],
  );
  useEffect(() => {
    if (!panels.some((panel) => panel.id === activePanel)) setActivePanel("basis");
  }, [activePanel, panels]);
  useEffect(() => {
    setActiveChild(activePanel === "basis" ? "basis" : "details");
  }, [activePanel]);
  useEffect(() => {
    setActiveAssignment((index) => Math.max(0, Math.min(index, commercial.components.length - 1)));
  }, [commercial.components.length]);
  const activePanelIndex = panels.findIndex((panel) => panel.id === activePanel);
  const childPanels =
    activePanel === "basis"
      ? [{ id: "basis", label: "Basis" }]
      : activePanel.startsWith("component:")
        ? componentSteps.map((item) => ({ id: item.value, label: item.label }))
        : packageSteps.map((item) => ({ id: item.value, label: item.label }));
  const activeChildIndex = childPanels.findIndex((panel) => panel.id === activeChild);
  const saveAndContinue = async () => {
    const nodeId =
      activePanel === "basis"
        ? "pricing.basis"
        : activePanel.startsWith("component:")
          ? "pricing.components"
          : "pricing.packages";
    const saved = await onProcessAction?.(nodeId);
    if (saved === false) return;
    if (activeChildIndex < childPanels.length - 1)
      setActiveChild(childPanels[activeChildIndex + 1].id);
    else if (activePanelIndex < panels.length - 1) setActivePanel(panels[activePanelIndex + 1].id);
  };
  const goPrevious = () => {
    if (activeChildIndex > 0) setActiveChild(childPanels[activeChildIndex - 1].id);
    else setActivePanel(panels[activePanelIndex - 1]?.id || "basis");
  };

  return (
    <div className="commercial-builder">
      <header className="commercial-builder__header">
        <div>
          <h3>Cost-based packages</h3>
          <p>
            Enter supplier cost and selling amount in paise. Customer prices are calculated by the
            backend—never typed as a package total.
          </p>
        </div>
        <label>
          Currency
          <FormSelect
            value={commercial.currency || currencyOptions[0]?.value || ""}
            onChange={(event) => update({ currency: event.target.value.toUpperCase() })}
          >
            {currencyOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </FormSelect>
        </label>
      </header>

      <div className="commercial-builder__navigation">
        <WizardSectionNav
          items={panels}
          activeId={activePanel}
          onChange={setActivePanel}
          ariaLabel="Package pricing sections"
        />
        <div className="commercial-builder__navigation-actions">
          <Button type="button" primaryClassName="btn" text="+ Component" onClick={addComponent} />
          {commercial.packages.length < 3 && (
            <Button type="button" primaryClassName="btn" text="+ Package" onClick={addPackage} />
          )}
        </div>
      </div>

      {activePanel === "basis" && (
        <fieldset>
          <legend>Default pricing basis</legend>
          <div className="commercial-builder__basis">
            {basisFields.map((option) => (
              <label key={option.value}>
                {option.label}
                <FormInput
                  type="number"
                  min={option.metadata?.minimum ?? 0}
                  value={commercial.defaultBasis?.[option.value] ?? 0}
                  onChange={(event) =>
                    update({
                      defaultBasis: {
                        ...commercial.defaultBasis,
                        [option.value]: Number(event.target.value),
                      },
                    })
                  }
                />
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {activePanel.startsWith("component:") && (
        <fieldset>
          <legend>Reusable tour components</legend>
          <div className="commercial-builder__stack">
            {commercial.components.map(
              (component, index) =>
                activePanel === `component:${component.componentKey}` && (
                  <article className="commercial-builder__component" key={component.componentKey}>
                    <WizardSectionNav
                      items={childPanels}
                      activeId={activeChild}
                      onChange={setActiveChild}
                      ariaLabel="Component fields"
                    />
                    {activeChild === "details" && (
                      <>
                        <div className="commercial-builder__row">
                          <label>
                            Name
                            <FormInput
                              value={component.name || ""}
                              onChange={(event) =>
                                updateComponent(index, { name: event.target.value })
                              }
                              placeholder="Deluxe room, airport transfer…"
                            />
                          </label>
                          <label>
                            Type
                            <FormSelect
                              value={component.type}
                              onChange={(event) =>
                                updateComponent(index, { type: event.target.value })
                              }
                            >
                              {typeOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </FormSelect>
                          </label>
                          <label>
                            Status
                            <FormSelect
                              value={component.status || "CONFIRMED"}
                              onChange={(event) =>
                                updateComponent(index, { status: event.target.value })
                              }
                            >
                              {statusOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </FormSelect>
                          </label>
                        </div>
                        <label>
                          Description
                          <FormInput
                            value={component.description || ""}
                            onChange={(event) =>
                              updateComponent(index, { description: event.target.value })
                            }
                          />
                        </label>
                      </>
                    )}
                    {activeChild === "pricing" && (
                      <>
                        <div className="commercial-builder__row">
                          <label>
                            Pricing unit
                            <FormSelect
                              value={component.pricing?.unit || "PER_PERSON"}
                              onChange={(event) =>
                                updatePricing(index, { unit: event.target.value })
                              }
                            >
                              {unitOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </FormSelect>
                          </label>
                          <label>
                            Supplier cost (paise)
                            <FormInput
                              type="number"
                              min={0}
                              step={1}
                              value={component.pricing?.costAmountMinor ?? 0}
                              onChange={(event) =>
                                updatePricing(index, {
                                  costAmountMinor: Number(event.target.value),
                                })
                              }
                            />
                          </label>
                          <label>
                            Selling amount (paise)
                            <FormInput
                              type="number"
                              min={0}
                              step={1}
                              value={component.pricing?.sellingAmountMinor ?? 0}
                              onChange={(event) =>
                                updatePricing(index, {
                                  sellingAmountMinor: Number(event.target.value),
                                })
                              }
                            />
                          </label>
                        </div>
                        <div className="commercial-builder__summary">
                          <span>
                            Unit cost{" "}
                            {money(component.pricing?.costAmountMinor, commercial.currency)}
                          </span>
                          <span>
                            Unit sell{" "}
                            {money(component.pricing?.sellingAmountMinor, commercial.currency)}
                          </span>
                        </div>
                      </>
                    )}
                    {activeChild === "upgrade" && (
                      <div className="commercial-builder__row">
                        <label>
                          Replaces component (upgrade difference)
                          <FormSelect
                            value={component.replacesComponentKey || ""}
                            onChange={(event) =>
                              updateComponent(index, {
                                replacesComponentKey: event.target.value,
                              })
                            }
                          >
                            <option value="">None</option>
                            {commercial.components
                              .filter((_, idx) => idx !== index)
                              .map((item) => (
                                <option value={item.componentKey} key={item.componentKey}>
                                  {item.name || item.componentKey}
                                </option>
                              ))}
                          </FormSelect>
                        </label>
                        <Button
                          type="button"
                          variant="text"
                          primaryClassName="btn"
                          text="Remove component"
                          onClick={() =>
                            update({
                              components: commercial.components.filter((_, idx) => idx !== index),
                              packages: commercial.packages.map((pkg) => ({
                                ...pkg,
                                includedComponentKeys: (pkg.includedComponentKeys || []).filter(
                                  (key) => key !== component.componentKey,
                                ),
                                optionalComponentKeys: (pkg.optionalComponentKeys || []).filter(
                                  (key) => key !== component.componentKey,
                                ),
                              })),
                            })
                          }
                        />
                      </div>
                    )}
                  </article>
                ),
            )}
          </div>
          {!commercial.components.length && (
            <div className="commercial-builder__empty">
              Add the first reusable cost or service component to continue.
            </div>
          )}
        </fieldset>
      )}

      {activePanel.startsWith("package:") && (
        <fieldset>
          <legend>Packages (choose 2 or 3)</legend>
          <div className="commercial-builder__packages">
            {commercial.packages.map(
              (pkg, index) =>
                activePanel === `package:${pkg.packageKey}` && (
                  <article className="commercial-builder__package" key={pkg.packageKey}>
                    <WizardSectionNav
                      items={childPanels}
                      activeId={activeChild}
                      onChange={setActiveChild}
                      ariaLabel="Package fields"
                    />
                    {activeChild === "details" && (
                      <>
                        <div className="commercial-builder__row">
                          <label>
                            Tier
                            <FormSelect
                              value={pkg.tier}
                              onChange={(event) =>
                                updatePackage(index, { tier: event.target.value })
                              }
                            >
                              {tierOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </FormSelect>
                          </label>
                          <label>
                            Display name
                            <FormInput
                              value={pkg.name || ""}
                              onChange={(event) =>
                                updatePackage(index, { name: event.target.value })
                              }
                            />
                          </label>
                        </div>
                        <label>
                          <FormInput
                            type="checkbox"
                            checked={pkg.recommended === true}
                            onChange={(event) =>
                              updatePackage(index, { recommended: event.target.checked })
                            }
                          />{" "}
                          Recommended package
                        </label>
                      </>
                    )}
                    {activeChild === "assignment" && (
                      <div className="commercial-builder__matrix">
                        <WizardSectionNav
                          items={commercial.components.map((component, componentIndex) => ({
                            id: String(componentIndex),
                            label: component.name || `Component ${componentIndex + 1}`,
                          }))}
                          activeId={String(activeAssignment)}
                          onChange={(_, index) => setActiveAssignment(index)}
                          ariaLabel="Package component assignments"
                        />
                        {commercial.components.map(
                          (component, componentIndex) =>
                            componentIndex === activeAssignment && (
                              <div key={component.componentKey}>
                                <strong>{component.name || "Unnamed component"}</strong>
                                <label>
                                  <FormInput
                                    type="checkbox"
                                    checked={(pkg.includedComponentKeys || []).includes(
                                      component.componentKey,
                                    )}
                                    onChange={() =>
                                      toggleKey(
                                        index,
                                        "includedComponentKeys",
                                        component.componentKey,
                                      )
                                    }
                                  />{" "}
                                  Included
                                </label>
                                <label>
                                  <FormInput
                                    type="checkbox"
                                    checked={(pkg.optionalComponentKeys || []).includes(
                                      component.componentKey,
                                    )}
                                    onChange={() =>
                                      toggleKey(
                                        index,
                                        "optionalComponentKeys",
                                        component.componentKey,
                                      )
                                    }
                                  />{" "}
                                  Optional
                                </label>
                              </div>
                            ),
                        )}
                      </div>
                    )}
                    {commercial.packages.length > 2 && (
                      <Button
                        type="button"
                        variant="text"
                        primaryClassName="btn"
                        text="Remove package"
                        onClick={() =>
                          update({
                            packages: commercial.packages.filter((_, idx) => idx !== index),
                          })
                        }
                      />
                    )}
                  </article>
                ),
            )}
          </div>
        </fieldset>
      )}
      <footer className="commercial-builder__process-actions">
        <Button
          type="button"
          variant="outline"
          primaryClassName="btn"
          disabled={(activePanelIndex <= 0 && activeChildIndex <= 0) || processSaving}
          text="Previous"
          onClick={goPrevious}
        />
        <Button
          type="button"
          primaryClassName="btn"
          disabled={processSaving}
          text={
            processSaving
              ? "Saving draft…"
              : activeChildIndex < childPanels.length - 1 || activePanelIndex < panels.length - 1
                ? "Save & next"
                : "Save package section"
          }
          onClick={saveAndContinue}
        />
      </footer>
      <p className="commercial-builder__authority">
        Preview values are informational. The saved price, taxes, commission, fees, settlement, and
        margin are recalculated by FinancialEngine.
      </p>
    </div>
  );
}
