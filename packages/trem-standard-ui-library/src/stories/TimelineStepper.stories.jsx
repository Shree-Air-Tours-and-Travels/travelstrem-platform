import React from "react";

import TimelineStepper from "@packages/trem-ui/components/TimelineStepper/TimelineStepper.jsx";

/* ========================================================================== */
/* Shared data                                                                */
/* ========================================================================== */

const sampleSteps = [
  {
    key: "1",
    status: "completed",
    label: "Booking Created",
    time: "1 Jul, 10:00 AM",
  },
  {
    key: "2",
    status: "completed",
    label: "Quote Sent",
    time: "3 Jul, 2:30 PM",
  },
  {
    key: "3",
    status: "completed",
    label: "Quote Accepted",
    time: "4 Jul, 9:15 AM",
  },
  {
    key: "4",
    status: "active",
    label: "Payment Received",
    time: "5 Jul, 11:00 AM",
  },
  {
    key: "5",
    status: "upcoming",
    label: "Booking Confirmed",
  },
  {
    key: "6",
    status: "upcoming",
    label: "Travel Ready",
  },
];

const detailedSteps = [
  {
    key: "booking-created",
    status: "completed",
    label: "Booking Created",
    description: "Your booking request has been successfully created.",
    time: "1 Jul, 10:00 AM",
  },
  {
    key: "quote-sent",
    status: "completed",
    label: "Quote Sent",
    description: "A customised Premium package quote was shared.",
    time: "3 Jul, 2:30 PM",
  },
  {
    key: "quote-accepted",
    status: "completed",
    label: "Quote Accepted",
    description: "The traveller accepted the selected quote.",
    time: "4 Jul, 9:15 AM",
  },
  {
    key: "payment",
    status: "current",
    label: "Initial Payment",
    description: "Payment received and booking confirmation is in progress.",
    badge: "Current",
    time: "5 Jul, 11:00 AM",
  },
  {
    key: "confirmation",
    status: "pending",
    label: "Booking Confirmed",
    description: "Hotel, transfer and service confirmations will appear here.",
  },
  {
    key: "documents",
    status: "pending",
    label: "Tickets & Vouchers",
    description: "Tickets, vouchers and supporting documents will be uploaded.",
  },
  {
    key: "travel-ready",
    status: "pending",
    label: "Travel Ready",
    description: "All required travel documents and services are ready.",
  },
];

const statusSteps = [
  {
    key: "completed",
    status: "completed",
    label: "Completed",
    description: "Successfully completed step.",
  },
  {
    key: "current",
    status: "current",
    label: "Current",
    description: "Currently active step.",
  },
  {
    key: "pending",
    status: "pending",
    label: "Pending",
    description: "Waiting to be processed.",
  },
  {
    key: "info",
    status: "info",
    label: "Information",
    description: "Additional information is available.",
  },
  {
    key: "warning",
    status: "warning",
    label: "Attention Required",
    description: "This step requires attention.",
  },
  {
    key: "error",
    status: "error",
    label: "Failed",
    description: "The step could not be completed.",
  },
  {
    key: "cancelled",
    status: "cancelled",
    label: "Cancelled",
    description: "This part of the journey was cancelled.",
  },
  {
    key: "skipped",
    status: "skipped",
    label: "Skipped",
    description: "This step was not required.",
  },
];

/* ========================================================================== */
/* Story config                                                               */
/* ========================================================================== */

export default {
  title: "Trem UI/Data Display/TimelineStepper",
  component: TimelineStepper,
  tags: ["autodocs"],

  parameters: {
    layout: "padded",
  },

  args: {
    steps: sampleSteps,
  },

  argTypes: {
    variant: {
      control: "select",
      options: ["default", "soft", "cards", "minimal"],
      description: "Visual style of the timeline.",
    },

    orientation: {
      control: "select",
      options: ["vertical", "horizontal"],
      description: "Timeline direction.",
    },

    size: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: "Overall timeline size.",
    },

    markerVariant: {
      control: "select",
      options: ["status", "number", "dot"],
      description: "Marker presentation.",
    },

    connectorVariant: {
      control: "select",
      options: ["solid", "dashed", "subtle"],
      description: "Connector line appearance.",
    },

    showStepNumbers: {
      control: "boolean",
    },

    showTime: {
      control: "boolean",
    },

    ariaLabel: {
      control: "text",
    },

    onStepClick: {
      action: "step-clicked",
    },
  },
};

