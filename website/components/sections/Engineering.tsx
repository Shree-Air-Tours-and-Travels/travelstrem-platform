import { Reveal } from "@/components/animations/Reveal";
import { SectionIntro } from "@/components/marketing/SectionIntro";
import { engineering } from "@/lib/content";

export function Engineering() {
  return <section className="section engineering-section" id="engineering"><div className="shell">
    <Reveal><SectionIntro eyebrow="Built beneath every product" title={<>More than interfaces.<br /><em>A complete engineering foundation.</em></>} copy="Storybook, design tokens, documentation and shared engines give every TravelsTREM product a common language." /></Reveal>
    <div className="engineering-layout"><Reveal variant="media" className="system-preview"><div className="system-toolbar"><span className="system-mark">T</span><strong>TREM / Component library</strong><span>Preview</span></div><div className="system-preview-body"><div className="system-sidebar"><b>Foundations</b><span>Colour</span><span>Typography</span><span>Spacing</span><b>Components</b><span>Buttons</span><span>Forms</span><span>Workflow</span></div><div className="system-canvas"><small>ONE SYSTEM. EVERY PRODUCT.</small><div className="type-specimen">Aa<span>Clarity in every detail.</span></div><div className="swatches" aria-label="Sapphire, amethyst and ruby brand tokens"><i /><i /><i /><i /></div><div className="specimen-controls"><span>Primary action ↗</span><span>Secondary</span></div><div className="specimen-workflow"><span>01 · Collect</span><i /><span>02 · Review</span><i /><span>03 · Complete</span></div><p>Light & dark · Shared tokens · Reusable patterns</p></div></div></Reveal>
      <div className="engineering-notes">{engineering.slice(0, 3).map((item, index) => <Reveal key={item.name} variant="slide" delay={index * 60}><small>{item.label}</small><h3>{item.name}</h3><p>{item.copy}</p></Reveal>)}</div></div>
    <div className="engine-grid">{engineering.slice(3).map((item, index) => <Reveal key={item.name} className="engine-card" delay={index * 70}><span className="engine-number">0{index + 1}</span><small>{item.label}</small><h3>{item.name}</h3><p>{item.copy}</p><div className="engine-connector" aria-hidden="true"><i /><span /><i /></div></Reveal>)}</div>
  </div></section>;
}
