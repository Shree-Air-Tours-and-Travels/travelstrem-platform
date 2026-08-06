import React, { useState } from "react";
import { BottomSheet, Button } from "@packages/trem-ui";

export default {
  title: "Trem UI/Utilities/BottomSheet",
  component: BottomSheet,
  tags: ["autodocs"],
};

export const Default = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button text="Open bottom sheet" onClick={() => setOpen(true)} />
        <BottomSheet open={open} onClose={() => setOpen(false)} title="Options">
          <div style={{ padding: "1rem 0" }}>
            <p>Bottom sheet content goes here.</p>
          </div>
        </BottomSheet>
      </>
    );
  },
};

export const Fullscreen = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button text="Open fullscreen sheet" onClick={() => setOpen(true)} />
        <BottomSheet open={open} onClose={() => setOpen(false)} title="Fullscreen" variant="fullscreen">
          <div style={{ padding: "1rem 0" }}>
            <p>Fullscreen bottom sheet content.</p>
          </div>
        </BottomSheet>
      </>
    );
  },
};