/* ========================================================================== */
/* Default                                                                    */
/* ========================================================================== */

export const Default = {
  args: {
    steps: sampleSteps,
  },
};

/* ========================================================================== */
/* Visual variants                                                            */
/* ========================================================================== */

export const Soft = {
  args: {
    steps: sampleSteps,
    variant: "soft",
  },
};

export const Cards = {
  args: {
    steps: detailedSteps,
    variant: "cards",
  },
};

export const Minimal = {
  args: {
    steps: sampleSteps,
    variant: "minimal",
  },
};

/* ========================================================================== */
/* Orientation                                                                */
/* ========================================================================== */

export const Horizontal = {
  args: {
    steps: sampleSteps,
    orientation: "horizontal",
  },

  decorators: [
    (Story) => (
      <div style={{ width: "100%", maxWidth: "1100px" }}>
        <Story />
      </div>
    ),
  ],
};

export const HorizontalSoft = {
  args: {
    steps: sampleSteps,
    orientation: "horizontal",
    variant: "soft",
  },

  decorators: [
    (Story) => (
      <div style={{ width: "100%", maxWidth: "1100px" }}>
        <Story />
      </div>
    ),
  ],
};

export const HorizontalCards = {
  args: {
    steps: detailedSteps.slice(0, 5),
    orientation: "horizontal",
    variant: "cards",
  },

  decorators: [
    (Story) => (
      <div style={{ width: "100%", maxWidth: "1200px" }}>
        <Story />
      </div>
    ),
  ],
};

/* ========================================================================== */
/* Sizes                                                                      */
/* ========================================================================== */

export const Small = {
  args: {
    steps: sampleSteps,
    size: "sm",
  },
};

export const Medium = {
  args: {
    steps: sampleSteps,
    size: "md",
  },
};

export const Large = {
  args: {
    steps: detailedSteps,
    size: "lg",
  },
};

/* ========================================================================== */
/* Marker variants                                                            */
/* ========================================================================== */

export const StatusMarkers = {
  args: {
    steps: sampleSteps,
    markerVariant: "status",
  },
};

export const Numbered = {
  args: {
    steps: sampleSteps,
    markerVariant: "number",
  },
};

export const StepNumbers = {
  args: {
    steps: sampleSteps,
    showStepNumbers: true,
  },
};

export const DotMarkers = {
  args: {
    steps: sampleSteps,
    markerVariant: "dot",
  },
};

/* ========================================================================== */
/* Connector variants                                                         */
/* ========================================================================== */

export const SolidConnector = {
  args: {
    steps: sampleSteps,
    connectorVariant: "solid",
  },
};

export const DashedConnector = {
  args: {
    steps: sampleSteps,
    connectorVariant: "dashed",
  },
};

export const SubtleConnector = {
  args: {
    steps: sampleSteps,
    connectorVariant: "subtle",
  },
};

/* ========================================================================== */
/* Combination variants                                                       */
/* ========================================================================== */

export const SoftNumbered = {
  args: {
    steps: detailedSteps,
    variant: "soft",
    markerVariant: "number",
  },
};

export const MinimalDots = {
  args: {
    steps: sampleSteps,
    variant: "minimal",
    markerVariant: "dot",
    connectorVariant: "subtle",
    size: "sm",
  },
};

export const CardsNumbered = {
  args: {
    steps: detailedSteps,
    variant: "cards",
    markerVariant: "number",
  },
};

export const HorizontalNumbered = {
  args: {
    steps: sampleSteps,
    orientation: "horizontal",
    markerVariant: "number",
  },

  decorators: [
    (Story) => (
      <div style={{ width: "100%", maxWidth: "1100px" }}>
        <Story />
      </div>
    ),
  ],
};

export const HorizontalDashed = {
  args: {
    steps: sampleSteps,
    orientation: "horizontal",
    connectorVariant: "dashed",
    markerVariant: "dot",
  },

  decorators: [
    (Story) => (
      <div style={{ width: "100%", maxWidth: "1100px" }}>
        <Story />
      </div>
    ),
  ],
};

