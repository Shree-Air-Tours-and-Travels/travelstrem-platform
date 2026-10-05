import React from "react";
import { AppFooter, FloatingActionBar } from "@packages/trem-ui";

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
    variant: "inline",
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
      {
        label: "Back",
        variant: "text",
        color: "primary",
        iconLeft: "chevronLeft",
        onClick: () => {},
      },
      {
        label: "Next",
        variant: "solid",
        color: "primary",
        iconRight: "chevronRight",
        onClick: () => {},
      },
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

export const MobileNavigation = {
  args: {
    variant: "mobile-navigation",
    sheetTitle: "Primary mobile navigation",
    actions: [
      { id: "home", label: "Home", iconLeft: "home", active: true },
      { id: "bookings", label: "Bookings", iconLeft: "calendar" },
      { id: "new-booking", label: "New booking", iconLeft: "plus", emphasis: true },
      { id: "wishlist", label: "Wishlist", iconLeft: "heart" },
      { id: "profile", label: "Profile", iconLeft: "user" },
    ],
  },
  parameters: { viewport: { defaultViewport: "mobile1" } },
};

export const WithFooterActions = {
  render: () => (
    <div style={{ height: "80vh", overflowY: "auto" }}>
      {Array.from({ length: 12 }, (_, index) => <p key={index}>Booking content {index + 1}</p>)}
      <p>End of booking content</p>
      <FloatingActionBar actions={sharedActions} />
      <AppFooter config={{ variant: "withActions", actions: [
        { id: "overview", label: "Overview", iconLeft: "home" },
        { id: "bookings", label: "Bookings", iconLeft: "calendar" },
        { id: "support", label: "Support", iconLeft: "support" },
        { id: "profile", label: "Profile", iconLeft: "user" },
      ] }} />
    </div>
  ),
  parameters: { viewport: { defaultViewport: "mobile1" } },
};
