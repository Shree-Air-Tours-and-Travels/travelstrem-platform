import React from "react";
import TimelineStepper from "@packages/trem-ui/components/TimelineStepper/TimelineStepper.jsx";

const sampleSteps = [
  { key: "1", status: "completed", label: "Booking Created", time: "1 Jul, 10:00 AM" },
  { key: "2", status: "completed", label: "Quote Sent", time: "3 Jul, 2:30 PM" },
  { key: "3", status: "completed", label: "Quote Accepted", time: "4 Jul, 9:15 AM" },
  { key: "4", status: "active", label: "Payment Received", time: "5 Jul, 11:00 AM" },
  { key: "5", status: "upcoming", label: "Booking Confirmed" },
  { key: "6", status: "upcoming", label: "Travel Ready" },
];

export default {
  title: "Trem UI/Data Display/TimelineStepper",
  component: TimelineStepper,
  tags: ["autodocs"],
};

export const Default = {
  args: {
    steps: sampleSteps,
  },
};

export const CancelledJourney = {
  args: {
    steps: [
      { key: "1", status: "completed", label: "Booking Created", time: "10 Jun, 10:00 AM" },
      { key: "2", status: "completed", label: "Confirmed", time: "12 Jun, 2:00 PM" },
      { key: "3", status: "completed", label: "Cancelled", time: "20 Jun, 9:30 AM" },
    ],
  },
};
