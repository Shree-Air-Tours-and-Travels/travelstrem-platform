import React from "react";
import { HighlightSpan, SubTitle, Title } from "@packages/trem-ui";

export default {
  title: "Trem UI/Foundation/Typography",
  tags: ["autodocs"],
};

export const Headings = {
  render: () => (
    <div className="trem-storybook-column">
      <Title text="Travel components for every flow" size="large" />
      <SubTitle text="Reusable system pieces for portals, tours, booking, and customer journeys." />
      <p>
        Compose pages with <HighlightSpan>shared Trem UI</HighlightSpan> pieces and keep visual language consistent across apps.
      </p>
    </div>
  ),
};
