import React from "react";
import { SupportBookingCard, SupportCategoryCard, SupportContactMethod, SupportSkeleton, SupportTicketCard } from "@packages/trem-ui";

export default { title: "Trem UI/Support/Support components", tags: ["autodocs"] };

export const Booking = () => <SupportBookingCard booking={{ title: "Example booking", service: { name: "Travel product", icon: "mountain", tone: "primary" }, dateLabel: "12 Sep – 16 Sep", status: { label: "Confirmed" }, supportActions: [{ id: "help", label: "Get help", icon: "support", enabled: true }] }} />;
export const Category = () => <SupportCategoryCard item={{ id: "category", label: "Support category", description: "A backend-provided description.", icon: "support" }} />;
export const Contact = () => <SupportContactMethod option={{ id: "contact", label: "Contact support", description: "Available contact method", icon: "messageCircle", availability: "AVAILABLE" }} />;
export const Ticket = () => <SupportTicketCard ticket={{ reference: "SUP-REFERENCE", subject: "Support request subject", status: { label: "Awaiting support", tone: "warning" }, updatedLabel: "Recently updated", unreadByCustomer: true }} />;
export const Loading = () => <SupportSkeleton rows={3} />;
