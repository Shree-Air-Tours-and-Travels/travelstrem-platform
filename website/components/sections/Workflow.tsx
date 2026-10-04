import { partnerWorkflow } from "@/lib/partnership-content";
import { Reveal } from "@/components/animations/Reveal";
import { SectionIntro } from "@/components/marketing/SectionIntro";
import { workflow } from "@/lib/content";

export function Workflow({ partner = false }: { partner?: boolean }) {
  const items = partner ? partnerWorkflow : workflow;
  return <section className="section workflow-section"><div className="shell"><Reveal><SectionIntro eyebrow={partner ? "Partner workflow" : "One continuous journey"} title={partner ? <>From inventory to traveller delivery, <em>without losing context.</em></> : <>From “this looks right” to <em>everything is ready.</em></>} /></Reveal><div className={partner ? "workflow-line partner-workflow" : "workflow-line"}>{items.map(([title, copy], index) => <Reveal className="workflow-step" key={title} delay={index * 65}><b>{String(index + 1).padStart(2, "0")}</b><h3>{title}</h3><p>{copy}</p></Reveal>)}</div></div></section>;
}
