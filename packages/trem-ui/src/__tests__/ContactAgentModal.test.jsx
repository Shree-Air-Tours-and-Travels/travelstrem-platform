import React from "react";
import { render, screen } from "@testing-library/react";
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

    render(<ContactAgentModal open onClose={vi.fn()} product="trevio" />);

    expect(await screen.findByRole("heading", { name: "Tour enquiry" })).toBeInTheDocument();
    expect(screen.getByText("Full name")).toBeInTheDocument();
    expect(screen.getByText("How should we contact you?")).toBeInTheDocument();
    expect(screen.getByText("What kind of tour are you looking for?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send tour enquiry" })).toBeInTheDocument();
    expect(get).toHaveBeenCalledWith(
      "/form.json?form=contact-agent&product=trevio",
      expect.any(Object),
    );
  });
});
