import React from "react";
import { FloatingActionBar } from "@packages/trem-ui";

const sharedActions = [
  { label: "Save", variant: "solid", color: "primary", onClick: () => {} },
  { label: "Cancel", variant: "outline", color: "primary", onClick: () => {} },
];

export default {
  title: "Trem UI/Forms/FloatingActionBar",
  component: FloatingActionBar,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
};

export const Floating = {
  args: {
    variant: "floating",
    actions: [
      { label: "Book Now", variant: "solid", color: "primary", onClick: () => {} },
      { label: "Enquire", variant: "outline", color: "primary", onClick: () => {} },
    ],
  },
};

export const Inline = {
  args: {
    variant: "minimal",
    actions: sharedActions,
  },
};

export const Compact = {
  args: {
    variant: "compact",
    actions: sharedActions,
  },
};

export const AlignLeft = {
  args: {
    variant: "minimal",
    align: "left",
    actions: sharedActions,
  },
};

export const AlignRight = {
  args: {
    variant: "minimal",
    align: "right",
    actions: [{ label: "Next", variant: "solid", color: "primary", onClick: () => {} }],
  },
};

export const AlignCenter = {
  args: {
    variant: "minimal",
    align: "center",
    actions: sharedActions,
  },
};

export const AlignStretch = {
  args: {
    variant: "minimal",
    align: "stretch",
    actions: [
      { label: "Save", variant: "solid", color: "primary", onClick: () => {} },
      { label: "Cancel", variant: "outline", color: "primary", onClick: () => {} },
    ],
  },
};

export const LeftRight = {
  args: {
    variant: "minimal",
    align: "left-right",
    actions: [
      { label: "Back", variant: "text", color: "primary", iconLeft: "chevronLeft", onClick: () => {} },
      { label: "Next", variant: "solid", color: "primary", iconRight: "chevronRight", onClick: () => {} },
    ],
  },
};

export const ManyActions = {
  args: {
    variant: "floating",
    actions: [
      { label: "Book Now", variant: "solid", color: "primary", onClick: () => {} },
      { label: "Contact", variant: "outline", color: "primary", onClick: () => {} },
      { label: "Share", variant: "text", color: "primary", onClick: () => {} },
      { label: "Wishlist", variant: "text", color: "primary", onClick: () => {} },
    ],
    mobileVisible: 2,
  },
};

export const WithError = {
  args: {
    variant: "floating",
    actions: sharedActions,
    error: "Please fix the errors above before continuing.",
  },
};

export const WithNote = {
  args: {
    variant: "floating",
    actions: sharedActions,
    floatingNote: { note: "freeCancellation" },
    text: { freeCancellation: "Free cancellation up to 48 hours before the trip." },
  },
};

export const NoBackground = {
  args: {
    variant: "minimal",
    showBg: false,
    actions: sharedActions,
  },
};
