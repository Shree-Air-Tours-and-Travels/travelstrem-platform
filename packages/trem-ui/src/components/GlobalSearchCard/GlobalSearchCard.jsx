import React, { useEffect, useMemo, useState } from "react";
import Button from "../Button/Button.jsx";
import DatePicker from "../DatePicker/DatePicker.jsx";
import InputField from "../InputField/InputField.jsx";
import LocationTypeahead from "../LocationTypeahead/LocationTypeahead.jsx";
import OccupancyPicker from "../OccupancyPicker/OccupancyPicker.jsx";
import SingleSelect from "../SingleSelect/SingleSelect.jsx";
import Icon from "../../icons/Icon/Icon.jsx";
import "./GlobalSearchCard.styles.scss";

const labelFor = (labels = {}, ref, fallback = "") =>
  ref ? labels[ref] || fallback || ref : fallback;

const defaultModes = [
  { id: "flight", label: "Flights", icon: "plane" },
  { id: "hotel", label: "Hotels", icon: "hotel" },
];

const defaultFields = {
  flight: [
    { id: "from", label: "From", placeholder: "Origin city" },
    { id: "to", label: "To", placeholder: "Destination city" },
    { id: "departDate", label: "Departure", type: "date" },
    { id: "returnDate", label: "Return", type: "date" },
    { id: "travellers", label: "Travellers", type: "number", min: 1 },
  ],
  hotel: [
    { id: "destination", label: "Destination", placeholder: "City or hotel" },
    { id: "checkIn", label: "Check-in", type: "date" },
    { id: "checkOut", label: "Check-out", type: "date" },
    { id: "occupancy", label: "Guests and rooms", type: "occupancy" },
  ],
};

const normalizeModes = (modes) =>
  (Array.isArray(modes) && modes.length ? modes : defaultModes).filter((mode) => mode?.id);

const SERVICE_ALIASES = {
  flights: "flight",
  hotels: "hotel",
  cars: "car",
  tours: "tour",
};

const canonicalService = (value = "") => SERVICE_ALIASES[value] || value;

const matchesService = (left, right) => canonicalService(left) === canonicalService(right);

const fieldIcons = {
  from: "plane",
  to: "mapPin",
  destination: "mapPin",
  travellers: "usersRound",
  occupancy: "usersRound",
};

const childAgesFor = (value) =>
  (Array.isArray(value) ? value : String(value || "").split(","))
    .filter((age) => age !== "" && age != null)
    .map(Number);

const occupancyFor = (activeValues = {}, fieldId) =>
  activeValues[fieldId] || {
    adults: Number(activeValues.adults ?? activeValues.guests ?? 1),
    children: Number(activeValues.children ?? 0),
    childAges: childAgesFor(activeValues.childAges),
    rooms: Number(activeValues.rooms ?? 1),
    pets: activeValues.pets === true || String(activeValues.pets).toLowerCase() === "true",
  };

const resolveFields = (fieldsByMode, mode, choice) => {
  const configured =
    fieldsByMode?.[mode] ||
    fieldsByMode?.[canonicalService(mode)] ||
    defaultFields[canonicalService(mode)] ||
    [];

  if (Array.isArray(configured)) return configured;
  return configured?.[choice] || configured?.default || [];
};

