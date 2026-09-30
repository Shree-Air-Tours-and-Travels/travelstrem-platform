import React from "react";
import { EmptyState, Button } from "@packages/trem-ui";

export default {
  title: "Trem UI/Data Display/EmptyState",
  component: EmptyState,
  tags: ["autodocs"],
};

export const Default = {
  args: {
    icon: "search",
    title: "No results found",
    description: "Try adjusting your search or filter criteria.",
  },
};

export const WithAction = {
  args: {
    icon: "heart",
    title: "No favorites yet",
    description: "Save your favorite trips to access them quickly.",
    action: <Button text="Explore tours" variant="solid" color="primary" onClick={() => {}} />,
  },
};
