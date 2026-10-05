import "server-only";
import branding from "./branding.json";
import { cache } from "react";
import { unstable_cache } from "next/cache";

type LinkItem = { id: string; label: string; href: string };
export type ShreeAir = {
  _id: string;
  name: string;
  contactEmail: string;
  contactPhone: string;
  business?: { address?: string };
  domains: { api: string; website: string };
  globalBrand: { label?: string; logoSrc?: string; logoDarkSrc?: string; faviconSrc?: string };
  theme: {
    mode: "light" | "dark";
    primaryColor?: string;
    darkPrimaryColor?: string;
    light?: Record<string, string>;
    dark?: Record<string, string>;
  };
  modules: Record<string, string[]>;
  heroImages?: { appShell?: string };
  homePage?: {
    hero?: { image?: string; eyebrow?: string; title?: string; description?: string };
    footer?: { description?: string; socialLinks?: LinkItem[] };
  };
};

const readShreeAirConfiguration = unstable_cache(async (api: string, clientId: string): Promise<ShreeAir> => {
  const configuration = await fetch(`${api.replace(/\/$/, "")}/api/tenant-config`, {
    cache: "no-store", signal: AbortSignal.timeout(8000),
  });
  if (!configuration.ok || (await configuration.json()).data?.tenantId !== clientId)
    throw new Error("The website API must belong to Shree Air.");
  const response = await fetch(`${api.replace(/\/$/, "")}/api/clients/by-slug/shree-air`, {
    cache: "no-store", signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error("Shree Air’s website configuration is unavailable.");
  const client = (await response.json()).componentData?.data?.client;
  if (!client || client.slug !== "shree-air" || String(client._id) !== clientId)
    throw new Error("Shree Air’s website configuration is unavailable.");
  return client;
}, ["shree-air-public-configuration"], { revalidate: 300 });

export const getShreeAir = cache(async (): Promise<ShreeAir> => {
  const api = process.env.SHREE_AIR_API_URL;
  const clientId = process.env.SHREE_AIR_CLIENT_ID;
  if (!api || !clientId) throw new Error("Configure the Shree Air tenant API and client ID for this website.");
  let client: ShreeAir;
  try {
    client = await readShreeAirConfiguration(api, clientId);
  } catch (error) {
    if (branding._id !== clientId) throw error;
    client = branding as ShreeAir;
  }
  return {
    ...client,
    contactPhone: process.env.SHREE_AIR_CONTACT_PHONE?.trim() || client.contactPhone,
    contactEmail: process.env.SHREE_AIR_CONTACT_EMAIL?.trim() || client.contactEmail,
  };
});

export const articles = [
  {
    slug: "travel-planning-with-shree-air",
    category: "Meet Shree Air",
    title: "One travel team. Every part of your journey.",
    summary: "Get to know Shree Air and how we bring your travel plans together.",
    paragraphs: [
      "Shree Air Tours & Travels helps travellers bring their journey together, from choosing a destination to discussing the flights, stays and experiences that suit their plans.",
      "Whether you are planning time away on your own, a family holiday or a group journey, start with a conversation. Share your dates, destination, number of travellers and budget so our team can discuss the available options.",
      "Our approach is personal: understand what matters to you, explore the choices and explain the details before you confirm. Availability, prices and cancellation terms depend on the selected service and supplier.",
    ],
  },
  {
    slug: "flights-and-hotel-stays",
    category: "Flights & stays",
    title: "Flights and stays, planned around you.",
    summary:
      "How our team helps you connect your travel dates with the right flight and hotel options.",
    paragraphs: [
      "A journey starts with getting there and having somewhere comfortable to stay. Shree Air helps you explore flight and hotel options around your destination, travel dates and preferences.",
      "Tell us your departure city, destination, dates and number of travellers. For a stay, share the area you prefer, room requirements and anything that would make your visit more comfortable.",
      "Our team can discuss the available options and the terms attached to them. Confirm baggage, room inclusions, change rules and cancellation conditions with your quote before booking.",
    ],
  },
  {
    slug: "holidays-tours-and-group-trips",
    category: "Holidays & groups",
    title: "Your holiday, with room for what matters.",
    summary: "Explore tours, trips and personal travel planning for families and groups.",
    paragraphs: [
      "Some travellers want a full itinerary. Others want a quieter escape or time to explore together. Shree Air helps you discuss tours and trips that fit the kind of journey you have in mind.",
      "Share your interests, preferred dates and group size. Let us know which experiences matter most, how you would like to travel and your accommodation preferences.",
      "We bring the details into a travel conversation, helping you consider flights, stays and activities together. Get in touch to discuss a personalised plan and the options currently available.",
    ],
  },
] as const;
