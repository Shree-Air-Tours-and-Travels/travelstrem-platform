import React, { useMemo, useState } from "react";
import { ModalShell } from "@packages/trem-modals";
import { Button, FormTextArea, Spinner } from "@packages/trem-ui";
import tourBuilderApi from "../../api/tourBuilderApi.js";
import { applyPastedJson, buildStepTemplate } from "../../utils/jsonImport.js";

const SAMPLE = `{
  "title": "Himalayan Escape",
  "city": { "from": "Delhi", "to": "Manali" },
  "period": { "days": 6, "nights": 5 }
}`;

/**
 * Paste-JSON import for the current step. Templates come from the backend
 * (generated from the real Mongoose schemas) so AI assistants see every
 * possible field with correct types and enum values.
 */
export default function PasteJsonDialog({ open, definition, currentValues, onClose, onApply }) {
  const [text, setText] = useState("");
  const [error, setError] = useState(null);
  const [hints, setHints] = useState(null);
  const [rules, setRules] = useState([]);
  const [hintsLoading, setHintsLoading] = useState(false);
  const [hintsError, setHintsError] = useState(null);

  const localFallback = useMemo(() => {
    try {
      return JSON.stringify(buildStepTemplate(definition), null, 2);
    } catch {
      return SAMPLE;
    }
  }, [definition]);

  if (!open) return null;

  /** Fetches the schema-grounded template; falls back to the widget-derived one. */
  const loadTemplate = async (scope) => {
    setError(null);
    setHintsError(null);
    setHintsLoading(true);
    try {
      const payload = await tourBuilderApi.fetchTemplate(
        scope === "full" ? null : definition?.stepKey,
      );
      const body = payload?.tour ? payload : payload?.data || payload;
      const template =
        scope === "full"
          ? (body?.tour ?? {})
          : body?.records
            ? { [body.recordKey || "records"]: body.records }
            : (body?.tour ?? {});
      if (!Object.keys(template).length) throw new Error("empty");
      setText(JSON.stringify(template, null, 2));
      setHints(body?.enums && Object.keys(body.enums).length ? body.enums : null);
      setRules(Array.isArray(body?.rules) ? body.rules : []);
    } catch {
      setHintsError(
        "Backend template unavailable — showing the field skeleton from this step's form definition instead.",
      );
      setText(localFallback);
      setHints(null);
      setRules([]);
    } finally {
      setHintsLoading(false);
    }
  };

  const handleApply = () => {
    setError(null);
    if (!text.trim()) {
      setError("Paste a JSON object first.");
      return;
    }
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      setError("This is not valid JSON. Check commas, quotes, and brackets.");
      return;
    }
    try {
      const result = applyPastedJson(definition, parsed, currentValues || {});
      // Clear the operational payload before closing/navigating so browser
      // autofill services cannot retain it as a candidate postal address.
      setText("");
      setHints(null);
      setRules([]);
      onApply(result);
    } catch (applyError) {
      setError(applyError.message || "Could not apply this JSON.");
    }
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      className="tb-json-dialog"
      labelledBy="tb-json-dialog-title"
    >
      <div className="tb-json-dialog__body" role="dialog" aria-modal="true">
        <header className="tb-json-dialog__head">
          <div>
            <h3 id="tb-json-dialog-title">Paste JSON</h3>
            <p>
              Paste a complete tour JSON or just this step&apos;s fields. Only fields owned by{" "}
              <strong>{definition?.title || "this step"}</strong> are applied; everything else is
              listed as skipped. Amounts use integer paise.
            </p>
          </div>
          <Button
            type="button"
            variant="text"
            primaryClassName="btn"
            iconLeft="x"
            text=""
            onClick={onClose}
            aria-label="Close"
          />
        </header>

        <div className="tb-json-dialog__templates">
          <Button
            type="button"
            variant="outline"
            color="primary"
            primaryClassName="btn"
            iconLeft="sparkles"
            text={hintsLoading ? "Loading…" : "Use full tour template"}
            disabled={hintsLoading}
            onClick={() => loadTemplate("full")}
          />
          <Button
            type="button"
            variant="outline"
            color="primary"
            primaryClassName="btn"
            iconLeft="itinerary"
            text={hintsLoading ? "Loading…" : "Use this step's template"}
            disabled={hintsLoading}
            onClick={() => loadTemplate("step")}
          />
          {hintsLoading && <Spinner size={16} />}
        </div>

        {error && (
          <div className="tb-banner tb-banner--error" role="alert">
            {error}
          </div>
        )}
        {hintsError && <small className="tb-field__help">{hintsError}</small>}

        <FormTextArea
          className="tb-json"
          rows={14}
          spellCheck={false}
          name="tourBuilderPayload"
          autoComplete="new-password"
          data-form-type="other"
          data-lpignore="true"
          data-1p-ignore="true"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={localFallback}
          aria-label="Tour JSON object"
        />

        {hints && (
          <details className="tb-json-dialog__hints">
            <summary>Allowed enum values ({Object.keys(hints).length} fields)</summary>
            <dl>
              {Object.entries(hints).map(([path, options]) => (
                <React.Fragment key={path}>
                  <dt>{path}</dt>
                  <dd>{options.join(" | ")}</dd>
                </React.Fragment>
              ))}
            </dl>
          </details>
        )}

        {rules.length ? (
          <details className="tb-json-dialog__hints" open>
            <summary>AI template rules</summary>
            <ul>
              {rules.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          </details>
        ) : null}

        <footer className="tb-json-dialog__foot">
          <span>Dates: YYYY-MM-DD · ISO · DD/MM/YYYY. Enum seeds already use allowed values.</span>
          <div className="tb-json-dialog__actions">
            <Button
              type="button"
              variant="text"
              color="primary"
              primaryClassName="btn"
              text="Clear"
              disabled={!text}
              onClick={() => {
                setText("");
                setError(null);
                setHints(null);
                setRules([]);
              }}
            />
            <Button
              type="button"
              variant="solid"
              color="primary"
              primaryClassName="btn"
              text="Apply JSON"
              disabled={!text.trim() || hintsLoading}
              onClick={handleApply}
            />
          </div>
        </footer>
      </div>
    </ModalShell>
  );
}
