import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { setFetchDataApiClient } from "@packages/trem-utils";
import ContactAgentModal from "../../../trem-modals/src/ContactAgentModal.jsx";

const formResponse = {
  status: "success",
  component: {
    data: {},
    elements: {
      labels: {
        title: "Tour enquiry",
        description: "Tell us what you are looking for.",
        fullName: "Full name",
        contactMethod: "How should we contact you?",
        message: "What kind of tour are you looking for?",
        whatsapp: "WhatsApp",
        submit: "Send tour enquiry",
        quoteJourneyAriaLabel: "Enquiry progress",
        quoteDetailsStep: "Trip details",
        quotePricingStep: "Price options",
        quoteReviewStep: "Review request",
        quoteDetailsTitle: "Tell us about your trip",
        quoteDetailsDescription: "Complete your details.",
        quotePricingTitle: "Review your price",
        quotePricingDescription: "Compare your options.",
        quoteReviewTitle: "Review and send",
        quoteReviewDescription: "Check your saved details.",
        cancel: "Cancel",
        continueToPricing: "Continue",
        continueToReview: "Continue to review",
        continueWithoutSuggestion: "Continue without suggestion",
        backToDetails: "Back to details",
        backToPricing: "Back to price",
        sendingRequest: "Sending…",
        formValidationError: "Fix the highlighted fields.",
      },
      urls: {},
    },
    structure: {
      header: { titleRef: "title", descriptionRef: "description" },
      widgets: [
        {
          type: "ContactAgentForm",
          props: {
            submitLabelRef: "submit",
            fields: [
              { name: "name", type: "text", labelRef: "fullName", required: true },
              {
                name: "preferredContact",
                type: "select",
                labelRef: "contactMethod",
                options: [{ value: "whatsapp", labelRef: "whatsapp" }],
              },
              { name: "message", type: "textarea", labelRef: "message" },
            ],
          },
        },
      ],
    },
  },
};

describe("ContactAgentModal", () => {
  it("loads and renders the backend-provided enquiry form", async () => {
    const get = vi.fn().mockResolvedValue({ data: formResponse });
    setFetchDataApiClient({ get });

    render(
      <ContactAgentModal
        open
        onClose={vi.fn()}
        product="trevio"
        user={{ name: "Saved traveller" }}
      />,
    );

    expect(await screen.findByRole("heading", { name: "Tour enquiry" })).toBeInTheDocument();
    expect(screen.getByText("Full name")).toBeInTheDocument();
    expect(screen.getByText("How should we contact you?")).toBeInTheDocument();
    expect(screen.getByText("What kind of tour are you looking for?")).toBeInTheDocument();
    const form = document.querySelector(".ct-modal-card__form-panel form");
    expect(screen.queryByRole("button", { name: "Send tour enquiry" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    const submitButton = screen.getByRole("button", { name: "Send tour enquiry" });
    expect(form).toBeInTheDocument();
    expect(submitButton).toHaveAttribute("form", form.id);
    expect(submitButton.closest(".ct-modal-card__footer")).toBeInTheDocument();
    expect(get).toHaveBeenCalledWith(
      "/form.json?form=contact-agent&product=trevio",
      expect.any(Object),
    );
  });

  it("keeps traveller details when an intelligent package alternative is selected", async () => {
    const pricedFormResponse = {
      ...formResponse,
      component: {
        ...formResponse.component,
        data: { tour: { _id: "tour-1", title: "Rajasthan tour" } },
        elements: {
          ...formResponse.component.elements,
          labels: {
            ...formResponse.component.elements.labels,
            travellers: "Travellers",
            package: "Package",
            flights: "Flights",
            start: "Start date",
            end: "End date",
            premium: "Premium",
            noFlights: "Without flights",
            choosePackage: "Choose {package}",
          },
        },
        structure: {
          ...formResponse.component.structure,
          widgets: [
            {
              type: "ContactAgentForm",
              props: {
                submitLabelRef: "submit",
                fields: [
                  { name: "name", type: "text", labelRef: "fullName", required: true },
                  { name: "email", type: "email", labelRef: "email", required: true },
                  {
                    name: "travellerCount",
                    type: "number",
                    labelRef: "travellers",
                    required: true,
                    min: 1,
                    max: 50,
                    integer: true,
                  },
                  {
                    name: "packageKey",
                    type: "select",
                    labelRef: "package",
                    required: true,
                    value: "premium",
                    options: [{ value: "premium", labelRef: "premium" }],
                  },
                  {
                    name: "flightPreference",
                    type: "select",
                    labelRef: "flights",
                    required: true,
                    value: "without_flights",
                    options: [{ value: "without_flights", labelRef: "noFlights" }],
                  },
                  { name: "preferredStartDate", type: "date", labelRef: "start", required: true },
                  { name: "preferredEndDate", type: "date", labelRef: "end", required: true },
                ],
              },
            },
          ],
        },
      },
    };
    const previewResponse = {
      status: "success",
      component: {
        data: {
          preview: {
            currency: "INR",
            travellers: 2,
            rooms: 1,
            quoteMode: "PACKAGE",
            package: { packageName: "Premium", perPersonMinor: 4000000, totalMinor: 8000000 },
            customized: {
              packageName: "Premium",
              perPersonMinor: 4000000,
              totalMinor: 8000000,
            },
            recommendedAlternative: {
              packageKey: "standard",
              packageName: "Standard",
              perPersonMinor: 3000000,
              totalMinor: 6000000,
              absoluteDifferenceMinor: 2000000,
              differencePerPersonMinor: 1000000,
              savingsMinor: 2000000,
            },
          },
        },
      },
    };
    const get = vi.fn().mockResolvedValue({ data: pricedFormResponse });
    const post = vi.fn().mockResolvedValue({ data: previewResponse });
    setFetchDataApiClient({ get, post });

    render(
      <ContactAgentModal
        open
        onClose={vi.fn()}
        product="trevista"
        tourId="tour-1"
        user={{ name: "Saved traveller", email: "saved@example.com" }}
      />,
    );

    expect(await screen.findByDisplayValue("Saved traveller")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Travellers"), { target: { value: "2" } });
    fireEvent.change(screen.getByLabelText("Start date"), { target: { value: "2026-10-10" } });
    fireEvent.change(screen.getByLabelText("End date"), { target: { value: "2026-10-17" } });
    fireEvent.click(screen.getByRole("button", { name: "Continue with Premium" }));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    fireEvent.click(await screen.findByRole("button", { name: "Choose Standard" }));

    expect(screen.getByDisplayValue("Saved traveller")).toBeInTheDocument();
    expect(screen.getByDisplayValue("saved@example.com")).toBeInTheDocument();
    expect(screen.getByDisplayValue("2")).toBeInTheDocument();
    expect(screen.getByDisplayValue("2026-10-10")).toBeInTheDocument();
    expect(screen.getByDisplayValue("2026-10-17")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send tour enquiry" })).toBeInTheDocument();
  });
});