export default function GlobalSearchCard({
  labels = {},
  urls = {},
  variant = "all",
  activeService = [],
  eyebrowRef,
  titleRef,
  titleAccentRef,
  descriptionRef,
  backgroundUrlRef,
  ariaLabelRef,
  modes = defaultModes,
  fieldsByMode = defaultFields,
  choiceGroupsByMode = {},
  submitLabelRef,
  trustItems = [],
  overlap = false,
  initialValues = {},
  initialChoices = {},
  onSearch,
  errorMessage,
  fieldErrors = {},
  className = "",
}) {
  const normalizedModes = useMemo(() => normalizeModes(modes), [modes]);
  const enabledModes = useMemo(() => {
    const scopedService = !["all", "hero", "compact"].includes(variant)
      ? canonicalService(variant)
      : "";
    if (scopedService) {
      return normalizedModes.filter((mode) => matchesService(mode.id, scopedService));
    }

    const requested = Array.isArray(activeService) ? activeService.filter(Boolean) : [];
    return requested.length
      ? normalizedModes.filter((mode) => requested.some((id) => matchesService(mode.id, id)))
      : normalizedModes;
  }, [activeService, normalizedModes, variant]);
  const [activeMode, setActiveMode] = useState(
    enabledModes.find((mode) => !mode.disabled)?.id || enabledModes[0]?.id || "flight",
  );
  const [values, setValues] = useState(initialValues);
  const [selectedChoices, setSelectedChoices] = useState(initialChoices);
  const activeChoices =
    choiceGroupsByMode?.[activeMode] || choiceGroupsByMode?.[canonicalService(activeMode)] || [];
  const activeChoice = selectedChoices[activeMode] || activeChoices[0]?.id || "";
  const activeFields = resolveFields(fieldsByMode, activeMode, activeChoice);
  const activeServiceConfig =
    enabledModes.find((mode) => mode.id === activeMode) || enabledModes[0];
  const searchDisabled = Boolean(activeServiceConfig?.disabled);
  const backgroundImage = backgroundUrlRef ? urls[backgroundUrlRef] : "";
  const serviceOnly = !["all", "hero", "compact"].includes(variant);

  useEffect(() => {
    const currentMode = enabledModes.find((mode) => mode.id === activeMode);
    if (!currentMode || currentMode.disabled) {
      setActiveMode(
        enabledModes.find((mode) => !mode.disabled)?.id || enabledModes[0]?.id || "flight",
      );
    }
  }, [activeMode, enabledModes]);

  const updateField = (id, value) =>
    setValues((current) => ({
      ...current,
      [activeMode]: { ...(current[activeMode] || {}), [id]: value },
    }));

  const swapRouteFields = () => {
    setValues((current) => {
      const activeValues = current[activeMode] || {};
      return {
        ...current,
        [activeMode]: {
          ...activeValues,
          from: activeValues.to || "",
          to: activeValues.from || "",
        },
      };
    });
  };

  const updateNestedField = (groupId, rowIndex, fieldId, value) => {
    setValues((current) => {
      const activeValues = current[activeMode] || {};
      const rows = Array.isArray(activeValues[groupId]) ? [...activeValues[groupId]] : [];
      rows[rowIndex] = { ...(rows[rowIndex] || {}), [fieldId]: value };
      return { ...current, [activeMode]: { ...activeValues, [groupId]: rows } };
    });
  };

  const repeatableRows = (field) => {
    const savedRows = values[activeMode]?.[field.id];
    const count = Math.max(Array.isArray(savedRows) ? savedRows.length : 0, field.minItems || 1);
    return Array.from({ length: count }, (_, index) => savedRows?.[index] || {});
  };

  const addRepeatableRow = (field) => {
    const rows = repeatableRows(field);
    if (field.maxItems && rows.length >= field.maxItems) return;
    updateField(field.id, [...rows, {}]);
  };

  const removeRepeatableRow = (field, rowIndex) => {
    const rows = repeatableRows(field);
    if (rows.length <= (field.minItems || 1)) return;
    updateField(
      field.id,
      rows.filter((_, index) => index !== rowIndex),
    );
  };

  const renderInput = (field, value, onChange, name) => {
    if (field.type === "airport") {
      return (
        <LocationTypeahead
          value={value}
          onChange={onChange}
          placeholder={labelFor(labels, field.placeholderRef, field.placeholder)}
          required={field.required}
          disabled={field.disabled || searchDisabled}
          mode="airport"
        />
      );
    }
    if (field.type === "date") {
      return (
        <DatePicker
          className="trem-global-search__date"
          value={value || ""}
          onChange={onChange}
          required={field.required}
          disabled={field.disabled || searchDisabled}
          min={field.minField ? values[activeMode]?.[field.minField] || field.min : field.min}
          max={field.max}
          placeholder={labelFor(
            labels,
            field.placeholderRef,
            labelFor(labels, field.labelRef, field.placeholder),
          )}
        />
      );
    }

    if (field.type === "occupancy") {
      return (
        <OccupancyPicker
          value={value}
          onChange={onChange}
          disabled={field.disabled || searchDisabled}
          maxAdults={field.maxAdults}
          maxChildren={field.maxChildren}
          maxRooms={field.maxRooms}
          labels={{
            title: labelFor(labels, field.labelRef, field.label),
            adults: labelFor(labels, field.adultsLabelRef, "Adults"),
            children: labelFor(labels, field.childrenLabelRef, "Children"),
            childAge: labelFor(labels, field.childAgeLabelRef, "Child {count} age"),
            childAgeHelp: labelFor(labels, field.childAgeHelpRef, "Child ages at check-out are needed for accurate prices."),
            rooms: labelFor(labels, field.roomsLabelRef, "Rooms"),
            pets: labelFor(labels, field.petsLabelRef, "Travelling with pets?"),
            done: labelFor(labels, field.doneLabelRef, "Done"),
          }}
        />
      );
    }

    if (field.type === "select") {
      return (
        <SingleSelect
          className="trem-global-search__select"
          value={value || ""}
          required={field.required}
          disabled={field.disabled || searchDisabled}
          placeholder={labelFor(labels, field.placeholderRef, field.placeholder)}
          options={(field.options || []).map((option) => ({
            ...option,
            label: labelFor(labels, option.labelRef, option.label),
          }))}
          onChange={onChange}
        />
      );
    }

    return (
      <InputField
        className="trem-global-search__input"
        name={name}
        variant={field.type || "text"}
        inputMode={field.inputMode}
        min={field.minField ? values[activeMode]?.[field.minField] || field.min : field.min}
        max={field.max}
        required={field.required}
        disabled={field.disabled || searchDisabled}
        placeholder={labelFor(labels, field.placeholderRef, field.placeholder)}
        value={value || ""}
        ariaLabel={labelFor(labels, field.labelRef, field.label)}
        onChange={onChange}
      />
    );
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const activeValues = values[activeMode] || {};
    const submittedValues = activeFields.reduce((result, field) => {
      if (field.type !== "occupancy") {
        result[field.id] = activeValues[field.id];
        return result;
      }
      const occupancy = occupancyFor(activeValues, field.id);
      result.adults = occupancy.adults;
      result.children = occupancy.children;
      result.childAges = occupancy.childAges;
      result.rooms = occupancy.rooms;
      result.pets = occupancy.pets;
      return result;
    }, {});
    onSearch?.({
      mode: activeMode,
      resultsPath: activeServiceConfig?.resultsPath,
      values: submittedValues,
      choice: selectedChoices[activeMode] || activeChoices[0]?.id || "",
    });
  };

  return (
    <section
      className={`trem-global-search trem-global-search--${serviceOnly ? "service" : "all"}${overlap && !serviceOnly ? " trem-global-search--overlap" : ""} ${className}`.trim()}
      data-service={canonicalService(activeMode)}
      data-choice={activeChoice}
      style={
        backgroundImage ? { "--trem-global-search-bg": `url("${backgroundImage}")` } : undefined
      }
    >
      <div className="trem-global-search__overlay" />
      {!serviceOnly ? (
        <div className="trem-global-search__content">
          {eyebrowRef ? (
            <span className="trem-global-search__eyebrow">{labelFor(labels, eyebrowRef)}</span>
          ) : null}
          {titleRef ? <h1>{labelFor(labels, titleRef)}{titleAccentRef ? <> <span>{labelFor(labels, titleAccentRef)}</span></> : null}</h1> : null}
          {descriptionRef ? <p>{labelFor(labels, descriptionRef)}</p> : null}
        </div>
      ) : null}

      <form className="trem-global-search__card" onSubmit={handleSubmit}>
        {!serviceOnly && enabledModes.length > 1 ? (
          <div
            className={`trem-global-search__tabs${enabledModes.length <= 4 ? " trem-global-search__tabs--fit" : ""}`}
            role="tablist"
            aria-label={labelFor(labels, ariaLabelRef, "Travel search type")}
            style={{ "--trem-global-search-tab-count": enabledModes.length }}
          >
            {enabledModes.map((mode) => {
              const active = mode.id === activeMode;
              return (
                <button
                  key={mode.id}
                  type="button"
                  className={`trem-global-search__tab${active ? " is-active" : ""}${mode.disabled ? " is-disabled" : ""}`}
                  onClick={() => !mode.disabled && setActiveMode(mode.id)}
                  role="tab"
                  aria-selected={active}
                  aria-disabled={Boolean(mode.disabled)}
                  disabled={mode.disabled}
                >
                  {mode.icon ? (
                    <span className="trem-global-search__tab-icon">
                      <Icon name={mode.icon} size={18} />
                    </span>
                  ) : null}
                  <span>{labelFor(labels, mode.labelRef, mode.label)}</span>
                </button>
              );
            })}
          </div>
        ) : null}

        <div className="trem-global-search__panel">
          {activeChoices.length || activeServiceConfig?.headingRef || activeServiceConfig?.heading ? (
            <div className="trem-global-search__panel-head">
              <div className="trem-global-search__choices">
                {activeChoices.map((choice) => {
                  const active = activeChoice === choice.id;
                  return (
                    <label
                      className={`trem-global-search__eyebrow trem-global-search__choice${active ? " is-active" : ""}${searchDisabled ? " is-disabled" : ""}`}
                      key={choice.id}
                    >
                      <input
                        type="radio"
                        name={`global-search-${activeMode}-choice`}
                        value={choice.id}
                        checked={active}
                        disabled={searchDisabled}
                        onChange={() =>
                          setSelectedChoices((current) => ({ ...current, [activeMode]: choice.id }))
                        }
                      />
                      <span>{labelFor(labels, choice.labelRef, choice.label)}</span>
                    </label>
                  );
                })}
              </div>
              {activeServiceConfig?.headingRef || activeServiceConfig?.heading ? (
                <span className="trem-global-search__eyebrow trem-global-search__service-heading">
                  {labelFor(labels, activeServiceConfig.headingRef, activeServiceConfig.heading)}
                </span>
              ) : null}
            </div>
          ) : null}
          {errorMessage ? (
            <div className="trem-global-search__error" role="alert">
              <Icon name="alertTriangle" size={16} />
              <span>{errorMessage}</span>
            </div>
          ) : null}
          <div
            className="trem-global-search__fields"
            style={{
              "--trem-global-search-field-columns": Math.max(
                1,
                activeFields.filter((field) => field.type !== "repeatable").length,
              ),
            }}
          >
            {activeFields.map((field) =>
              field.type === "repeatable" ? (
                <fieldset className="trem-global-search__repeatable" key={field.id}>
                  <div className="trem-global-search__repeatable-head">
                    <legend>{labelFor(labels, field.labelRef, field.label)}</legend>
                    <button
                      type="button"
                      onClick={() => addRepeatableRow(field)}
                      disabled={
                        searchDisabled ||
                        Boolean(
                          field.maxItems && repeatableRows(field).length >= field.maxItems,
                        )
                      }
                    >
                      <Icon name="plus" size={16} />
                      {labelFor(labels, field.addLabelRef, field.addLabel)}
                    </button>
                  </div>
                  {repeatableRows(field).map((row, rowIndex) => (
                    <div
                      className="trem-global-search__repeatable-row"
                      key={`${field.id}-${rowIndex}`}
                    >
                      {(field.fields || []).map((child) => (
                        <label className={`trem-global-search__nested-field${fieldErrors[`${field.id}.${rowIndex}.${child.id}`] ? " is-error" : ""}`} key={child.id}>
                          <span>{labelFor(labels, child.labelRef, child.label)}</span>
                          {renderInput(
                            child,
                            row[child.id],
                            (value) => updateNestedField(field.id, rowIndex, child.id, value),
                            `${activeMode}-${field.id}-${rowIndex}-${child.id}`,
                          )}
                          {fieldErrors[`${field.id}.${rowIndex}.${child.id}`] ? (
                            <span className="trem-global-search__field-error">{fieldErrors[`${field.id}.${rowIndex}.${child.id}`]}</span>
                          ) : null}
                        </label>
                      ))}
                      <button
                        type="button"
                        className="trem-global-search__remove-row"
                        onClick={() => removeRepeatableRow(field, rowIndex)}
                        disabled={
                          searchDisabled || repeatableRows(field).length <= (field.minItems || 1)
                        }
                        aria-label={labelFor(labels, field.removeAriaLabelRef, field.removeLabel)}
                      >
                        <Icon name="minus" size={16} />
                      </button>
                    </div>
                  ))}
                </fieldset>
              ) : (
                <label
                  className={`trem-global-search__field${field.id === "from" && activeFields.some((item) => item.id === "to") ? " has-swap" : ""}${field.id === "to" && activeFields.some((item) => item.id === "from") ? " has-swap-target" : ""}${fieldErrors[field.id] ? " is-error" : ""}`}
                  data-field={field.id}
                  key={field.id}
                >
                  <span className="trem-global-search__field-heading">
                    <span className="trem-global-search__field-label">
                      {labelFor(labels, field.labelRef, field.label)}
                    </span>
                    {field.icon || fieldIcons[field.id] || field.type === "date" ? (
                      <Icon name={field.icon || fieldIcons[field.id] || "calendarDays"} size={16} aria-hidden="true" />
                    ) : null}
                  </span>
                  {renderInput(
                    field,
                    field.type === "occupancy"
                      ? occupancyFor(values[activeMode], field.id)
                      : values[activeMode]?.[field.id],
                    (value) => updateField(field.id, value),
                    `${activeMode}-${field.id}`,
                  )}
                  {field.helpRef || field.help ? (
                    <span className="trem-global-search__field-help">
                      {labelFor(labels, field.helpRef, field.help)}
                    </span>
                  ) : null}
                  {fieldErrors[field.id] ? (
                    <span className="trem-global-search__field-error">{fieldErrors[field.id]}</span>
                  ) : null}
                  {field.id === "from" && activeFields.some((item) => item.id === "to") ? (
                    <button
                      type="button"
                      className="trem-global-search__swap"
                      onClick={swapRouteFields}
                      disabled={searchDisabled}
                      aria-label={labelFor(labels, "swapRouteAriaLabel", "Swap route")}
                    >
                      <Icon name="refreshCw" size={16} />
                    </button>
                  ) : null}
                </label>
              ),
            )}
            <Button
              type="submit"
              text={labelFor(labels, submitLabelRef, "Search")}
              iconLeft="search"
              primaryClassName="trem-global-search__submit"
              disabled={searchDisabled}
            />
          </div>

          <div className="trem-global-search__trust">
            {trustItems.map((item) => (
              <span key={item.id || item.labelRef}>
                {item.icon ? <Icon name={item.icon} size={14} /> : null}
                {labelFor(labels, item.labelRef, item.label)}
              </span>
            ))}
          </div>
        </div>
      </form>
    </section>
  );
}
