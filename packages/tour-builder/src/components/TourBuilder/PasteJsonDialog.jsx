import React, { useMemo, useState } from "react";
import { ModalShell } from "@packages/trem-modals";
import { Button, FormTextArea, Icon } from "@packages/trem-ui";
import tourBuilderApi from "../../api/tourBuilderApi.js";
import {
  applyPastedJson,
  buildStepTemplate,
  unwrapTourJson,
} from "../../utils/jsonImport.js";

const SAMPLE = `{
  "title": "Himalayan Escape",
  "city": { "from": "Delhi", "to": "Manali" },
  "period": { "days": 6, "nights": 5 }
}`;

const SCOPE_OPTIONS = [
  {
    value: "step",
    icon: "itinerary",
    title: "This step's fields",
    badge: "Recommended",
    description: "Import only the fields available in this section.",
  },
  {
    value: "full",
    icon: "sparkles",
    title: "Complete tour contract",
    badge: "Advanced",
    description: "Insert every supported field for external JSON generation.",
  },
];

/**
 * Schema-aware JSON import shared by the agent and admin Tour Builders.
 * The backend remains the source of truth for template fields and enums.
 */
export default function PasteJsonDialog({ open, definition, currentValues, onClose, onApply }) {
  const [text, setText] = useState("");
  const [templateScope, setTemplateScope] = useState("step");
  const [actionError, setActionError] = useState(null);
  const [hints, setHints] = useState(null);
  const [rules, setRules] = useState([]);
  const [hintsLoading, setHintsLoading] = useState(false);
  const [hintsError, setHintsError] = useState(null);

  const stepTitle = definition?.title || "this step";
  const localFallback = useMemo(() => {
    try {
      return JSON.stringify(buildStepTemplate(definition), null, 2);
    } catch {
      return SAMPLE;
    }
  }, [definition]);

  const editorState = useMemo(() => {
    if (!text.trim()) {
      return { kind: "empty", label: "Waiting for JSON", result: null };
    }

    try {
      const parsed = JSON.parse(text);
      if (!unwrapTourJson(parsed)) {
        return {
          kind: "invalid",
          label: "JSON must contain one tour object",
          result: null,
        };
      }

      const result = applyPastedJson(definition, parsed, currentValues || {});
      if (!result.appliedKeys.length) {
        return {
          kind: "no-match",
          label: `No ${stepTitle} fields found`,
          result,
        };
      }

      const appliedLabel = `${result.appliedKeys.length} field${
        result.appliedKeys.length === 1 ? "" : "s"
      } ready`;
      const skippedLabel = result.ignoredKeys.length
        ? ` · ${result.ignoredKeys.length} skipped`
        : "";
      return {
        kind: "ready",
        label: `Valid JSON · ${appliedLabel}${skippedLabel}`,
        result,
      };
    } catch {
      return {
        kind: "invalid",
        label: "Invalid JSON — check commas, quotes and brackets",
        result: null,
      };
    }
  }, [currentValues, definition, stepTitle, text]);

  if (!open) return null;

  const clearEditor = () => {
    setText("");
    setActionError(null);
    setHints(null);
    setRules([]);
    setHintsError(null);
  };

  const loadTemplate = async () => {
    setActionError(null);
    setHintsError(null);
    setHintsLoading(true);
    try {
      const payload = await tourBuilderApi.fetchTemplate(
        templateScope === "full" ? null : definition?.stepKey,
      );
      const body = payload?.tour ? payload : payload?.data || payload;
      const template =
        templateScope === "full"
          ? (body?.tour ?? {})
          : body?.records
            ? { [body.recordKey || "records"]: body.records }
            : (body?.tour ?? {});
      if (!template || typeof template !== "object" || !Object.keys(template).length) {
        throw new Error("The backend returned an empty template.");
      }
      setText(JSON.stringify(template, null, 2));
      setHints(body?.enums && Object.keys(body.enums).length ? body.enums : null);
      setRules(Array.isArray(body?.rules) ? body.rules : []);
    } catch (templateError) {
      if (templateScope === "step") {
        setText(localFallback);
        setHints(null);
        setRules([]);
        setHintsError(
          "The live contract is unavailable. A safe template from this step is shown instead.",
        );
      } else {
        setHintsError(
          templateError?.message || "The complete backend template is currently unavailable.",
        );
      }
    } finally {
      setHintsLoading(false);
    }
  };

  const handleApply = () => {
    setActionError(null);
    if (editorState.kind !== "ready" || !editorState.result) {
      setActionError(
        editorState.kind === "no-match"
          ? `This JSON has no fields owned by ${stepTitle}. Paste this step's fields and try again.`
          : editorState.label,
      );
      return;
    }

    setText("");
    setHints(null);
    setRules([]);
    onApply(editorState.result);
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      className="tb-json-dialog"
      dialogClassName="tb-json-dialog__surface"
      labelledBy="tb-json-dialog-title"
    >
      <div className="tb-json-dialog__body">
        <header className="tb-json-dialog__head">
          <div>
            <span className="tb-json-dialog__eyebrow">Tour builder import</span>
            <h3 id="tb-json-dialog-title">Import tour data</h3>
            <p>
              Paste valid JSON or start from the backend template. Account-managed fields stay
              protected and imported values can be reviewed before saving.
            </p>
          </div>
          <Button
            type="button"
            variant="text"
            primaryClassName="tb-json-dialog__close"
            iconLeft="x"
            iconSize={20}
            text=""
            onClick={onClose}
            aria-label="Close import dialog"
          />
        </header>

        <div className="tb-json-dialog__content">
          <section className="tb-json-dialog__section" aria-labelledby="tb-json-scope-title">
            <div className="tb-json-dialog__section-head">
              <div>
                <h4 id="tb-json-scope-title">Choose template scope</h4>
                <p>
                  This controls the template below. Apply always updates {stepTitle} only.
                </p>
              </div>
            </div>

            <div className="tb-json-dialog__scopes" role="radiogroup" aria-label="Import scope">
              {SCOPE_OPTIONS.map((option) => {
                const selected = templateScope === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`tb-json-dialog__scope${selected ? " is-selected" : ""}`}
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setTemplateScope(option.value)}
                  >
                    <span className="tb-json-dialog__scope-icon" aria-hidden="true">
                      <Icon name={option.icon} size={20} />
                    </span>
                    <span className="tb-json-dialog__scope-copy">
                      <span className="tb-json-dialog__scope-title">
                        <strong>{option.title}</strong>
                        <small>{option.badge}</small>
                      </span>
                      <span>{option.description}</span>
                    </span>
                    <span className="tb-json-dialog__scope-check" aria-hidden="true">
                      <Icon name={selected ? "check" : "circleDot"} size={18} />
                    </span>
                  </button>
                );
              })}
            </div>

            <Button
              type="button"
              variant="outline"
              color="primary"
              primaryClassName="tb-json-dialog__template-action"
              iconLeft={templateScope === "full" ? "sparkles" : "itinerary"}
              text={
                hintsLoading
                  ? "Loading backend contract…"
                  : `Insert ${templateScope === "full" ? "complete tour" : stepTitle} template`
              }
              disabled={hintsLoading}
              onClick={loadTemplate}
            />
          </section>

          <section className="tb-json-dialog__section tb-json-dialog__editor-section">
            <div className="tb-json-dialog__editor-head">
              <div>
                <h4>JSON payload</h4>
                <span
                  className={`tb-json-dialog__status tb-json-dialog__status--${editorState.kind}`}
                  aria-live="polite"
                >
                  {editorState.label}
                </span>
              </div>
              <Button
                type="button"
                variant="text"
                primaryClassName="tb-json-dialog__clear"
                text="Clear editor"
                disabled={!text}
                onClick={clearEditor}
              />
            </div>

            {actionError ? (
              <div className="tb-json-dialog__message tb-json-dialog__message--error" role="alert">
                <Icon name="info" size={18} />
                <span>{actionError}</span>
              </div>
            ) : null}
            {hintsError ? (
              <div className="tb-json-dialog__message tb-json-dialog__message--warning" role="status">
                <Icon name="info" size={18} />
                <span>{hintsError}</span>
              </div>
            ) : null}

            <FormTextArea
              className={`tb-json${editorState.kind === "invalid" ? " tb-json--invalid" : ""}`}
              rows={13}
              spellCheck={false}
              name="tourBuilderPayload"
              autoComplete="new-password"
              data-form-type="other"
              data-lpignore="true"
              data-1p-ignore="true"
              value={text}
              onChange={(event) => {
                setText(event.target.value);
                setActionError(null);
              }}
              placeholder={localFallback}
              aria-label="Tour JSON object"
            />
          </section>

          {hints || rules.length ? (
            <section className="tb-json-dialog__reference" aria-label="Schema reference">
              <div className="tb-json-dialog__reference-title">
                <Icon name="info" size={18} />
                <div>
                  <strong>Schema reference</strong>
                  <span>Optional guidance for generating valid tour JSON.</span>
                </div>
              </div>
              {hints ? (
                <details className="tb-json-dialog__hints">
                  <summary>Allowed values ({Object.keys(hints).length} fields)</summary>
                  <dl>
                    {Object.entries(hints).map(([path, options]) => (
                      <React.Fragment key={path}>
                        <dt>{path}</dt>
                        <dd>{options.join(" · ")}</dd>
                      </React.Fragment>
                    ))}
                  </dl>
                </details>
              ) : null}
              {rules.length ? (
                <details className="tb-json-dialog__hints">
                  <summary>Template rules</summary>
                  <ul>
                    {rules.map((rule) => (
                      <li key={rule}>{rule}</li>
                    ))}
                  </ul>
                </details>
              ) : null}
            </section>
          ) : null}
        </div>

        <footer className="tb-json-dialog__foot">
          <span>Imported values are not saved until you complete the builder step.</span>
          <div className="tb-json-dialog__actions">
            <Button
              type="button"
              variant="text"
              primaryClassName="tb-json-dialog__cancel"
              text="Cancel"
              onClick={onClose}
            />
            <Button
              type="button"
              variant="solid"
              color="primary"
              primaryClassName="tb-json-dialog__apply"
              text={`Apply to ${stepTitle}`}
              disabled={editorState.kind !== "ready" || hintsLoading}
              onClick={handleApply}
            />
          </div>
        </footer>
      </div>
    </ModalShell>
  );
}
