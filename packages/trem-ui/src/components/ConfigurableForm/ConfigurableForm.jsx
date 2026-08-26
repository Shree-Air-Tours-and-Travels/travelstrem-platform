import React, { useCallback, useEffect, useMemo, useState } from "react";
import Button from "../Button/Button.jsx";
import Dropdown from "../Dropdown/Dropdown.jsx";
import InputField from "../InputField/InputField.jsx";
import LocationTypeahead from "../LocationTypeahead/LocationTypeahead.jsx";
import DatePicker from "../DatePicker/DatePicker.jsx";
import Icon from "../../icons/Icon/Icon.jsx";
import "./ConfigurableForm.styles.scss";

const optionValue = (option) =>
  typeof option === "string" ? option : (option?.value ?? option?.id);

const optionLabel = (option) =>
  typeof option === "string" ? option : (option?.label ?? optionValue(option));

const AUTO_WIDTH_MAX_LABEL = 16;

const shouldAutoWidth = (field) => {
  if (field.width === "full") return false;
  if (field.width === "auto") return true;
  if (field.type !== "select") return false;
  const options = field.options || [];
  if (!options.length) return false;
  return options.every((option) => optionLabel(option).length <= AUTO_WIDTH_MAX_LABEL);
};

const fieldWidth = (field) => {
  if (field.type !== "select") return undefined;
  if (field.width === "full" || field.width == null)
    return shouldAutoWidth(field) ? "auto" : undefined;
  return field.width;
};

const normalizeFields = (fields, columns) => {
  const flat = [];
  (fields || []).forEach((entry) => {
    if (Array.isArray(entry)) {
      const share = Math.max(1, Math.floor(columns / entry.length));
      entry.forEach((field) => {
        if (field) flat.push({ ...field, colSpan: field.colSpan || share });
      });
    } else if (entry) {
      flat.push(entry);
    }
  });
  return flat;
};

function FieldControl({ field, value, error, onChange }) {
  const type = field.type || "text";
  const placeholder = field.placeholder || "";
  const handleChange = useCallback((next) => onChange(next), [onChange]);

  switch (type) {
    case "location":
      return (
        <LocationTypeahead
          value={value}
          onChange={handleChange}
          label={field.label || field.name}
          placeholder={placeholder}
          required={field.required}
          error={typeof error === "string" ? error : undefined}
          disabled={field.disabled}
          mode={field.locationMode || "place"}
          countries={field.countries || []}
          multiple={field.multiple}
          maxItems={field.maxItems}
        />
      );

    case "select": {
      const label = field.label || field.name;
      return (
        <Dropdown
          variant="select"
          label={field.required ? `${label} *` : label}
          placeholder={placeholder || "\u2014 Select \u2014"}
          value={value}
          onChange={(item) => handleChange(item?.value ?? item?.id)}
          items={(field.options || []).map((option) => ({
            value: String(optionValue(option)),
            label: optionLabel(option),
          }))}
          error={!!error}
          disabled={field.disabled}
          searchPlaceholder={field.searchPlaceholder || "Search..."}
          width={fieldWidth(field)}
        />
      );
    }

    case "date":
      return (
        <DatePicker
          value={value}
          onChange={handleChange}
          mode={field.mode}
          min={field.minDate ?? field.min}
          max={field.maxDate ?? field.max}
          placeholder={placeholder}
          error={!!error}
          disabled={field.disabled}
        />
      );

    case "checkbox":
      return (
        <label className={`trem-form__checkbox${field.disabled ? " is-disabled" : ""}`}>
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => handleChange(e.target.checked)}
            disabled={field.disabled}
          />
          <span>{field.checkboxLabel || field.label || placeholder}</span>
        </label>
      );

    case "switch":
      return (
        <button
          type="button"
          role="switch"
          aria-checked={!!value}
          aria-label={field.label || field.name}
          className={`trem-form__switch${value ? " is-on" : ""}${field.disabled ? " is-disabled" : ""}`}
          onClick={() => handleChange(!value)}
          disabled={field.disabled}
        >
          <span className="trem-form__switch-track">
            <span className="trem-form__switch-thumb" />
          </span>
          {field.switchLabel ? (
            <span className="trem-form__switch-label">{field.switchLabel}</span>
          ) : null}
        </button>
      );

    case "radio":
      return (
        <div className="trem-form__radio-group">
          {(field.options || []).map((option) => {
            const v = optionValue(option);
            const label = optionLabel(option);
            return (
              <label className="trem-form__radio" key={String(v)}>
                <input
                  type="radio"
                  name={field.name}
                  checked={String(value) === String(v)}
                  onChange={() => handleChange(v)}
                  disabled={field.disabled}
                />
                <span>{label}</span>
              </label>
            );
          })}
        </div>
      );

    case "textarea":
      return (
        <textarea
          className={`trem-form__textarea${error ? " has-error" : ""}`}
          rows={field.rows || 3}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          maxLength={field.maxLength}
          disabled={field.disabled}
        />
      );

    case "password":
      return (
        <input
          className={`trem-form__field-input${error ? " has-error" : ""}`}
          type="password"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          maxLength={field.maxLength}
          disabled={field.disabled}
          autoComplete="new-password"
        />
      );

    case "counter": {
      const min = field.min ?? 0;
      const max = field.max;
      const numeric = Number(value) || 0;
      return (
        <div className="trem-form__counter">
          <Button
            primaryClassName="trem-form__counter-btn"
            variant="text"
            type="button"
            disabled={numeric <= min}
            aria-label={field.decrementLabel || "Decrease"}
            onClick={() => handleChange(numeric - 1)}
          >
            <Icon name="minus" size={16} />
          </Button>
          <span className="trem-form__counter-value">{numeric}</span>
          <Button
            primaryClassName="trem-form__counter-btn"
            variant="text"
            type="button"
            disabled={max != null && numeric >= max}
            aria-label={field.incrementLabel || "Increase"}
            onClick={() => handleChange(numeric + 1)}
          >
            <Icon name="plus" size={16} />
          </Button>
        </div>
      );
    }

    default:
      return (
        <InputField
          variant={type}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          label={field.label || field.name}
          required={field.required}
          error={!!error}
          disabled={field.disabled}
          maxLength={field.maxLength}
        />
      );
  }
}

