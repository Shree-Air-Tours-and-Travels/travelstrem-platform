import React, { useEffect, useState } from "react";
import {
  CardWithSubEntity,
  FloatingActionBar,
  FormInput,
  FormSelect,
  FormTextArea,
  Spinner,
  WizardFormShell,
  WizardValidationSummary,
} from "@packages/trem-ui";
import {
  calculateQuote,
  loadQuoteBuilder,
  previewQuoteDocument,
  sendQuote,
  transitionQuoteBuilder,
} from "./quoteBuilderApi.js";
import "./quote-builder.scss";

const getPath = (source, path) =>
  String(path)
    .split(".")
    .reduce((value, key) => value?.[key], source);

const setPath = (source, path, value) => {
  const next = structuredClone(source || {});
  const parts = String(path).split(".");
  const leaf = parts.pop();
  const parent = parts.reduce((current, key) => {
    current[key] ||= {};
    return current[key];
  }, next);
  parent[leaf] = value;
  return next;
};

const money = (minor, currency) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(Number(minor || 0) / 100);

const clone = (value) => structuredClone(value === undefined ? {} : value);

function EntityListField({ field, labels, values, errors, onChange, disabled }) {
  const items = Array.isArray(getPath(values, field.path)) ? getPath(values, field.path) : [];
  const [expandedIndex, setExpandedIndex] = useState(items.length ? 0 : -1);
  const update = (next) => onChange(field.path, next);
  useEffect(() => {
    const prefix = `${field.path}.`;
    const errorIndex = Object.keys(errors || {}).find((path) => path.startsWith(prefix));
    if (errorIndex) setExpandedIndex(Number(errorIndex.slice(prefix.length).split(".")[0]));
  }, [errors, field.path]);
  return (
    <section className="quote-builder__entities">
      <header>
        <div>
          <h3>{field.label || labels[field.labelRef]}</h3>
          <span>{items.length} item{items.length === 1 ? "" : "s"}</span>
          {field.help ? <p>{field.help}</p> : null}
        </div>
        <div className="quote-builder__entity-actions">
          {(field.recommendedItems || []).length ? (
            <button type="button" className="quote-builder__apply" disabled={disabled} onClick={() => update(clone(field.recommendedItems))}>
              {field.applyRecommendedLabel || "Use recommended"}
            </button>
          ) : null}
          <button type="button" className="quote-builder__add" disabled={disabled} onClick={() => {
            const next = clone(field.defaultItem);
            if (field.path.endsWith("itinerary")) next.day = items.length + 1;
            update([...items, next]);
            setExpandedIndex(items.length);
          }}>{field.addLabel || "Add item"}</button>
        </div>
      </header>
      {errors[field.path] ? <em className="quote-builder__entity-error">{errors[field.path]}</em> : null}
      {!items.length ? <div className="quote-builder__empty">{field.emptyText || labels[field.emptyTextRef] || "No items added yet."}</div> : null}
      <div className="quote-builder__entity-list">
        {items.map((item, index) => {
          const isExpanded = expandedIndex === index;
          const title = getPath(item, field.itemTitlePath) || `${field.label || labels[field.labelRef]} ${index + 1}`;
          const visibleFields = (field.itemFields || []).filter((child) => {
            if (!child.visibleWhen?.field) return true;
            const accepted = child.visibleWhen.values || [child.visibleWhen.equals];
            return accepted.includes(getPath(item, child.visibleWhen.field));
          });
          const summaryRows = visibleFields.slice(0, 3).map((child) => {
            const value = getPath(item, child.path);
            const selectedOption = child.options?.find((option) => String(option.value) === String(value));
            const display = selectedOption?.label || (Array.isArray(value) ? value.join(", ") : child.type === "checkbox" ? (value ? "Yes" : "No") : value);
            return display !== "" && display != null ? { id: child.path, label: child.label, value: String(display) } : null;
          }).filter(Boolean);
          return (
            <div className="quote-builder__entity" key={`${field.path}-${index}`}>
              <CardWithSubEntity
                title={title}
                eyebrow={`Item ${index + 1}`}
                items={summaryRows}
                headerActions={disabled ? [] : [
                  { id: "toggle", label: isExpanded ? "Collapse" : "Edit", onClick: () => setExpandedIndex(isExpanded ? -1 : index) },
                  { id: "duplicate", label: "Duplicate", onClick: () => {
                    update([...items.slice(0, index + 1), clone(item), ...items.slice(index + 1)]);
                    setExpandedIndex(index + 1);
                  } },
                  { id: "remove", label: "Remove", variant: "danger", onClick: () => {
                    update(items.filter((_, itemIndex) => itemIndex !== index));
                    setExpandedIndex((current) => current === index ? -1 : current > index ? current - 1 : current);
                  } },
                ]}
              />
              {isExpanded ? <div className="quote-builder__entity-fields">
                {visibleFields.map((child) => (
                  <QuoteField
                    key={child.path}
                    field={child}
                    labels={labels}
                    values={item}
                    errors={{ [child.path]: errors[`${field.path}.${index}.${child.path}`] }}
                    disabled={disabled}
                    onChange={(path, value) => update(items.map((current, itemIndex) => {
                      if (itemIndex !== index) return current;
                      let next = setPath(current, path, value);
                      const selectedOption = child.options?.find((option) => String(option.value) === String(value));
                      Object.entries(selectedOption?.populate || {}).forEach(([targetPath, populatedValue]) => {
                        next = setPath(next, targetPath, clone(populatedValue));
                      });
                      return next;
                    }))}
                  />
                ))}
              </div> : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function QuoteField({ field, labels, values, errors, onChange, disabled }) {
  const label = field.label || labels[field.labelRef] || field.path;
  const raw = getPath(values, field.path);
  const value = field.type === "stringList" && Array.isArray(raw) ? raw.join("\n") : raw ?? "";
  const common = {
    label,
    value,
    required: field.required,
    disabled,
    error: errors[field.path],
    placeholder: field.placeholder,
    onChange: (event) => onChange(field.path, event.target.value),
  };
  if (field.type === "entityList")
    return <EntityListField field={field} labels={labels} values={values} errors={errors} onChange={onChange} disabled={disabled} />;
  const wrap = (control) => (
    <div className={`quote-builder__field${["textarea", "stringList"].includes(field.type) ? " is-full" : ""}`}>
      {control}
      {field.help ? <small>{field.help}</small> : null}
    </div>
  );
  if (field.type === "textarea" || field.type === "stringList")
    return wrap(<FormTextArea {...common} rows={field.rows} maxLength={field.maxLength} />);
  if (field.type === "select")
    return wrap(
      <FormSelect
        {...common}
        options={(field.options || []).map((option) => ({
          value: option.value,
          label: option.label || labels[option.labelRef] || option.value,
        }))}
      />,
    );
  if (field.type === "checkbox")
    return (
      <label className="quote-builder__confirmation">
        <input
          type="checkbox"
          checked={raw === true}
          disabled={disabled}
          onChange={(event) => onChange(field.path, event.target.checked)}
        />
        <span>{label}</span>
        {errors[field.path] ? <em>{errors[field.path]}</em> : null}
      </label>
    );
  return wrap(
    <FormInput
      {...common}
      type={field.type === "money" ? "number" : field.type}
      min={field.min}
      max={field.max}
      step={field.type === "money" ? "0.01" : undefined}
      maxLength={field.maxLength}
    />,
  );
}

export default function QuoteBuilder({ enquiryId, onLoadedMeta, onExit }) {
  const [view, setView] = useState(null);
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const applyResponse = (response) => {
    if (response.componentData?.structure?.type === "quote-builder") {
      setView(response.componentData);
      setValues(response.componentData.data?.values || {});
      onLoadedMeta?.({ enquiryRef: response.componentData.data?.enquiryRef || "Enquiry" });
    }
    if (response.status !== "success") setError(response.message || "Could not save the quote.");
    else setError("");
  };

  useEffect(() => {
    let active = true;
    setLoading(true);
    loadQuoteBuilder(enquiryId).then((response) => {
      if (!active) return;
      applyResponse(response);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [enquiryId]);

  const run = async (action, targetStepId) => {
    setSaving(true);
    const response =
      action === "SEND"
        ? await sendQuote(enquiryId, values)
        : action === "CALCULATE"
          ? await calculateQuote(enquiryId, values)
        : await transitionQuoteBuilder(enquiryId, {
            action,
            targetStepId,
            data: action === "BACK" || action === "GO_TO" ? undefined : values,
          });
    applyResponse(response);
    setSaving(false);
  };

  const previewDocument = async () => {
    const popup = window.open("about:blank", "_blank");
    if (popup) popup.opener = null;
    setSaving(true);
    const response = await previewQuoteDocument(enquiryId, values);
    setSaving(false);
    if (response.status !== "success" || !response.data) {
      popup?.close();
      setError(response.message || "The quotation preview could not be generated.");
      return;
    }
    setError("");
    const url = URL.createObjectURL(response.data);
    if (popup) popup.location.replace(url);
    else window.location.assign(url);
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  if (loading) return <div className="quote-builder__loading"><Spinner /></div>;
  if (!view) return <div className="quote-builder__error" role="alert">{error || "Quote builder could not be loaded."}</div>;

  const labels = view.labels || {};
  const structure = view.structure || {};
  const process = structure.process || {};
  const fields = structure.form?.fields || [];
  const sent = process.status === "SENT";
  const requiredConfirmationMissing = fields.some(
    (field) => field.type === "checkbox" && field.required && getPath(values, field.path) !== true,
  );
  const actions = sent
    ? [
        {
          label: labels[structure.actions.exit.labelRef],
          variant: "outline",
          onClick: onExit,
          disabled: saving,
        },
        {
          label: labels[structure.actions.edit.labelRef],
          variant: "primary",
          align: "right",
          onClick: () => run("EDIT"),
          disabled: saving,
        },
      ]
    : [
        ...(structure.actions?.back
          ? [
              {
                label: labels[structure.actions.back.labelRef],
                variant: "ghost",
                onClick: () => run("BACK"),
                disabled: saving,
              },
            ]
          : []),
        {
          label: labels[structure.actions.save.labelRef],
          variant: "outline",
          onClick: () => run("SAVE"),
          disabled: saving,
        },
        ...(structure.actions?.calculate ? [{
          label: labels[structure.actions.calculate.labelRef],
          variant: "outline",
          onClick: () => run("CALCULATE"),
          disabled: saving,
        }] : []),
        ...(structure.actions?.preview ? [{
          label: labels[structure.actions.preview.labelRef],
          variant: "outline",
          align: "right",
          onClick: previewDocument,
          disabled: saving,
        }] : []),
        {
          label: labels[structure.actions.primary.labelRef],
          variant: "primary",
          align: "right",
          onClick: () =>
            run(structure.actions.primary.id === "send" ? "SEND" : "NEXT"),
          disabled:
            saving ||
            (structure.actions.primary.id === "send" && requiredConfirmationMissing),
        },
      ];

  return (
    <WizardFormShell
      className="quote-builder"
      eyebrow={labels[structure.header.eyebrowRef]}
      title={labels[structure.header.titleRef]}
      subtitle={labels[structure.header.descriptionRef]}
      status={sent ? labels.sent : labels.draft}
      railTitle={labels.builderTitle}
      steps={(process.steps || []).map((step) => ({
        id: step.id,
        title: labels[step.titleRef],
        description: labels[step.descriptionRef],
        disabled: step.disabled || sent,
      }))}
      activeStepId={process.currentStepId}
      completedStepIds={process.completedStepIds || []}
      progress={process.progress || 0}
      onStepChange={(stepId) => run("GO_TO", stepId)}
      actionBar={<FloatingActionBar actions={actions} error={error} />}
    >
      <WizardValidationSummary errors={view.data?.errors || {}} />
      {sent ? (
        <div className="quote-builder__sent" role="status">
          {labels.sentDescription}
        </div>
      ) : null}
      {(view.data?.sourceSections || []).length ? (
        <div className="quote-builder__sources">
          {view.data.sourceSections.map((section) => (
            <CardWithSubEntity
              key={section.id}
              title={section.title || labels[section.titleRef]}
              items={(section.items || []).map((item, index) => typeof item === "object" && item
                ? { id: item.id || `${section.id}-${index}`, label: item.label || `${index + 1}`, value: item.value || "" }
                : { id: `${section.id}-${index}`, label: `${index + 1}`, value: item })}
            />
          ))}
        </div>
      ) : null}
      <div className="quote-builder__form">
        {fields.map((field) => (
          <QuoteField
            key={field.path}
            field={field}
            labels={labels}
            values={values}
            errors={view.data?.errors || {}}
            disabled={saving || sent}
            onChange={(path, value) => setValues((current) => setPath(current, path, value))}
          />
        ))}
      </div>
      {view.data?.preview ? (
        <section className="quote-builder__quotation" aria-label={labels.previewTitle}>
          {["includedPricing", "customPricing"].map((groupRef) => {
            const items = (view.data.preview.items || []).filter((item) => item.groupRef === groupRef);
            return items.length ? (
              <div className="quote-builder__quotation-group" key={groupRef}>
                <h3>{labels[groupRef]}</h3>
                <div className="quote-builder__quotation-items">
                  {items.map((item) => (
                    <CardWithSubEntity
                      key={item.id}
                      title={item.name}
                      eyebrow={item.category}
                      badge={item.pricingTypeLabel}
                      subtitle={(item.details || []).length ? "" : item.description}
                      items={[
                        ...(item.details || []).map((detail, index) => ({ id: `detail-${index}`, label: detail.label, value: detail.value })),
                        { id: "unit", label: "Unit price", value: money(item.unitAmountMinor, view.data.preview.currency) },
                        { id: "quantity", label: "Quantity", value: item.quantity },
                      ]}
                      totals={[{ id: "amount", label: "Line total", value: money(item.amountMinor, view.data.preview.currency), tone: "highlight" }]}
                    />
                  ))}
                </div>
              </div>
            ) : null;
          })}
          <CardWithSubEntity
            className="quote-builder__final-card"
            title={labels.previewTitle}
            subtitle={labels.previewDescription}
            totals={(view.data.preview.rows || []).map((row) => ({ id: row.id, label: labels[row.labelRef], value: money(row.amountMinor, view.data.preview.currency), tone: row.total ? "highlight" : undefined }))}
          />
        </section>
      ) : null}
    </WizardFormShell>
  );
}
