import React from "react";
import { BookingJourneyCard } from "@packages/trem-ui";

const sampleBooking = {
  id: "bk-6f3a",
  _id: "bk-6f3a",
  bookingRef: "BK-2026-0042",
  status: "CONFIRMED",
  startDate: "2026-08-15",
  endDate: "2026-08-19",
  guestsCount: 3,
  assignedAgent: { name: "Priya Sharma", email: "priya@travelsTrem.com" },
  tour: {
    title: "Himalayan Escape to Manali",
    desc: "A 5-day adventure through the snow-capped peaks, lush valleys, and serene monasteries of Himachal Pradesh.",
    photo: "https://res.cloudinary.com/dofxshf3z/image/upload/v1779131576/tour-img01_tljj0m.jpg",
    city: { from: "Delhi", to: "Manali" },
  },
  priceSnapshot: { currency: "INR", perPerson: 24999, total: 74997, isFinal: true },
  paymentSummary: { total: 74997, paid: 25000, remaining: 49997, refunded: 0 },
  timeline: [
    { id: "t1", action: "Booking Created", to: "DRAFT", createdAt: "2026-07-01T10:00:00Z" },
    { id: "t2", action: "Quote Sent", to: "QUOTE_SENT", createdAt: "2026-07-03T14:30:00Z" },
    { id: "t3", action: "Quote Accepted", to: "CUSTOMER_ACCEPTED", createdAt: "2026-07-04T09:15:00Z" },
    { id: "t4", action: "Payment Received", to: "PAID", createdAt: "2026-07-05T11:00:00Z" },
    { id: "t5", action: "Booking Confirmed", to: "CONFIRMED", createdAt: "2026-07-05T12:00:00Z" },
  ],
};

export default {
  title: "Trem UI/Data Display/BookingJourneyCard",
  component: BookingJourneyCard,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
  },
};

export const Default = {
  name: "Confirmed Booking",
  args: {
    booking: sampleBooking,
    onViewTour: (b) => console.log("view tour", b),
    onDownloadQuote: (b) => console.log("download quote", b),
    onDownloadInvoice: (b) => console.log("download invoice", b),
  },
};

export const DraftBooking = {
  name: "Draft (No Payment)",
  args: {
    booking: {
      ...sampleBooking,
      status: "DRAFT",
      bookingRef: "BK-2026-0055",
      priceSnapshot: { currency: "INR", perPerson: 18500, total: 55500, isFinal: false },
      paymentSummary: { total: 55500, paid: 0, remaining: 55500, refunded: 0 },
      assignedAgent: null,
      timeline: [
        { id: "t1", action: "Booking Created", to: "DRAFT", createdAt: "2026-07-20T08:00:00Z" },
      ],
    },
    onViewTour: (b) => console.log("view tour", b),
  },
};

export const CompletedBooking = {
  name: "Completed",
  args: {
    booking: {
      ...sampleBooking,
      status: "COMPLETED",
      bookingRef: "BK-2026-0010",
      priceSnapshot: { currency: "INR", perPerson: 32000, total: 96000, isFinal: true },
      paymentSummary: { total: 96000, paid: 96000, remaining: 0, refunded: 0 },
      timeline: [
        { id: "t1", action: "Booking Created", to: "DRAFT", createdAt: "2026-05-01T10:00:00Z" },
        { id: "t2", action: "Confirmed", to: "CONFIRMED", createdAt: "2026-05-03T14:30:00Z" },
        { id: "t3", action: "Ticketed", to: "TICKETED", createdAt: "2026-05-10T09:00:00Z" },
        { id: "t4", action: "Travel Ready", to: "TRAVEL_READY", createdAt: "2026-05-15T08:00:00Z" },
        { id: "t5", action: "Completed", to: "COMPLETED", createdAt: "2026-05-20T18:00:00Z" },
      ],
    },
    onViewTour: (b) => console.log("view tour", b),
    onDownloadInvoice: (b) => console.log("download invoice", b),
    onDownloadBookingPass: (b) => console.log("download pass", b),
  },
};

export const CancelledBooking = {
  name: "Cancelled",
  args: {
    booking: {
      ...sampleBooking,
      status: "CANCELLED",
      bookingRef: "BK-2026-0033",
      priceSnapshot: { currency: "INR", perPerson: 21000, total: 42000, isFinal: true },
      paymentSummary: { total: 42000, paid: 42000, remaining: 0, refunded: 21000 },
      timeline: [
        { id: "t1", action: "Booking Created", to: "DRAFT", createdAt: "2026-06-10T10:00:00Z" },
        { id: "t2", action: "Confirmed", to: "CONFIRMED", createdAt: "2026-06-12T14:00:00Z" },
        { id: "t3", action: "Cancelled", to: "CANCELLED", createdAt: "2026-06-20T09:30:00Z" },
      ],
    },
  },
};

export const MinimalBooking = {
  name: "Minimal Data",
  args: {
    booking: {
      id: "bk-min",
      status: "QUOTE_REQUESTED",
      guestsCount: 2,
      tour: { title: "Goa Beach Retreat" },
      priceSnapshot: { currency: "INR", perPerson: 15000, total: 30000 },
      paymentSummary: { total: 30000, paid: 0, remaining: 30000 },
    },
  },
};
