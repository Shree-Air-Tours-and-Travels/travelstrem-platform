"use client";

import { useState, type KeyboardEvent } from "react";
import { Reveal } from "@/components/animations/Reveal";
import { SectionIntro } from "@/components/marketing/SectionIntro";
import { builders } from "@/lib/builder-content";

export function InterfacePreview({ only }: { only?: "agency" }) {
  const available = only ? builders.filter(builder => builder.id === only) : builders;
  const [selected, setSelected] = useState(0);
  const [step, setStep] = useState(0);
  const builder = available[selected];
  const current = builder.steps[step];
  function select(index: number, scrollToPreview = false) {
    setSelected(index);
    setStep(0);
    if (scrollToPreview) {
      requestAnimationFrame(() => document.getElementById("builder-panel")?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "start",
      }));
    }
  }
  function keyboard(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const next = event.key === "ArrowRight" ? (index + 1) % available.length : event.key === "ArrowLeft" ? (index + available.length - 1) % available.length : event.key === "Home" ? 0 : event.key === "End" ? available.length - 1 : null;
    if (next === null) return;
    event.preventDefault(); select(next);
    document.getElementById(`builder-tab-${available[next].id}`)?.focus();
  }
  return <section className="section interface-section" id="builders"><div className="shell">
    <Reveal><SectionIntro eyebrow={only ? "Partnership onboarding" : "The builders behind the experience"} title={only ? <>Your agency.<br /><em>One guided beginning.</em></> : <>Complex work. <em>Clear next steps.</em></>} copy={only ? "Explore the six steps that bring business details, operations, contacts and verification into a partnership application." : "Explore how shared engines turn agency onboarding, tour creation and quotations into guided workflows."} /></Reveal>
    <div className="builder-tabs" role="tablist" aria-label="Product builders">{available.map((item, index) => <button key={item.id} id={`builder-tab-${item.id}`} role="tab" aria-selected={selected === index} aria-controls="builder-panel" tabIndex={selected === index ? 0 : -1} onClick={event => select(index, event.detail !== 0)} onKeyDown={event => keyboard(event, index)}><span aria-hidden="true">0{index + 1}</span>{item.name}</button>)}</div>
    <Reveal variant="media" className="builder-preview"><div id="builder-panel" role="tabpanel" aria-labelledby={`builder-tab-${builder.id}`} tabIndex={0}>
      <div className="builder-header"><div><small>{builder.engine}</small><strong>{builder.title}</strong></div><span>Interactive illustration</span></div>
      <div className="builder-body"><aside aria-label={`${builder.name} steps`}><b>{builder.steps.length} connected steps</b>{builder.steps.map((item, index) => <button key={item.title} onClick={() => setStep(index)} aria-current={step === index ? "step" : undefined}><i>{index < step ? "✓" : index + 1}</i><span>{item.title}</span></button>)}</aside>
        <div className="builder-content" key={`${builder.id}-${step}`}><div className="builder-progress"><small>STEP {step + 1} OF {builder.steps.length}</small><span>{builder.name}</span></div><div className="step-track" aria-hidden="true"><span style={{ width: `${((step + 1) / builder.steps.length) * 100}%` }} /></div><h3>{current.title}</h3><p>{current.copy}</p>
          <div className="builder-fields">{current.fields.map((field, index) => <div key={field}><span>{field}</span><div className="field-line" style={{ width: `${45 + index * 12}%` }} /><small>{index % 2 === 0 ? "Structured information" : "Connected to the journey"}</small></div>)}</div>
          <div className="builder-output"><span><small>THIS STEP CONNECTS TO</small><strong>{current.output}</strong></span><button type="button" className="button button-small" onClick={() => setStep(value => (value + 1) % builder.steps.length)}>{step === builder.steps.length - 1 ? "Restart preview" : "Next step"}<span aria-hidden="true">→</span></button></div>
        </div>
      </div></div></Reveal>
    <div className="builder-caption"><p>{builder.copy}</p><span>Illustrative walkthrough · No information is collected</span></div>
  </div></section>;
}
