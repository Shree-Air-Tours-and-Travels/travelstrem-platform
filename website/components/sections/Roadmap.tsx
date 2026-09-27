import { Reveal } from "@/components/animations/Reveal";
import { SectionIntro } from "@/components/marketing/SectionIntro";
import { roadmap } from "@/lib/content";

export function Roadmap() {
  return <section className="section roadmap-section"><div className="shell"><Reveal><SectionIntro eyebrow="The next chapter" title={<>The journey doesn’t end<br />at <em>the booking.</em></>} copy="Our upcoming plans extend the ecosystem into support, team operations and essential travel services." /></Reveal><div className="roadmap-grid">{roadmap.map((item, index) => <Reveal className="roadmap-card" key={item.name} delay={index * 90}><div className="roadmap-top"><span>Upcoming</span><b aria-hidden="true">0{index + 1} ↗</b></div><small>{item.label}</small><h3>{item.name}</h3><p>{item.copy}</p><ul>{item.capabilities.map(text => <li key={text}>{text}</li>)}</ul></Reveal>)}</div><p className="roadmap-note">Planned capabilities. Availability and scope will be shared as these products develop.</p></div></section>;
}
