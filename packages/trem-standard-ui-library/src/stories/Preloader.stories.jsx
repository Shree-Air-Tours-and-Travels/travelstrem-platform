import React from "react";
import { Preloader } from "@packages/trem-ui";

export default {
  title: "Trem UI/Feedback/Preloader",
  component: Preloader,
  tags: ["autodocs"],
};

export const Cards = {
  args: {
    variant: "cards",
    count: 3,
  },
};

export const Stack = {
  args: {
    variant: "stack",
    count: 4,
  },
};

export const Stats = {
  args: {
    variant: "stats",
    count: 4,
  },
};
