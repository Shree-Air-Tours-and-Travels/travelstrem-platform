import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  EmptyState,
  Icon,
  InputField,
  SingleSelect,
  Spinner,
  StatusBadge,
} from "@packages/trem-ui";
import {
  fetchPricingConfigurations,
  savePricingConfiguration,
} from "../../services/adminService";
import "./PricingConfigurationPage.scss";

const labelFor = (labels, ref, values = {}) => {
  const template = labels?.[ref] || "";
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, String(value ?? "")),
    template,
  );
};

const valueAt = (source, path) =>
  String(path || "")
    .split(".")
    .filter(Boolean)
    .reduce((value, key) => value?.[key], source);

const actionById = (actions, id) => actions.find((action) => action.id === id) || {};

const optionList = (options, optionRef, labels) =>
  (options?.[optionRef] || []).map((option) => ({
    ...option,
    label: labelFor(labels, option.labelRef),
  }));

const conditionMatches = (condition, values) =>
  condition ? values?.[condition.field] === condition.equals : false;

const dynamicRef = (field, key, values) => {
  if (field[key]) return field[key];
  const definition = field[`${key}ByValue`];
  return definition?.map?.[values?.[definition.field]] || "";
};

const flattenDefaults = (defaults = {}) => {
  const { rules, ...fields } = defaults;
  return { ...fields, ...(rules || {}) };
};

function RuleToggle({ definition, checked, labels, stateRefs, onChange }) {
  return (
    <button
      type="button"
      className={`pricing-rule-toggle${checked ? " is-active" : ""}`}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
    >
      <span className="pricing-rule-toggle__icon">
        <Icon name={checked ? stateRefs.enabledIcon : stateRefs.disabledIcon} size={18} />
      </span>
      <span>
        <strong>{labelFor(labels, definition.labelRef)}</strong>
        <small>{labelFor(labels, definition.descriptionRef)}</small>
      </span>
      <span className="pricing-rule-toggle__state">
        {labelFor(labels, checked ? stateRefs.enabled : stateRefs.disabled)}
      </span>
    </button>
  );
}

function ConfigField({ definition, values, options, labels, onChange }) {
  const label = labelFor(labels, dynamicRef(definition, "labelRef", values));
  const placeholder = labelFor(labels, dynamicRef(definition, "placeholderRef", values));
  const disabled = conditionMatches(definition.disabledWhen, values);

  if (definition.component === "select") {
    return (
      <SingleSelect
        label={label}
        value={values[definition.name] ?? ""}
        options={optionList(options, definition.optionsRef, labels)}
        disabled={disabled}
        maxHeight={definition.maxHeight}
        onChange={(value) => onChange(definition.name, value)}
      />
    );
  }

  return (
    <InputField
      variant={definition.variant}
      label={label}
      value={values[definition.name] ?? ""}
      disabled={disabled}
      inputMode={definition.inputMode}
      maxLength={definition.maxLength}
      placeholder={placeholder}
      onChange={(value) => onChange(definition.name, value)}
    />
  );
}

