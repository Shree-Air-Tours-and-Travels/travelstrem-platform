import React, { useState } from "react";
import { FormInput, FormSelect, FormTextArea } from "@packages/trem-ui";
import { MultiSelect } from "@packages/trem-ui";
import { IconPicker } from "@packages/trem-ui";
import FieldShell from "./FieldShell.jsx";

const disabledProps = (widget) => ({ disabled: !!widget.readOnly || !!widget.disabled });

export const TextWidget = ({ widget, value, onChange, error }) => (
  <FieldShell widget={widget} error={error}>
    <FormInput
      type={widget.inputType || "text"}
      value={value ?? ""}
      placeholder={widget.placeholder}
      onChange={(event) => onChange(widget.path, event.target.value)}
      {...disabledProps(widget)}
    />
  </FieldShell>
);

export const TextAreaWidget = ({ widget, value, onChange, error }) => (
  <FieldShell widget={widget} error={error}>
    <FormTextArea
      rows={widget.rows || 3}
      value={value ?? ""}
      placeholder={widget.placeholder}
      maxLength={widget.maxLength}
      onChange={(event) => onChange(widget.path, event.target.value)}
      {...disabledProps(widget)}
    />
  </FieldShell>
);

export const NumberWidget = ({ widget, value, onChange, error }) => (
  <FieldShell widget={widget} error={error}>
    <FormInput
      type="number"
      min={widget.min}
      max={widget.max}
      step={widget.step || 1}
      value={value ?? ""}
      placeholder={widget.placeholder}
      onChange={(event) => {
        const raw = event.target.value;
        onChange(widget.path, raw === "" ? "" : Number(raw));
      }}
      {...disabledProps(widget)}
    />
  </FieldShell>
);

export const SelectWidget = ({ widget, value, onChange, error, optionsSource }) => (
  <FieldShell widget={widget} error={error}>
    {optionsSource.loading ? (
      <div className="tb-field__loading">Loading options…</div>
    ) : (
      <FormSelect
        value={value ?? ""}
        options={[
          ...(widget.clearable ? [{ value: "", label: "— None —" }] : []),
          ...optionsSource.options,
        ]}
        onChange={(event) => onChange(widget.path, event.target.value)}
        searchable={widget.searchable}
        {...disabledProps(widget)}
      />
    )}
  </FieldShell>
);

export const MultiSelectWidget = ({ widget, value = [], onChange, error, optionsSource }) => (
  <FieldShell widget={widget} error={error}>
    {optionsSource.loading ? (
      <div className="tb-field__loading">Loading options…</div>
    ) : (
      <MultiSelect
        value={Array.isArray(value) ? value.map(String) : []}
        options={optionsSource.options}
        onChange={(next) => onChange(widget.path, next)}
        {...disabledProps(widget)}
      />
    )}
  </FieldShell>
);

export const CheckboxWidget = ({ widget, value, onChange, error }) => (
  <label className={`tb-check${widget.halfWidth ? " tb-field--half" : ""}`}>
    <input
      type="checkbox"
      checked={!!value}
      disabled={!!widget.readOnly || !!widget.disabled}
      onChange={(event) => onChange(widget.path, event.target.checked)}
    />
    <span>{widget.label}</span>
    {widget.help ? <small className="tb-field__help tb-check__help">{widget.help}</small> : null}
    {error?.length ? <small className="tb-field__error">{error[0]}</small> : null}
  </label>
);

export const SwitchWidget = ({ widget, value, onChange, error }) => {
  const disabled = !!widget.readOnly || !!widget.disabled;
  return (
    <label className={`tb-switch${disabled ? " tb-switch--disabled" : ""}`}>
      <input
        type="checkbox"
        role="switch"
        checked={!!value}
        disabled={disabled}
        onChange={(event) => onChange(widget.path, event.target.checked)}
      />
      <span className="tb-switch__track" aria-hidden="true">
        <span className="tb-switch__thumb" />
      </span>
      <span className="tb-switch__copy">
        <strong>{widget.label}</strong>
        {widget.help ? <small>{widget.help}</small> : null}
        {error?.length ? <small className="tb-field__error">{error[0]}</small> : null}
      </span>
    </label>
  );
};

