import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import { breakpoints } from "@packages/trem-design-tokens";
import BottomSheet from "../BottomSheet/BottomSheet.jsx";
import Button from "../Button/Button.jsx";
import "./FilterBox.styles.scss";

export default function FilterBox({ fields = [], value = {}, onApply, title, triggerLabel, closeLabel, applyLabel, resetLabel, disabled = false }) {
  const [open, setOpen] = useState(false);
  const [mobile, setMobile] = useState(false);
  const trigger = useRef(null);
  const panel = useRef(null);
  const id = useId();
  const close = useCallback(() => { setOpen(false); trigger.current?.querySelector("button")?.focus(); }, []);
  useEffect(() => {
    const query = window.matchMedia(`(max-width: ${breakpoints.md})`);
    const update = () => setMobile(query.matches);
    update(); query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (!open) return undefined;
    const focus = window.requestAnimationFrame(() => panel.current?.querySelector("input, button")?.focus());
    const dismiss = (event) => {
      if (!mobile && !panel.current?.contains(event.target) && !trigger.current?.contains(event.target)) close();
    };
    const keyboard = (event) => {
      if (event.key === "Escape") close();
      if (mobile && event.key === "Tab") {
        const dialog = panel.current?.closest('[role="dialog"]');
        const controls = [...(dialog?.querySelectorAll('button:not(:disabled), input:not(:disabled)') || [])];
        const first = controls[0], last = controls.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener("pointerdown", dismiss); document.addEventListener("keydown", keyboard);
    return () => { cancelAnimationFrame(focus); document.removeEventListener("pointerdown", dismiss); document.removeEventListener("keydown", keyboard); };
  }, [open, mobile, close]);
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  const content = <form ref={panel} id={id} className="trem-filter-box" onSubmit={(event) => { event.preventDefault(); onApply?.(draft); close(); }}>
    {!mobile && title ? <header><h2>{title}</h2><Button type="button" variant="text" iconLeft="menuClose" aria-label={closeLabel} onClick={close} /></header> : null}
    <div className="trem-filter-box__fields">
      {fields.map((field) => <fieldset key={field.id} disabled={disabled}>
        <legend>{field.label}</legend>
        <div className="trem-filter-box__chips">
          {(field.options || []).map((option) => {
            const multiple = field.type === "multi";
            const selected = multiple ? (draft[field.id] || []).includes(option.value) : draft[field.id] === option.value;
            return <label key={option.value} className={selected ? "is-selected" : ""}>
              <input type={multiple ? "checkbox" : "radio"} name={field.id} checked={selected}
                onChange={() => setDraft((current) => ({ ...current, [field.id]: multiple
                  ? selected ? (current[field.id] || []).filter((item) => item !== option.value) : [...(current[field.id] || []), option.value]
                  : option.value }))} />
              <span>{option.label}</span>
            </label>;
          })}
        </div>
      </fieldset>)}
    </div>
    <footer>
      <Button type="button" text={resetLabel} variant="outline" disabled={disabled} onClick={() => setDraft({})} />
      <Button type="submit" text={applyLabel} disabled={disabled} />
    </footer>
  </form>;
  return <div className="trem-filter-box-anchor" ref={trigger}>
    <Button type="button" variant="outline" text={triggerLabel} iconLeft="filter" aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? id : undefined} disabled={disabled}
      onClick={() => { setDraft(value); setOpen((current) => !current); }} />
    {mobile ? <BottomSheet open={open} onClose={close} title={title} closeLabel={closeLabel} className="trem-filter-box-sheet">{content}</BottomSheet>
      : open ? <div className="trem-filter-box-dropdown" role="dialog" aria-label={title}>{content}</div> : null}
  </div>;
}
