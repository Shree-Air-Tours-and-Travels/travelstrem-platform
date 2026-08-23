import React from "react";
import {
  SupportCategoryCard,
  SupportContactMethod,
  SupportSkeleton,
  SupportTicketCard,
} from "@packages/trem-ui";

export default { title: "Trem UI/Support/Support components", tags: ["autodocs"] };

export const Category = () => (
  <SupportCategoryCard
    item={{
      id: "category",
      label: "Support category",
      description: "A backend-provided description.",
      icon: "support",
    }}
  />
);
export const Contact = () => (
  <SupportContactMethod
    option={{
      id: "contact",
      label: "Contact support",
      description: "Available contact method",
      icon: "messageCircle",
      availability: "AVAILABLE",
    }}
  />
);
export const Ticket = () => (
  <SupportTicketCard
    ticket={{
      reference: "SUP-REFERENCE",
      subject: "Support request subject",
      status: { label: "Awaiting support", tone: "warning" },
      updatedLabel: "Recently updated",
      unreadByCustomer: true,
    }}
  />
);
export const Loading = () => <SupportSkeleton rows={3} />;