/* ========================================================================== */
/* All statuses                                                               */
/* ========================================================================== */

export const AllStatuses = {
  args: {
    steps: statusSteps,
    variant: "soft",
  },
};

/* ========================================================================== */
/* Detailed booking journey                                                   */
/* ========================================================================== */

export const BookingJourney = {
  args: {
    steps: detailedSteps,
    variant: "soft",
  },
};

export const BookingJourneyCards = {
  args: {
    steps: detailedSteps,
    variant: "cards",
  },
};

/* ========================================================================== */
/* Cancelled journey                                                          */
/* ========================================================================== */

export const CancelledJourney = {
  args: {
    steps: [
      {
        key: "1",
        status: "completed",
        label: "Booking Created",
        time: "10 Jun, 10:00 AM",
      },
      {
        key: "2",
        status: "completed",
        label: "Booking Confirmed",
        time: "12 Jun, 2:00 PM",
      },
      {
        key: "3",
        status: "cancelled",
        label: "Booking Cancelled",
        description: "Booking was cancelled by the traveller.",
        time: "20 Jun, 9:30 AM",
        badge: "Cancelled",
      },
    ],
    variant: "soft",
  },
};

/* ========================================================================== */
/* Failed journey                                                             */
/* ========================================================================== */

export const FailedJourney = {
  args: {
    steps: [
      {
        key: "1",
        status: "completed",
        label: "Quote Accepted",
        time: "4 Jul, 9:15 AM",
      },
      {
        key: "2",
        status: "error",
        label: "Payment Failed",
        description: "The payment attempt could not be completed.",
        time: "5 Jul, 11:00 AM",
        badge: "Failed",
      },
      {
        key: "3",
        status: "pending",
        label: "Booking Confirmation",
      },
    ],
    variant: "soft",
  },
};

/* ========================================================================== */
/* Warning journey                                                            */
/* ========================================================================== */

export const AttentionRequired = {
  args: {
    steps: [
      {
        key: "1",
        status: "completed",
        label: "Booking Created",
      },
      {
        key: "2",
        status: "warning",
        label: "Additional Information Required",
        description: "Passport details are required before confirmation.",
        badge: "Action required",
      },
      {
        key: "3",
        status: "pending",
        label: "Booking Confirmation",
      },
    ],
    variant: "soft",
  },
};

/* ========================================================================== */
/* Skipped step                                                               */
/* ========================================================================== */

export const WithSkippedStep = {
  args: {
    steps: [
      {
        key: "1",
        status: "completed",
        label: "Booking Created",
      },
      {
        key: "2",
        status: "skipped",
        label: "Visa Assistance",
        description: "Visa assistance was not required for this booking.",
      },
      {
        key: "3",
        status: "current",
        label: "Booking Confirmation",
        badge: "Current",
      },
      {
        key: "4",
        status: "pending",
        label: "Travel Ready",
      },
    ],
  },
};

/* ========================================================================== */
/* Without timestamps                                                         */
/* ========================================================================== */

export const WithoutTime = {
  args: {
    steps: sampleSteps,
    showTime: false,
  },
};

/* ========================================================================== */
/* With badges                                                                */
/* ========================================================================== */

export const WithBadges = {
  args: {
    steps: [
      {
        key: "1",
        status: "completed",
        label: "Quote Generated",
        badge: "Done",
        time: "10:00 AM",
      },
      {
        key: "2",
        status: "current",
        label: "Customer Review",
        badge: "Current",
        time: "Now",
      },
      {
        key: "3",
        status: "pending",
        label: "Payment",
        badge: "Upcoming",
      },
    ],
    variant: "soft",
  },
};

/* ========================================================================== */
/* Long content                                                               */
/* ========================================================================== */

export const LongContent = {
  args: {
    steps: [
      {
        key: "1",
        status: "completed",
        label: "Customised Holiday Package Quote Generated",
        description:
          "The travel agent prepared a customised package including hotel accommodation, airport transfers, sightseeing and requested activities.",
        time: "25 Aug, 10:30 AM",
      },
      {
        key: "2",
        status: "current",
        label: "Waiting for Traveller Payment Confirmation",
        description:
          "The quote has been accepted and the initial booking payment is currently pending.",
        badge: "Current",
      },
      {
        key: "3",
        status: "pending",
        label: "Travel Documents & Service Vouchers",
        description:
          "Flight tickets, hotel vouchers, activity passes and other documents will become available after confirmation.",
      },
    ],
    variant: "cards",
  },
};

