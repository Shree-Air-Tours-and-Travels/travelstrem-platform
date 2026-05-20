import React from "react";
import { Footer } from "@packages/trem-ui";

export default {
  title: "Trem UI/Layout/Footer",
  component: Footer,
  tags: ["autodocs"],
  argTypes: {
    brand: { control: "text" },
    showPortfolio: { control: "boolean" },
  },
  args: {
    brand: "TravelsTREM",
    links: [
      { to: "/", label: "Home" },
      { to: "/tours", label: "Tours" },
      { to: "/about", label: "About" },
      { to: "/contact", label: "Contact" },
    ],
    showPortfolio: true,
  },
  parameters: {
    layout: "fullscreen",
  },
};

export const Playground = {};

export const Default = {
  name: "Default Footer",
  render: () => <Footer />,
  parameters: { layout: "fullscreen" },
};

export const WithUser = {
  name: "With Authenticated User",
  render: () => (
    <Footer
      user={{ name: "Akshat" }}
      brand="TravelsTREM"
      showPortfolio
    />
  ),
  parameters: { layout: "fullscreen" },
};

export const CustomBrand = {
  name: "Custom Brand",
  render: () => (
    <Footer
      brand="Wanderlust Adventures"
      links={[
        { to: "/", label: "Home" },
        { to: "/destinations", label: "Destinations" },
        { to: "/offers", label: "Offers" },
      ]}
      showPortfolio={false}
    />
  ),
  parameters: { layout: "fullscreen" },
};

export const MinimalLinks = {
  name: "Minimal Links",
  render: () => (
    <Footer
      brand="TravelsTREM"
      links={[
        { to: "/", label: "Home" },
        { to: "/contact", label: "Contact" },
      ]}
      showPortfolio={false}
    />
  ),
  parameters: { layout: "fullscreen" },
};
