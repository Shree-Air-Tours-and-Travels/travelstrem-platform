import React from "react";
import { BookingCard } from "@packages/trem-ui";

const sampleBooking = {
  id: "booking-1",
  tour: { title: "Himalayan Escape to Manali" },
  user: { name: "Akshat Goyal" },
  status: "CONFIRMED",
  startDate: "2026-06-12",
  endDate: "2026-06-16",
  guestsCount: 3,
  travelers: [
    { _id: "t1", firstName: "Akshat", lastName: "Goyal", email: "akshat@example.com" },
    { _id: "t2", firstName: "Priya", lastName: "Sharma", email: "priya@example.com" },
  ],
  priceSnapshot: { perPerson: 24999, total: 74997, currency: "INR" },
  paymentSummary: { paid: 25000, remaining: 49997, refunded: 0 },
};

export default {
  title: "Trem UI/Data Display/BookingCard",
  component: BookingCard,
  tags: ["autodocs"],
  argTypes: {
    role: { control: "select", options: ["admin", "agent", "user"] },
  },
  args: {
    booking: sampleBooking,
    role: "admin",
  },
};

export const Playground = {};

export const Default = {
  name: "Confirmed Booking (Admin)",
  render: () => (
    <BookingCard
      booking={sampleBooking}
      role="admin"
      onCancel={() => {}}
      onStatusTransition={() => {}}
      onRecordPayment={() => {}}
      onRefund={() => {}}
      onGenerateQuote={() => {}}
      onUpdateTravelers={() => {}}
      onOpen={() => {}}
    />
  ),
};

export const PaidStatus = {
  name: "Paid Booking",
  render: () => (
    <BookingCard
      booking={{ ...sampleBooking, status: "PAID" }}
      role="admin"
      onCancel={() => {}}
      onStatusTransition={() => {}}
      onRecordPayment={() => {}}
      onRefund={() => {}}
      onGenerateQuote={() => {}}
      onUpdateTravelers={() => {}}
      onOpen={() => {}}
    />
  ),
};

export const DraftStatus = {
  name: "Draft Booking (Quote Pending)",
  render: () => (
    <BookingCard
      booking={{ ...sampleBooking, status: "DRAFT", priceSnapshot: { total: 0, currency: "INR" }, paymentSummary: { paid: 0, remaining: 0, refunded: 0 } }}
      role="admin"
      onCancel={() => {}}
      onStatusTransition={() => {}}
      onRecordPayment={() => {}}
      onRefund={() => {}}
      onGenerateQuote={() => {}}
      onUpdateTravelers={() => {}}
      onOpen={() => {}}
    />
  ),
};

export const Cancelled = {
  name: "Cancelled Booking",
  render: () => (
    <BookingCard
      booking={{ ...sampleBooking, status: "CANCELLED" }}
      role="admin"
      onCancel={() => {}}
      onStatusTransition={() => {}}
      onRecordPayment={() => {}}
      onRefund={() => {}}
      onGenerateQuote={() => {}}
      onUpdateTravelers={() => {}}
      onOpen={() => {}}
    />
  ),
};
