import React, { useState } from "react";
import { BottomSheet, Button } from "@packages/trem-ui";

export default {
  title: "Trem UI/Overlay/BottomSheet",
  component: BottomSheet,
  tags: ["autodocs"],
  argTypes: {
    open: { control: "boolean" },
    title: { control: "text" },
  },
  args: {
    open: true,
    title: "Trip Details",
  },
};

export const Playground = {
  render: (args) => {
    const [open, setOpen] = useState(args.open);
    return (
      <div>
        <Button variant="solid" color="primary" text="Open Bottom Sheet" onClick={() => setOpen(true)} />
        <BottomSheet open={open} onClose={() => setOpen(false)} title={args.title}>
          <div style={{ padding: "0 16px 24px" }}>
            <p style={{ margin: "0 0 12px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
              This is the bottom sheet body. You can place any content here — forms, details, lists, or actions.
            </p>
            <Button variant="solid" color="primary" text="Confirm" onClick={() => setOpen(false)} />
          </div>
        </BottomSheet>
      </div>
    );
  },
};

export const WithContent = {
  name: "With Content",
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <div>
        <Button variant="solid" color="primary" text="View Trip Details" onClick={() => setOpen(true)} />
        <BottomSheet open={open} onClose={() => setOpen(false)} title="Himalayan Escape">
          <div style={{ padding: "0 16px 24px" }}>
            <p style={{ margin: "0 0 8px", color: "var(--text-secondary)" }}>
              <strong>Duration:</strong> 5 Days / 4 Nights
            </p>
            <p style={{ margin: "0 0 8px", color: "var(--text-secondary)" }}>
              <strong>Location:</strong> Manali, India
            </p>
            <p style={{ margin: "0 0 8px", color: "var(--text-secondary)" }}>
              <strong>Price:</strong> ₹24,999 per person
            </p>
            <p style={{ margin: "0 0 16px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
              A calm mountain itinerary with scenic drives, local food, pine trails, and flexible leisure time.
            </p>
            <Button variant="solid" color="primary" text="Book Now" onClick={() => setOpen(false)} />
          </div>
        </BottomSheet>
      </div>
    );
  },
};

export const WithoutTitle = {
  name: "Without Title",
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <div>
        <Button variant="solid" color="primary" text="Open" onClick={() => setOpen(true)} />
        <BottomSheet open={open} onClose={() => setOpen(false)}>
          <div style={{ padding: "0 16px 24px" }}>
            <p style={{ margin: 0, color: "var(--text-secondary)" }}>
              A bottom sheet without a title prop.
            </p>
          </div>
        </BottomSheet>
      </div>
    );
  },
};

export const WithLongContent = {
  name: "With Scrollable Content",
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <div>
        <Button variant="solid" color="primary" text="Terms & Conditions" onClick={() => setOpen(true)} />
        <BottomSheet open={open} onClose={() => setOpen(false)} title="Terms & Conditions">
          <div style={{ padding: "0 16px 24px", color: "var(--text-secondary)", lineHeight: 1.7 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <p key={i} style={{ marginBottom: 12 }}>
                {i + 1}. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
              </p>
            ))}
          </div>
        </BottomSheet>
      </div>
    );
  },
};
