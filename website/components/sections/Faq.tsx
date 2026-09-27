import { faqs } from "@/lib/content";
import { Reveal } from "@/components/animations/Reveal";
import { SectionIntro } from "@/components/marketing/SectionIntro";

export function Faq() {
  return <section className="section faq-section"><div className="flight-path" aria-hidden="true">· · · · · · · · · · · · · ✈</div><div className="shell faq-layout"><Reveal><SectionIntro eyebrow="Questions before take-off" title={<>Clear answers for your <em>next step.</em></>} copy="The demo is tailored to the product and commercial model you want to explore." /></Reveal><div className="faq-list">{faqs.map(([question, answer], index) => <Reveal key={question} delay={index * 40}><details><summary><span>{String(index + 1).padStart(2, "0")}</span>{question}<b>+</b></summary><p>{answer}</p></details></Reveal>)}</div></div></section>;
}