function FieldGroup({ field, value, error, onChange, columns }) {
  if (!field?.name) return null;
  const span = Math.min(columns, Math.max(1, field.colSpan || 1));
  const type = field.type || "text";
  const inlineControl = ["checkbox", "switch", "radio"].includes(type);
  const builtInLabel = [
    "select",
    "text",
    "email",
    "tel",
    "number",
    "monthYear",
    "location",
  ].includes(type);
  const wide = !!field.wide;
  return (
    <div
      className={`trem-form__field trem-form__field--span-${span}${wide ? " trem-form__field--wide" : ""}`}
    >
      {!inlineControl && !builtInLabel && (
        <label className="trem-form__label" htmlFor={`trem-form-${field.name}`}>
          {field.label || field.name}
          {field.required && <span className="trem-form__required"> *</span>}
        </label>
      )}
      {field.help && <p className="trem-form__help">{field.help}</p>}
      <div className="trem-form__control">
        <FieldControl field={field} value={value} error={error} onChange={onChange} />
      </div>
      {error && <div className="trem-form__error">{error}</div>}
    </div>
  );
}

function FormSection({
  section,
  columns,
  mobileColumns,
  values,
  errors,
  onChange,
  open,
  onToggle,
  expandable,
}) {
  const fields = useMemo(() => normalizeFields(section.fields, columns), [section.fields, columns]);
  const showHead = Boolean(section.title || section.icon);
  return (
    <section className="trem-form__section" data-section={section.id}>
      {showHead && (
        <header className="trem-form__section-head">
          {expandable ? (
            <button
              type="button"
              className="trem-form__section-toggle"
              onClick={onToggle}
              aria-expanded={open}
              aria-controls={`trem-form-section-${section.id}`}
            >
              {section.icon && <Icon name={section.icon} size={18} />}
              <span className="trem-form__section-title">{section.title || section.id}</span>
              <Icon
                name="chevronDown"
                className={`trem-form__section-chevron${open ? " is-open" : ""}`}
                size={18}
              />
            </button>
          ) : (
            <div className="trem-form__section-toggle is-static">
              {section.icon && <Icon name={section.icon} size={18} />}
              <span className="trem-form__section-title">{section.title || section.id}</span>
            </div>
          )}
        </header>
      )}
      {section.description && <p className="trem-form__section-desc">{section.description}</p>}
      {open && (
        <div className="trem-form__section-body" id={`trem-form-section-${section.id}`}>
          <div
            className="trem-form__grid"
            style={{ "--trem-form-cols": columns, "--trem-form-cols-mobile": mobileColumns }}
          >
            {fields.map((field) => (
              <FieldGroup
                key={field.name}
                field={field}
                value={values[field.name]}
                error={errors[field.name]}
                onChange={(next) => onChange(field.name, next)}
                columns={columns}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export default function ConfigurableForm({
  config = {},
  values = {},
  errors = {},
  onChange,
  openSections: controlledSections,
  onOpenSectionsChange,
  className = "",
}) {
  const layout = config.layout || {};
  const columns = Math.max(1, Math.min(4, layout.columns || 2));
  const mobileColumns = Math.max(1, Math.min(4, layout.columnsMobile || 3));
  const expandable = layout.expandable !== false;
  const defaultExpanded = layout.defaultExpanded !== false;
  const showExpandAll = layout.showExpandAll === true && (config.sections || []).length > 1;
  const sections = config.sections || [];
  const isControlled = typeof onOpenSectionsChange === "function";

  const defaultState = useMemo(() => {
    const state = {};
    sections.forEach((section) => {
      state[section.id] =
        section.defaultExpanded !== undefined ? !!section.defaultExpanded : defaultExpanded;
    });
    return state;
  }, [sections, defaultExpanded]);

  const [internalOpen, setInternalOpen] = useState(defaultState);

  useEffect(() => {
    setInternalOpen((prev) => {
      let changed = false;
      const next = { ...prev };
      sections.forEach((section) => {
        if (next[section.id] === undefined) {
          next[section.id] =
            section.defaultExpanded !== undefined ? !!section.defaultExpanded : defaultExpanded;
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [sections, defaultExpanded]);

  const openMap = isControlled ? controlledSections || {} : internalOpen;
  const allOpen = sections.length > 0 && sections.every((section) => openMap[section.id] !== false);
  const anyOpen = sections.some((section) => openMap[section.id] !== false);

  const setOpen = useCallback(
    (id, open) => {
      if (isControlled) onOpenSectionsChange({ ...controlledSections, [id]: open });
      else setInternalOpen((prev) => ({ ...prev, [id]: open }));
    },
    [isControlled, onOpenSectionsChange, controlledSections],
  );

  const toggleSection = useCallback(
    (section) => () => {
      if (section.collapsible === false) return;
      setOpen(section.id, openMap[section.id] === false);
    },
    [openMap, setOpen],
  );

  const toggleAll = useCallback(() => {
    const next = !allOpen;
    if (isControlled) {
      const state = {};
      sections.forEach((section) => {
        state[section.id] = next;
      });
      onOpenSectionsChange(state);
    } else {
      setInternalOpen((prev) => {
        const nextState = {};
        sections.forEach((section) => {
          nextState[section.id] = next;
        });
        return nextState;
      });
    }
  }, [allOpen, isControlled, onOpenSectionsChange, sections]);

  return (
    <div className={`trem-form${className ? ` ${className}` : ""}`}>
      {showExpandAll && (
        <div className="trem-form__toolbar">
          <Button
            variant="text"
            color="primary"
            primaryClassName="trem-form__toolbar-btn"
            type="button"
            iconLeft={allOpen ? "minus" : "plus"}
            onClick={toggleAll}
          >
            {allOpen
              ? layout.collapseAllLabel || "Collapse all"
              : layout.expandAllLabel || "Expand all"}
          </Button>
          <span className="trem-form__toolbar-status">
            {anyOpen
              ? `${sections.filter((section) => openMap[section.id] !== false).length}/${sections.length}`
              : `0/${sections.length}`}
          </span>
        </div>
      )}
      <div className="trem-form__sections">
        {sections.map((section) => {
          const collapsible = expandable && section.collapsible !== false;
          return (
            <FormSection
              key={section.id}
              section={section}
              columns={columns}
              mobileColumns={mobileColumns}
              values={values}
              errors={errors}
              onChange={onChange}
              open={openMap[section.id] !== false}
              onToggle={toggleSection(section)}
              expandable={collapsible}
            />
          );
        })}
      </div>
    </div>
  );
}
