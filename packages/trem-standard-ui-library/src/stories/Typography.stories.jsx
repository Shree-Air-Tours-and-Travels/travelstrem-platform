import React from "react";
import { HighlightSpan, Paragraph, SubTitle, Title } from "@packages/trem-ui";

export default {
  title: "Trem UI/Foundation/Typography",
  tags: ["autodocs"],
};

//
// ─── TITLE ─────────────────────────────────────────────────────────────────────
//

export const TitlePlayground = {
  name: "Title / Playground",
  component: Title,
  argTypes: {
    variant: { control: "select", options: ["primary", "light", "secondary"] },
    size: { control: "select", options: ["small", "large"] },
    align: { control: "select", options: ["left", "center", "right"] },
    text: { control: "text" },
  },
  args: {
    text: "Travel components for every flow",
    variant: "primary",
    size: "large",
  },
};

export const TitleVariants = {
  name: "Title / Variants",
  render: () => (
    <div className="trem-storybook-column">
      <Title text="Primary Title" variant="primary" size="large" />
      <Title text="Light Title" variant="light" size="large" />
      <Title text="Secondary Title" variant="secondary" size="large" />
    </div>
  ),
};

export const TitleSizes = {
  name: "Title / Sizes",
  render: () => (
    <div className="trem-storybook-column">
      <Title text="Title , Large" size="large" variant="primary" />
      <Title text="Title , Small" size="small" variant="primary" />
    </div>
  ),
};

export const TitleAlignments = {
  name: "Title / Alignments",
  render: () => (
    <div className="trem-storybook-column">
      <Title text="Left aligned" align="left" />
      <Title text="Center aligned" align="center" />
      <Title text="Right aligned" align="right" />
    </div>
  ),
};

//
// ─── SUBTITLE ──────────────────────────────────────────────────────────────────
//

export const SubTitlePlayground = {
  name: "SubTitle / Playground",
  component: SubTitle,
  argTypes: {
    variant: { control: "select", options: ["primary", "secondary", "tertiary", "light"] },
    size: { control: "select", options: ["small", "medium", "large"] },
    text: { control: "text" },
  },
  args: {
    text: "Reusable system pieces for portals, tours, booking, and customer journeys.",
    variant: "tertiary",
    size: "medium",
  },
};

export const SubTitleVariants = {
  name: "SubTitle / Variants",
  render: () => (
    <div className="trem-storybook-column">
      <SubTitle text="Primary SubTitle" variant="primary" />
      <SubTitle text="Secondary SubTitle" variant="secondary" />
      <SubTitle text="Tertiary SubTitle" variant="tertiary" />
      <SubTitle text="Light SubTitle" variant="light" />
    </div>
  ),
};

export const SubTitleSizes = {
  name: "SubTitle / Sizes",
  render: () => (
    <div className="trem-storybook-column">
      <SubTitle text="SubTitle , Large" size="large" variant="secondary" />
      <SubTitle text="SubTitle , Medium" size="medium" variant="secondary" />
      <SubTitle text="SubTitle , Small" size="small" variant="secondary" />
    </div>
  ),
};

//
// ─── PARAGRAPH ─────────────────────────────────────────────────────────────────
//

export const ParagraphPlayground = {
  name: "Paragraph / Playground",
  component: Paragraph,
  argTypes: {
    text: { control: "text" },
    variant: { control: "select", options: ["body", "caption", "lead"] },
    size: { control: "select", options: ["small", "medium", "large"] },
    color: { control: "color" },
    align: { control: "select", options: ["left", "center", "right"] },
  },
  args: {
    text: "The mountains are calling, and I must go. A journey through the Himalayas offers breathtaking views, serene landscapes, and unforgettable experiences.",
    variant: "body",
    size: "medium",
  },
};

export const ParagraphVariants = {
  name: "Paragraph / Variants",
  render: () => (
    <div className="trem-storybook-column">
      <Paragraph text="Body paragraph — the default workhorse for most UI copy. Use it for descriptions, details, and general content." variant="body" />
      <Paragraph text="Lead paragraph — a slightly larger style for introductory or highlighted text sections." variant="lead" />
      <Paragraph text="Caption paragraph — smaller text for footnotes, labels, and auxiliary information." variant="caption" />
    </div>
  ),
};

export const ParagraphSizes = {
  name: "Paragraph / Sizes",
  render: () => (
    <div className="trem-storybook-column">
      <Paragraph text="Large paragraph size — suitable for hero sections or prominent copy." size="large" />
      <Paragraph text="Medium paragraph size — the default balanced size for body content." size="medium" />
      <Paragraph text="Small paragraph size — compact text for dense layouts." size="small" />
    </div>
  ),
};

export const ParagraphColors = {
  name: "Paragraph / Colors & Alignment",
  render: () => (
    <div className="trem-storybook-column">
      <Paragraph text="Primary text color (default) — blends with theme." />
      <Paragraph text="Custom color — using the color prop for brand accents." color="#e67e22" />
      <Paragraph text="Center aligned text — great for callouts and banners." align="center" />
      <Paragraph text="Right aligned text — useful for sidebars and metadata." align="right" />
    </div>
  ),
};

//
// ─── COMBINED ──────────────────────────────────────────────────────────────────
//

export const Headings = {
  name: "Combined Usage",
  render: () => (
    <div className="trem-storybook-column">
      <Title text="Travel components for every flow" size="large" />
      <SubTitle text="Reusable system pieces for portals, tours, booking, and customer journeys." />
      <Paragraph text="Compose pages with shared Trem UI pieces and keep visual language consistent across apps." />
      <p>
        Highlight terms like <HighlightSpan>shared Trem UI</HighlightSpan> pieces to draw attention.
      </p>
    </div>
  ),
};
