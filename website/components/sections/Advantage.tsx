import { Reveal } from "@/components/animations/Reveal";
import { SectionIntro } from "@/components/marketing/SectionIntro";

const advantages = [["✦", "Personal by design", "Requirements shape the journey instead of disappearing after discovery."], ["⌁", "Operationally connected", "Traveller experience and responsible agency workflows share context."], ["◎", "Built for accountability", "Ownership stays visible from enquiry through delivery."], ["↗", "Ready to grow", "Shared engines and packages keep products consistent as capabilities expand."]];

export function Advantage() {
  return <section className="section advantage-section"><div className="shell"><Reveal><SectionIntro align="center" eyebrow="The TravelsTREM advantage" title={<>Travel expertise meets <em>product engineering.</em></>} copy="Built on real agency experience and a shared technology foundation." /></Reveal><div className="advantage-grid">{advantages.map(([icon, title, copy], index) => <Reveal className="advantage-card" key={title} delay={index * 55}><i>{icon}</i><h3>{title}</h3><p>{copy}</p></Reveal>)}</div><Reveal className="advantage-stage"><span className="stage-word">JOURNEYS, CONNECTED</span><div className="passport-mark"><b>T</b><small>TRAVELSTREM</small></div><div className="luggage" aria-hidden="true"><span /><b /><i /></div></Reveal></div><svg className="wave" viewBox="0 0 1440 90" preserveAspectRatio="none" aria-hidden="true"><path d="M0 40C120 0 180 85 300 45S480 15 600 48 750 85 870 40 1050 10 1170 45 1320 65 1440 30V90H0Z" fill="currentColor" /></svg></section>;
}
