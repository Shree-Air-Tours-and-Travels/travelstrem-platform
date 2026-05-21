import React from "react";
import { ServiceCard } from "@packages/trem-ui";

const sampleServices = [
  {
    id: "flights-hotels",
    label: "Flights & Hotels",
    description: "Book flights and hotels together for the best deals on your next trip.",
    shortDescription: "Save big on combined flight and hotel bookings.",
    highlights: ["Best rates", "24/7 support", "Instant confirmation"],
  },
  {
    id: "travel-packages",
    label: "Travel Packages",
    description: "Curated travel packages with everything included for a hassle-free vacation.",
    shortDescription: "All-in-one travel packages curated by experts.",
    highlights: ["Customizable", "Guided tours", "Meals included"],
  },
  {
    id: "visa-passport",
    label: "Visa & Passport",
    description: "Hassle-free visa and passport assistance for international travel.",
    shortDescription: "Fast and reliable visa processing services.",
    highlights: ["Express service", "Document check", "Worldwide"],
  },
];

export default {
  title: "Trem UI/Data Display/ServiceCard",
  component: ServiceCard,
  tags: ["autodocs"],
  argTypes: {
    service: { control: "object" },
  },
  args: {
    service: sampleServices[0],
  },
};

export const Playground = {};

export const Default = {
  name: "Flights & Hotels",
  render: () => (
    <div style={{ maxWidth: 380 }}>
      <ServiceCard service={sampleServices[0]} onClick={() => {}} />
    </div>
  ),
};

export const TravelPackages = {
  name: "Travel Packages",
  render: () => (
    <div style={{ maxWidth: 380 }}>
      <ServiceCard service={sampleServices[1]} onClick={() => {}} />
    </div>
  ),
};

export const VisaPassport = {
  name: "Visa & Passport",
  render: () => (
    <div style={{ maxWidth: 380 }}>
      <ServiceCard service={sampleServices[2]} onClick={() => {}} />
    </div>
  ),
};

export const Gallery = {
  name: "Service Gallery",
  render: () => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 24, width: "100%" }}>
      {sampleServices.map((s) => (
        <ServiceCard key={s.id} service={s} onClick={() => {}} />
      ))}
    </div>
  ),
};