const toDateInput = (iso) => (iso ? String(iso).slice(0, 10) : "");
const toTimeInput = (iso) =>
  iso && String(iso).includes("T") ? String(iso).split("T")[1]?.slice(0, 5) : "";

export const DateWidget = ({ widget, value, onChange, error }) => (
  <FieldShell widget={widget} error={error}>
    <FormInput
      type="date"
      value={toDateInput(value)}
      onChange={(event) => onChange(widget.path, event.target.value || null)}
      {...disabledProps(widget)}
    />
  </FieldShell>
);

export const DateTimeWidget = ({ widget, value, onChange, error }) => (
  <FieldShell widget={widget} error={error}>
    <div className="tb-datetime">
      <FormInput
        type="date"
        value={toDateInput(value)}
        onChange={(event) => {
          const date = event.target.value;
          if (!date) return onChange(widget.path, null);
          const time = toTimeInput(value) || "00:00";
          onChange(widget.path, `${date}T${time}`);
        }}
        {...disabledProps(widget)}
      />
      <FormInput
        type="time"
        value={toTimeInput(value)}
        onChange={(event) => {
          const date = toDateInput(value);
          if (!date) return;
          onChange(widget.path, `${date}T${event.target.value || "00:00"}`);
        }}
        {...disabledProps(widget)}
      />
    </div>
  </FieldShell>
);

/** Free-form string list (meals, inclusions, blackout dates…). */
export const TagsWidget = ({ widget, value = [], onChange, error }) => {
  const items = Array.isArray(value) ? value : [];
  const [draft, setDraft] = useState("");
  const editable = !widget.readOnly && !widget.disabled;
  const listVariant = widget.variant === "list";

  const addDraft = () => {
    const next = draft.trim();
    if (!next || !editable) return;
    onChange(widget.path, [...items, next]);
    setDraft("");
  };

  return (
    <FieldShell widget={widget} error={error}>
      <div
        className={`tb-tags${listVariant ? ` tb-tags--list tb-tags--${widget.tone || "positive"}` : ""}`}
      >
        {items.map((item, index) => (
          <span className="tb-tags__chip" key={`${item}-${index}`}>
            {listVariant ? (
              <span className="tb-tags__marker" aria-hidden="true">
                {widget.tone === "negative" ? "−" : "✓"}
              </span>
            ) : null}
            <span className="tb-tags__text">{String(item)}</span>
            {editable && (
              <button
                type="button"
                aria-label={`${widget.removeLabel || "Remove"} ${String(item)}`}
                onClick={() =>
                  onChange(
                    widget.path,
                    items.filter((_, idx) => idx !== index),
                  )
                }
              >
                ×
              </button>
            )}
          </span>
        ))}
        {editable ? (
          <div className="tb-tags__composer">
            <FormInput
              type="text"
              value={draft}
              placeholder={widget.placeholder || "Add and press Enter"}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== "Enter") return;
                event.preventDefault();
                addDraft();
              }}
            />
            {listVariant ? (
              <button
                className="tb-tags__add"
                type="button"
                disabled={!draft.trim()}
                onClick={addDraft}
              >
                {widget.addLabel || "Add"}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </FieldShell>
  );
};

/** Icon picker constrained to the shared trem icon set. */
export const IconWidget = ({ widget, value, onChange, error }) => {
  return (
    <FieldShell widget={widget} error={error}>
      <IconPicker
        value={value || ""}
        options={widget.options}
        disabled={widget.disabled}
        readOnly={widget.readOnly}
        ariaLabel={widget.label || "Choose an icon"}
        onChange={(next) => onChange(widget.path, next)}
      />
    </FieldShell>
  );
};
