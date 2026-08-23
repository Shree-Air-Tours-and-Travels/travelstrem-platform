import React, { useEffect, useState } from "react";
import { Button, EmptyState, FloatingActionBar, Spinner, WizardFormShell } from "@packages/trem-ui";
import { ConfirmOverlay } from "@packages/trem-modals";
import useTourBuilder from "../../hooks/useTourBuilder.js";
import useStepForm from "../../hooks/useStepForm.js";
import { tourBuilderApi } from "../../api/tourBuilderApi.js";
import StepRenderer from "./StepRenderer.jsx";
import PasteJsonDialog from "./PasteJsonDialog.jsx";

/**
 * Shared Tour Builder surface. Hosts mount <TourBuilder /> with at most an
 * uploader + exit callback; everything else (steps, fields, validation,
 * permissions) arrives from the backend envelope.
 */
export default function TourBuilder({
  tourId = null,
  startStepKey = null,
  title = "",
  onExit,
  onComplete,
  uploader = null,
  headerExtra = null,
  onLocationChange = null,
  mode = "create",
}) {
  const viewOnly = mode === "view";
  const builder = useTourBuilder({
    tourId,
    startStepKey,
    onExit,
    onComplete,
    onLocationChange,
    trackPosition: !viewOnly,
  });
  const [overview, setOverview] = useState({ steps: [], ui: {} });
  const [confirmExit, setConfirmExit] = useState(false);
  const [pendingStepKey, setPendingStepKey] = useState(null);
  const [workspaceDirty, setWorkspaceDirty] = useState(false);

  useEffect(() => {
    let active = true;
    tourBuilderApi
      .fetchDefinition()
      .then((definition) => active && setOverview(definition || { steps: [], ui: {} }))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  /* Exit asks for confirmation only when the step has unsaved edits. */
  const requestExit = () => {
    if (workspaceDirty) setConfirmExit(true);
    else builder.exit();
  };
  const requestStep = (stepKey) => {
    if (!stepKey || stepKey === builder.currentStepKey) return;
    if (workspaceDirty) setPendingStepKey(stepKey);
    else builder.goTo(stepKey);
  };

  if (builder.loading && !builder.definition) {
    return (
      <div className="tb-shell tb-shell--loading">
        <Spinner size={28} />
        <p>Loading builder…</p>
      </div>
    );
  }

  if (builder.error && !builder.definition) {
    return (
      <div className="tb-shell">
        <EmptyState
          icon="alertCircle"
          title="Builder unavailable"
          description={builder.error}
          action={
            <Button text="Retry" variant="solid" color="primary" onClick={() => builder.reload()} />
          }
        />
      </div>
    );
  }

  if (!builder.definition) return null;

  const progress = Math.max(
    0,
    Math.min(100, Number(builder.meta?.process?.progress?.percentage || 0)),
  );
  const processStatus = String(builder.meta?.process?.status || "draft");
  const modeCopy = overview.ui?.[mode] || overview.ui?.create || {};

  return (
    <>
      <WizardFormShell
        title={title || modeCopy.title || ""}
        subtitle=""
        eyebrow={modeCopy.label || ""}
        status={processStatus}
        steps={(overview.steps || []).map((step) => ({
          id: step.stepKey,
          title: step.title,
          description: step.description,
          disabled: step.readOnlyStep,
        }))}
        activeStepId={builder.currentStepKey}
        completedStepIds={builder.meta?.process?.completedStepKeys || []}
        progress={progress}
        canNavigate={!viewOnly && builder.permissions?.canEdit !== false}
        onStepChange={requestStep}
        headerActions={headerExtra}
        className="tb-shell"
      >
        {builder.error && (
          <div className="tb-banner tb-banner--error" role="alert">
            {builder.error}
          </div>
        )}
        <StepWorkspace
          key={`${builder.currentStepKey}-${builder.tourId || "new"}`}
          builder={builder}
          uploader={uploader}
          onRequestExit={requestExit}
          onDirtyChange={setWorkspaceDirty}
          forceReadOnly={viewOnly}
          mode={mode}
          modeCopy={modeCopy}
        />
      </WizardFormShell>
      <ConfirmOverlay
        open={confirmExit}
        onClose={() => setConfirmExit(false)}
        onConfirm={() => {
          setConfirmExit(false);
          builder.exit();
        }}
        title="Leave with unsaved changes?"
        note="Edits on this step that you have not saved yet will be lost."
        icon="alertTriangle"
        confirmLabel="Leave anyway"
        cancelLabel="Keep editing"
      />
      <ConfirmOverlay
        open={!!pendingStepKey}
        onClose={() => setPendingStepKey(null)}
        onConfirm={() => {
          const target = pendingStepKey;
          setPendingStepKey(null);
          builder.goTo(target);
        }}
        title="Switch steps without saving?"
        note="Unsaved edits on this step will be discarded."
        icon="alertTriangle"
        confirmLabel="Discard & switch"
        cancelLabel="Keep editing"
      />
    </>
  );
}

/** Isolated per-step form so values/errors reset whenever the step changes. */
function StepWorkspace({
  builder,
  uploader,
  onRequestExit,
  onDirtyChange,
  forceReadOnly = false,
  mode = "create",
  modeCopy = {},
}) {
  const form = useStepForm({ definition: builder.definition, initialValues: builder.data });
  const [saving, setSaving] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [showJsonImport, setShowJsonImport] = useState(false);
  const [pricingPreview, setPricingPreview] = useState({ loading: false, data: null, error: null });
  const commercialSignature = JSON.stringify(form.values?.commercial || null);

  useEffect(() => {
    if (typeof onDirtyChange === "function") onDirtyChange(form.isDirty);
  }, [form.isDirty, onDirtyChange]);

  useEffect(() => {
    const serverErrors = builder.fieldErrors || {};
    if (!Object.keys(serverErrors).length) return;
    form.setErrors(
      Object.fromEntries(
        Object.entries(serverErrors).map(([path, message]) => [
          path,
          Array.isArray(message) ? message : [message],
        ]),
      ),
    );
  }, [builder.fieldErrors]);

  useEffect(() => {
    if (builder.currentStepKey !== "commercial") return undefined;
    const commercial = form.values?.commercial;
    const enabledPackages = (commercial?.packages || []).filter((item) => item?.enabled !== false);
    if (!builder.tourId || !commercial?.components?.length || !enabledPackages.length) {
      setPricingPreview({ loading: false, data: null, error: null });
      return undefined;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setPricingPreview((current) => ({ ...current, loading: true, error: null }));
      try {
        const result = await tourBuilderApi.previewPricing({
          tourId: builder.tourId,
          data: { commercial },
          signal: controller.signal,
        });
        setPricingPreview({ loading: false, data: result, error: null });
      } catch (previewError) {
        if (!previewError.cancelled) {
          setPricingPreview({
            loading: false,
            data: null,
            error: previewError.message || "Pricing could not be calculated",
          });
        }
      }
    }, 450);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
    // commercialSignature deliberately tracks the serializable backend payload.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [builder.currentStepKey, builder.tourId, commercialSignature]);

  const readOnly =
    forceReadOnly || !!builder.definition.readOnlyStep || builder.permissions?.canEdit === false;

  const handleJsonApplied = ({ values: merged, appliedKeys, ignoredKeys }) => {
    form.setValues(merged);
    form.clearErrors();
    setShowJsonImport(false);
    const appliedNote = appliedKeys.length
      ? `Applied ${appliedKeys.length} field group${appliedKeys.length === 1 ? "" : "s"} to this step.`
      : "Nothing matched this step.";
    const ignoredNote = ignoredKeys.length
      ? ` ${ignoredKeys.length} field${ignoredKeys.length === 1 ? " was" : "s were"} skipped (belong to other steps or are managed from your account).`
      : "";
    setNotice(`${appliedNote}${ignoredNote}`);
  };

  const persist = async (direction) => {
    const found = form.validate();
    if (Object.keys(found).length) {
      setLocalError("Fix the highlighted fields before continuing.");
      const firstKey = Object.keys(found)[0];
      const node = document.getElementById(`tb-widget-${firstKey}`);
      node?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setSaving(true);
    setLocalError(null);
    try {
      await builder.saveStep({ stepKey: builder.currentStepKey, data: form.values, direction });
      if (direction === "stay") {
        form.resetBaseline(form.values);
        setNotice(modeCopy.savedMessage || "Changes saved.");
      }
    } catch {
      /* builder.error already carries the message */
    } finally {
      setSaving(false);
    }
  };

  const actions = builder.actions || {};
  const showBack = actions.back !== false && !!builder.previousStepKey;
  const showNext = actions.next !== false && !!builder.nextStepKey;
  const stayOnStep = mode === "edit";
  const finishLabel = stayOnStep
    ? modeCopy.primaryAction || "Save changes"
    : builder.definition.nextActionLabel || (showNext ? "Save & continue" : "Finish");

  return (
    <>
      <main className="tb-shell__body">
        <form
          autoComplete="off"
          data-form-type="other"
          data-lpignore="true"
          data-1p-ignore="true"
          onSubmit={(event) => event.preventDefault()}
        >
          <StepRenderer
            definition={builder.definition}
            values={form.values}
            onChange={forceReadOnly ? () => {} : form.change}
            errors={form.errors}
            uploader={uploader}
            runtime={{ pricingPreview }}
          />
        </form>
      </main>

      {(localError || builder.error) && (
        <div className="tb-banner tb-banner--error" role="alert">
          {localError || builder.error}
        </div>
      )}

      {notice && (
        <div className="tb-banner tb-banner--info" role="status">
          <span>{notice}</span>
          <button type="button" aria-label="Dismiss" onClick={() => setNotice(null)}>
            ×
          </button>
        </div>
      )}

      <FloatingActionBar
        align="left-right"
        className="tb-action-bar"
        error={localError || undefined}
        sheetTitle="Tour builder actions"
        actions={
          forceReadOnly
            ? [
                {
                  label: "Exit review",
                  variant: "ghost",
                  iconLeft: "logout",
                  align: "left",
                  onClick: onRequestExit,
                },
              ]
            : [
                ...(showBack
                  ? [
                      {
                        label: "Back",
                        variant: "outline",
                        iconLeft: "chevronLeft",
                        align: "left",
                        disabled: saving,
                        onClick: () => persist("back"),
                      },
                    ]
                  : actions.exit !== false
                    ? [
                        {
                          label: "Exit",
                          variant: "ghost",
                          iconLeft: "logout",
                          align: "left",
                          disabled: saving,
                          onClick: onRequestExit,
                        },
                      ]
                    : []),
                ...(showBack && actions.exit !== false
                  ? [
                      {
                        label: "Exit",
                        variant: "ghost",
                        iconLeft: "logout",
                        align: "left",
                        overflowMobile: true,
                        disabled: saving,
                        onClick: onRequestExit,
                      },
                    ]
                  : []),
                ...(!readOnly
                  ? [
                      {
                        label: "Paste JSON",
                        variant: "ghost",
                        iconLeft: "sparkles",
                        align: "right",
                        overflowMobile: true,
                        disabled: saving,
                        onClick: () => setShowJsonImport(true),
                      },
                    ]
                  : []),
                ...(actions.cancel
                  ? [
                      {
                        label: "Cancel",
                        variant: "ghost",
                        iconLeft: "x",
                        align: "right",
                        overflowMobile: true,
                        disabled: saving,
                        onClick: onRequestExit,
                      },
                    ]
                  : []),
                [
                  {
                    label: saving ? "Saving…" : finishLabel,
                    variant: "primary",
                    iconRight: stayOnStep ? "check" : showNext ? "chevronRight" : "check",
                    align: "right",
                    primary: true,
                    disabled: saving,
                    onClick: () => persist(stayOnStep ? "stay" : showNext ? "next" : "done"),
                  },
                ],
              ].flat()
        }
      />

      <PasteJsonDialog
        open={showJsonImport}
        definition={builder.definition}
        currentValues={form.values}
        onClose={() => setShowJsonImport(false)}
        onApply={handleJsonApplied}
      />
    </>
  );
}