/* ========================================================================== */
/* Disabled step                                                              */
/* ========================================================================== */

export const DisabledStep = {
  args: {
    steps: [
      {
        key: "1",
        status: "completed",
        label: "Booking Created",
      },
      {
        key: "2",
        status: "current",
        label: "Payment",
      },
      {
        key: "3",
        status: "pending",
        label: "Restricted Step",
        disabled: true,
      },
      {
        key: "4",
        status: "pending",
        label: "Travel Ready",
      },
    ],
  },
};

/* ========================================================================== */
/* Interactive                                                                */
/* ========================================================================== */

export const Interactive = {
  args: {
    steps: detailedSteps.map((step) => ({
      ...step,
      onClick: (selectedStep) => {
        console.log("Timeline step:", selectedStep);
      },
    })),

    variant: "soft",

    onStepClick: (step, index) => {
      console.log("Selected timeline step:", {
        step,
        index,
      });
    },
  },
};

/* ========================================================================== */
/* Compact booking status                                                     */
/* ========================================================================== */

export const Compact = {
  args: {
    steps: sampleSteps,
    variant: "minimal",
    markerVariant: "dot",
    connectorVariant: "subtle",
    size: "sm",
  },

  decorators: [
    (Story) => (
      <div style={{ maxWidth: "280px" }}>
        <Story />
      </div>
    ),
  ],
};

/* ========================================================================== */
/* Variant showcase                                                           */
/* ========================================================================== */

export const VariantShowcase = {
  render: () => (
    <div
      style={{
        display: "grid",
        gap: "32px",
        maxWidth: "700px",
      }}
    >
      <section>
        <h3>Default</h3>

        <TimelineStepper steps={sampleSteps} />
      </section>

      <section>
        <h3>Soft</h3>

        <TimelineStepper steps={sampleSteps} variant="soft" />
      </section>

      <section>
        <h3>Cards</h3>

        <TimelineStepper steps={sampleSteps} variant="cards" />
      </section>

      <section>
        <h3>Minimal</h3>

        <TimelineStepper steps={sampleSteps} variant="minimal" />
      </section>
    </div>
  ),
};

/* ========================================================================== */
/* Marker showcase                                                            */
/* ========================================================================== */

export const MarkerShowcase = {
  render: () => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: "32px",
      }}
    >
      <section>
        <h3>Status</h3>

        <TimelineStepper steps={sampleSteps} markerVariant="status" />
      </section>

      <section>
        <h3>Number</h3>

        <TimelineStepper steps={sampleSteps} markerVariant="number" />
      </section>

      <section>
        <h3>Dot</h3>

        <TimelineStepper steps={sampleSteps} markerVariant="dot" />
      </section>
    </div>
  ),
};

/* ========================================================================== */
/* Size showcase                                                              */
/* ========================================================================== */

export const SizeShowcase = {
  render: () => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: "32px",
      }}
    >
      <section>
        <h3>Small</h3>

        <TimelineStepper steps={sampleSteps} size="sm" />
      </section>

      <section>
        <h3>Medium</h3>

        <TimelineStepper steps={sampleSteps} size="md" />
      </section>

      <section>
        <h3>Large</h3>

        <TimelineStepper steps={sampleSteps} size="lg" />
      </section>
    </div>
  ),
};

/* ========================================================================== */
/* Connector showcase                                                         */
/* ========================================================================== */

export const ConnectorShowcase = {
  render: () => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: "32px",
      }}
    >
      <section>
        <h3>Solid</h3>

        <TimelineStepper steps={sampleSteps} connectorVariant="solid" />
      </section>

      <section>
        <h3>Dashed</h3>

        <TimelineStepper steps={sampleSteps} connectorVariant="dashed" />
      </section>

      <section>
        <h3>Subtle</h3>

        <TimelineStepper steps={sampleSteps} connectorVariant="subtle" />
      </section>
    </div>
  ),
};
