import React from "react";
import { Icon } from "@packages/trem-ui";

const iconNames = [
  "alertTriangle",
  "badgeCheck",
  "bell",
  "bookmark",
  "calendar",
  "check",
  "chevronDown",
  "city",
  "compass",
  "destination",
  "download",
  "eye",
  "filter",
  "flight",
  "heart",
  "hotel",
  "mapPin",
  "menuOpen",
  "moreVertical",
  "payment",
  "search",
  "settings",
  "star",
  "tours",
  "user",
  "wallet",
];

export default {
  title: "Trem UI/Foundation/Icons",
  component: Icon,
  tags: ["autodocs"],
};

export const Gallery = {
  name: "Icon / Gallery",
  render: () => (
    <div className="trem-storybook-icon-grid">
      {iconNames.map((name) => (
        <div className="trem-storybook-icon" key={name}>
          <Icon name={name} size={22} />
          <span>{name}</span>
        </div>
      ))}
    </div>
  ),
};

export const Sizes = {
  name: "Icon / Sizes",
  render: () => (
    <div className="trem-storybook-stack">
      <Icon name="compass" size={16} />
      <Icon name="compass" size={24} />
      <Icon name="compass" size={32} />
      <Icon name="compass" size={48} />
      <Icon name="compass" size={64} />
    </div>
  ),
};

export const Themed = {
  name: "Icon / Themed Examples",
  render: () => (
    <div className="trem-storybook-column">
      <div className="trem-storybook-stack">
        <Icon name="heart" size={24} />
        <Icon name="star" size={24} />
        <Icon name="badgeCheck" size={24} />
        <Icon name="compass" size={24} />
        <Icon name="mapPin" size={24} />
      </div>
      <div className="trem-storybook-stack">
        <Icon name="flight" size={24} />
        <Icon name="hotel" size={24} />
        <Icon name="payment" size={24} />
        <Icon name="wallet" size={24} />
        <Icon name="tours" size={24} />
      </div>
    </div>
  ),
};
