import React from "react";
import MessageBubble from "@packages/trem-ui/components/MessageBubble/MessageBubble.jsx";

export default {
  title: "Trem UI/Data Display/MessageBubble",
  component: MessageBubble,
  tags: ["autodocs"],
};

export const OwnMessage = {
  args: {
    content: "Hi, I'd like to confirm my booking for the Himalayan Escape tour.",
    senderName: "Akshat Goyal",
    isOwn: true,
    timestamp: new Date().toISOString(),
  },
};

export const OtherMessage = {
  args: {
    content: "Sure! Your booking is confirmed. We'll send the itinerary shortly.",
    senderName: "Priya Sharma",
    senderType: "customer",
    isOwn: false,
    timestamp: new Date().toISOString(),
  },
};

export const SystemMessage = {
  args: {
    content: "Booking has been updated to CONFIRMED",
    messageType: "system",
    timestamp: new Date().toISOString(),
  },
};

export const QuoteUpdate = {
  args: {
    content: "New quote has been generated",
    messageType: "quote_update",
    metadata: { finalAmount: 94000 },
    timestamp: new Date().toISOString(),
  },
};
