import React from "react";
import { ErrorState } from "@packages/trem-ui";

export default {
  title: "Trem UI/Feedback/ErrorState",
  component: ErrorState,
  tags: ["autodocs"],
};

export const Default = {
  args: {
    title: "Something went wrong",
    description: "We couldn't load your bookings. Please try again.",
  },
};

export const WithRetry = {
  args: {
    title: "Network error",
    description: "Failed to connect to the server.",
    error: "TypeError: Failed to fetch",
    retry: () => {},
    retryText: "Try again",
  },
};

export const WithErrorDetails = {
  args: {
    title: "Unable to load data",
    description: "An unexpected error occurred while fetching your information.",
    error: "Error: Request failed with status code 500",
  },
};
