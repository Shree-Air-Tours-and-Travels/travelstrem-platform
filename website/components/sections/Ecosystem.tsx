"use client";

import { useEffect, useRef, useState } from "react";
import { Reveal } from "@/components/animations/Reveal";
import { SectionIntro } from "@/components/marketing/SectionIntro";
import { products } from "@/lib/content";

export function Ecosystem() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  useEffect(() => {
    const rows = ref.current?.querySelectorAll<HTMLElement>("[data-product-index]");
    if (!rows) return;
    let observer: IntersectionObserver;
    const observe = () => {
      observer?.disconnect();
      const inset = Math.round(window.innerHeight * .46);
      observer = new IntersectionObserver(() => {
        const centre = window.innerHeight / 2;
        const nearest = Array.from(rows).map(row => {
          const box = row.getBoundingClientRect();
          return { row, distance: Math.abs((box.top + box.bottom) / 2 - centre) };
        }).sort((a, b) => a.distance - b.distance)[0];
        if (nearest) setActive(Number(nearest.row.dataset.productIndex));
      }, { rootMargin: `-${inset}px 0px -${inset}px 0px`, threshold: 0 });
      rows.forEach(row => observer.observe(row));
    };
    observe();
    window.addEventListener("resize", observe);
    return () => { observer.disconnect(); window.removeEventListener("resize", observe); };
  }, []);
  return <section id="ecosystem" className="section ecosystem-section"><div className="shell">
    <Reveal><SectionIntro eyebrow="The TravelsTREM ecosystem" title={<>A product for every part of the journey. <em>One system underneath.</em></>} copy="Traveller products and agency operations share the same design language, records and operational foundation." /></Reveal>
    <div className="ecosystem-grid" ref={ref}>
      <div className="ecosystem-core"><div className="orbit orbit-one" aria-hidden="true" /><div className="orbit orbit-two" aria-hidden="true" /><span>ONE CONNECTED ECOSYSTEM</span><strong key={active}>{products[active].name}</strong><small>{products[active].label}</small><div className="ecosystem-progress" aria-hidden="true">{products.map((product, index) => <i key={product.key} className={index <= active ? "is-current" : ""} />)}</div><span className="ecosystem-count">{products[active].key} / 06</span></div>
      <div className="product-list">{products.map((product, index) => <Reveal key={product.name} className={`product-row${active === index ? " is-active" : ""}`} data-product-index={index}><span>{product.key}</span><div><small>{product.label}</small><h3>{product.name}</h3><p>{product.copy}</p></div></Reveal>)}</div>
    </div>
  </div></section>;
}