export default function PricingConfigurationPage() {
  const [definition, setDefinition] = useState(null);
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const initialized = useRef(false);

  const labels = definition?.elements?.labels || {};
  const structure = definition?.structure || {};
  const options = definition?.dataScope?.options || {};
  const records = definition?.data?.pricingConfigs || [];
  const config = structure.config || {};
  const widgets = structure.widgets || [];
  const actions = structure.actions || [];
  const editor = widgets.find((widget) => widget.type === "PricingEditor")?.props || {};
  const history = widgets.find((widget) => widget.type === "PricingHistory")?.props || {};
  const header = structure.header || {};
  const payloadDefinition = config.payload || {};

  const defaultValues = useCallback(
    () => flattenDefaults(config.defaults),
    [config.defaults],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const component = await fetchPricingConfigurations();
      setDefinition(component);
      if (!initialized.current) {
        const defaults = component.structure?.config?.defaults || {};
        setValues(flattenDefaults(defaults));
        initialized.current = true;
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const selectedScopeType = values[payloadDefinition.scopeTypeField];
  const selectedScopeId = String(values[payloadDefinition.scopeIdField] || "").trim();
  const currentRecord = useMemo(
    () =>
      records.find(
        (record) =>
          record.scopeType === selectedScopeType && String(record.scopeId) === selectedScopeId,
      ) || null,
    [records, selectedScopeId, selectedScopeType],
  );

  useEffect(() => {
    if (!currentRecord) return;
    setValues((current) => ({
      ...current,
      ...(currentRecord.editor || {}),
      [payloadDefinition.activeField]: currentRecord.active !== false,
      [payloadDefinition.effectiveFromField]: "",
      [payloadDefinition.effectiveUntilField]: "",
    }));
  }, [currentRecord?._id]);

  const updateValue = (name, value) => {
    if (name === payloadDefinition.scopeTypeField) {
      const defaults = defaultValues();
      const globalScope = config.globalScope || {};
      setValues({
        ...defaults,
        [payloadDefinition.scopeTypeField]: value,
        [payloadDefinition.scopeIdField]: value === globalScope.type ? globalScope.id : "",
      });
      setNotice("");
      return;
    }
    setValues((current) => ({ ...current, [name]: value }));
  };

  const editRecord = (record) => {
    setValues({
      ...defaultValues(),
      ...(record.editor || {}),
      [payloadDefinition.scopeTypeField]: record.scopeType,
      [payloadDefinition.scopeIdField]: String(record.scopeId),
      [payloadDefinition.activeField]: record.active !== false,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const save = async () => {
    const scopeId = String(values[payloadDefinition.scopeIdField] || "").trim();
    if (!scopeId) {
      setError(labelFor(labels, config.messages?.scopeRequiredRef));
      return;
    }

    const rules = Object.fromEntries(
      (payloadDefinition.ruleFields || []).map((field) => [field, values[field]]),
    );
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const result = await savePricingConfiguration({
        scopeType: values[payloadDefinition.scopeTypeField],
        scopeId,
        rules,
        active: values[payloadDefinition.activeField],
        effectiveFrom: values[payloadDefinition.effectiveFromField] || null,
        effectiveUntil: values[payloadDefinition.effectiveUntilField] || null,
      });
      if (result.record) editRecord(result.record);
      setNotice(result.message);
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading && !definition) {
    return (
      <div className="pricing-config-page__loading">
        <Spinner size="lg" label="" />
      </div>
    );
  }

  const publishAction = actionById(actions, editor.actionId);
  const refreshAction = actionById(actions, history.refreshActionId);
  const recordAction = actionById(actions, history.recordActionId);
  const scopeOptions = optionList(options, history.scopeOptionsRef, labels);

  return (
    <section className="pricing-config-page">
      <header className="pricing-config-page__hero">
        <div>
          <span>{labelFor(labels, header.eyebrowRef)}</span>
          <h1>{labelFor(labels, header.titleRef)}</h1>
          <p>{labelFor(labels, header.descriptionRef)}</p>
        </div>
        <div className="pricing-config-page__hero-lock">
          <Icon name={header.accessIcon} size={22} />
          <span>{labelFor(labels, header.accessLabelRef)}</span>
        </div>
      </header>

      {error ? <div className="pricing-config-page__message is-error">{error}</div> : null}
      {notice ? <div className="pricing-config-page__message is-success">{notice}</div> : null}

      {loading ? (
        <div className="pricing-config-page__loading">
          <Spinner
            size="lg"
            label={labelFor(labels, config.messages?.loadingRef)}
            direction="column"
          />
        </div>
      ) : (
        <div className="pricing-config-page__layout">
          <form
            className="pricing-config-editor"
            onSubmit={(event) => {
              event.preventDefault();
              save();
            }}
          >
            <div className="pricing-config-editor__heading">
              <div>
                <span>{labelFor(labels, editor.eyebrowRef)}</span>
                <h2>
                  {currentRecord
                    ? labelFor(labels, editor.editTitleRef, { version: currentRecord.version })
                    : labelFor(labels, editor.createTitleRef)}
                </h2>
              </div>
              <StatusBadge
                value={
                  currentRecord
                    ? labelFor(labels, editor.versionRef, { version: currentRecord.version })
                    : labelFor(labels, editor.newScopeRef)
                }
                tone={currentRecord ? editor.recordTone : editor.newTone}
              />
            </div>

            <div className="pricing-config-editor__scope">
              {(editor.scopeFields || []).map((field) => (
                <React.Fragment key={field.name}>
                  <ConfigField
                    definition={field}
                    values={values}
                    options={options}
                    labels={labels}
                    onChange={updateValue}
                  />
                  {field.hintRefsByValue?.[selectedScopeType] ? (
                    <small className="pricing-config-editor__hint">
                      {labelFor(labels, field.hintRefsByValue[selectedScopeType])}
                    </small>
                  ) : null}
                </React.Fragment>
              ))}
            </div>

            {(editor.sections || []).map((section) => (
              <div className="pricing-config-editor__section" key={section.id}>
                <div className="pricing-config-editor__section-title">
                  <span className="pricing-config-editor__section-icon">
                    <Icon name={section.icon} size={20} />
                  </span>
                  <div>
                    <h3>{labelFor(labels, section.titleRef)}</h3>
                    <p>{labelFor(labels, section.descriptionRef)}</p>
                  </div>
                </div>
                {section.toggle ? (
                  <RuleToggle
                    definition={section.toggle}
                    checked={values[section.toggle.name] === true}
                    labels={labels}
                    stateRefs={config.toggleStateRefs || {}}
                    onChange={(value) => updateValue(section.toggle.name, value)}
                  />
                ) : null}
                <div
                  className={`pricing-config-editor__fields${
                    section.columns === 2 ? " pricing-config-editor__fields--two" : ""
                  }`}
                >
                  {(section.fields || []).map((field) => (
                    <ConfigField
                      key={field.name}
                      definition={field}
                      values={values}
                      options={options}
                      labels={labels}
                      onChange={updateValue}
                    />
                  ))}
                </div>
              </div>
            ))}

            <footer className="pricing-config-editor__footer">
              <div>
                <Icon name={editor.footerIcon} size={18} />
                <span>{labelFor(labels, editor.footerNoteRef)}</span>
              </div>
              <Button
                type={publishAction.type}
                text={labelFor(
                  labels,
                  saving ? publishAction.loadingLabelRef : publishAction.labelRef,
                )}
                iconLeft={publishAction.icon}
                disabled={saving || !selectedScopeId}
              />
            </footer>
          </form>

          <aside className="pricing-config-history">
            <div className="pricing-config-history__heading">
              <div>
                <span>{labelFor(labels, history.eyebrowRef)}</span>
                <h2>{labelFor(labels, history.titleRef)}</h2>
              </div>
              <Button
                text={labelFor(labels, refreshAction.labelRef)}
                variant={refreshAction.variant}
                iconLeft={refreshAction.icon}
                onClick={load}
              />
            </div>
            {!records.length ? (
              <EmptyState
                icon={history.emptyIcon}
                title={labelFor(labels, history.emptyTitleRef)}
                description={labelFor(labels, history.emptyDescriptionRef)}
              />
            ) : (
              <div className="pricing-config-history__list">
                {records.map((record) => {
                  const scopeOption = scopeOptions.find(
                    (option) => option.value === record.scopeType,
                  );
                  return (
                    <article className="pricing-config-version" key={record._id}>
                      <div className="pricing-config-version__top">
                        <div>
                          <strong>{scopeOption?.label}</strong>
                          <span>{record.scopeId}</span>
                        </div>
                        <StatusBadge
                          value={labelFor(
                            labels,
                            record.active ? history.activeRef : history.inactiveRef,
                          )}
                          tone={record.active ? history.activeTone : history.inactiveTone}
                          size="sm"
                        />
                      </div>
                      <dl>
                        <div>
                          <dt>{labelFor(labels, history.versionRef, { version: "" })}</dt>
                          <dd>{record.version}</dd>
                        </div>
                        <div>
                          <dt>{labelFor(labels, history.effectiveRef)}</dt>
                          <dd>
                            {record.effectiveFrom
                              ? new Intl.DateTimeFormat(undefined, history.dateFormat).format(
                                  new Date(record.effectiveFrom),
                                )
                              : labelFor(labels, history.immediatelyRef)}
                          </dd>
                        </div>
                      </dl>
                      <div className="pricing-config-version__rules">
                        {(history.summaryItems || []).map((item) => (
                          <span key={item.path}>
                            {labelFor(labels, item.labelRef)}:{" "}
                            {labelFor(
                              labels,
                              valueAt(record, item.path)
                                ? history.enabledRef
                                : history.disabledRef,
                            )}
                          </span>
                        ))}
                      </div>
                      <Button
                        text={labelFor(labels, recordAction.labelRef)}
                        variant={recordAction.variant}
                        iconRight={recordAction.icon}
                        onClick={() => editRecord(record)}
                      />
                    </article>
                  );
                })}
              </div>
            )}
          </aside>
        </div>
      )}
    </section>
  );
}
