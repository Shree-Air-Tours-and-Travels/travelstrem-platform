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
