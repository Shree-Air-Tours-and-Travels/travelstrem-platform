import React from "react";
import { SmoothScroll, Paragraph } from "@packages/trem-ui";

export default {
  title: "Trem UI/Utilities/SmoothScroll",
  component: SmoothScroll,
  tags: ["autodocs"],
  argTypes: {
    variant: { control: "select", options: ["fadeIn", "slideUp", "slideDown", "slideLeft", "slideRight", "scaleIn", "zoomIn"] },
    delay: { control: { type: "number", min: 0, max: 2, step: 0.1 } },
    duration: { control: { type: "number", min: 0.2, max: 2, step: 0.1 } },
    threshold: { control: { type: "number", min: 0, max: 1, step: 0.05 } },
    once: { control: "boolean" },
  },
  args: {
    variant: "slideUp",
    delay: 0,
    duration: 0.6,
    threshold: 0.15,
    once: true,
  },
};

export const Playground = {
  render: (args) => (
    <div style={{ minHeight: "120vh", display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center", padding: 24 }}>
      <Paragraph text="Scroll down to see the animated element..." align="center" variant="caption" />
      <div style={{ height: "60vh" }} />
      <SmoothScroll variant={args.variant} delay={args.delay} duration={args.duration} threshold={args.threshold} once={args.once}>
        <div className="trem-storybook-panel" style={{ textAlign: "center", padding: "32px 48px" }}>
          <Paragraph text={`Animation: ${args.variant}`} size="large" />
          <Paragraph text={`Duration: ${args.duration}s · Delay: ${args.delay}s`} variant="caption" />
        </div>
      </SmoothScroll>
      <div style={{ height: "40vh" }} />
    </div>
  ),
  parameters: { layout: "fullscreen" },
};

export const Variants = {
  name: "All Variants",
  render: () => (
    <div style={{ minHeight: "200vh", display: "flex", flexDirection: "column", gap: 80, padding: 24, maxWidth: 600, margin: "0 auto" }}>
      {["fadeIn", "slideUp", "slideDown", "slideLeft", "slideRight", "scaleIn", "zoomIn"].map((v, i) => (
        <SmoothScroll key={v} variant={v} delay={i * 0.15} duration={0.6}>
          <div className="trem-storybook-panel" style={{ textAlign: "center", padding: 24 }}>
            <Paragraph text={v} size="large" />
          </div>
        </SmoothScroll>
      ))}
    </div>
  ),
  parameters: { layout: "fullscreen" },
};

export const Staggered = {
  name: "Staggered Items",
  render: () => (
    <div style={{ minHeight: "150vh", display: "flex", flexDirection: "column", gap: 40, padding: 24, maxWidth: 400, margin: "0 auto" }}>
      <Paragraph text="Items below animate one by one as you scroll..." align="center" variant="caption" />
      <div style={{ height: "40vh" }} />
      {[1, 2, 3, 4].map((i) => (
        <SmoothScroll key={i} variant="slideUp" delay={(i - 1) * 0.2}>
          <div className="trem-storybook-panel" style={{ padding: 24 }}>
            <Paragraph text={`Item ${i}`} size="large" />
            <Paragraph text="This content fades in with a staggered delay." variant="caption" />
          </div>
        </SmoothScroll>
      ))}
    </div>
  ),
  parameters: { layout: "fullscreen" },
};

export const OneTime = {
  name: "Animate Once (Default)",
  render: () => (
    <div style={{ minHeight: "150vh", display: "flex", flexDirection: "column", gap: 40, padding: 24, maxWidth: 400, margin: "0 auto" }}>
      <Paragraph text="Animate once — scroll past, then back up; won't re-animate." align="center" variant="caption" />
      <div style={{ height: "60vh" }} />
      <SmoothScroll variant="slideUp" once>
        <div className="trem-storybook-panel" style={{ padding: 24 }}>
          <Paragraph text="Animated once" size="large" />
        </div>
      </SmoothScroll>
      <SmoothScroll variant="fadeIn" once>
        <div className="trem-storybook-panel" style={{ padding: 24 }}>
          <Paragraph text="Also animated once" size="large" />
        </div>
      </SmoothScroll>
      <div style={{ height: "40vh" }} />
    </div>
  ),
  parameters: { layout: "fullscreen" },
};
