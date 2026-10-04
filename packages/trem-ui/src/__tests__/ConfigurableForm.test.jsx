import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ConfigurableForm from "../components/ConfigurableForm/ConfigurableForm.jsx";

const baseConfig = {
  layout: { columns: 2, expandable: true, defaultExpanded: true, showExpandAll: true },
  sections: [
    {
      id: "personal",
      title: "Personal Information",
      collapsible: true,
      defaultExpanded: true,
      fields: [
        {
          name: "firstName",
          type: "text",
          label: "First name",
          placeholder: "First name",
          required: true,
        },
        { name: "lastName", type: "text", label: "Last name" },
      ],
    },
    {
      id: "contact",
      title: "Contact Details",
      collapsible: true,
      defaultExpanded: false,
      fields: [
        { name: "email", type: "email", label: "Email address" },
        { name: "phone", type: "tel", label: "Phone number" },
      ],
    },
  ],
};

describe("ConfigurableForm", () => {
  it("renders section titles and fields", () => {
    render(<ConfigurableForm config={baseConfig} values={{}} onChange={() => {}} />);
    expect(screen.getByText("Personal Information")).toBeInTheDocument();
    expect(screen.getByText("First name")).toBeInTheDocument();
    expect(screen.getByText("Last name")).toBeInTheDocument();
  });

  it("renders input labels inside the control", () => {
    render(<ConfigurableForm config={baseConfig} values={{}} onChange={() => {}} />);
    const firstNameLabel = screen.getByText("First name");
    expect(firstNameLabel.closest(".trem-input")).not.toBeNull();
    expect(screen.getByText("Last name").closest(".trem-input")).not.toBeNull();
  });

  it("collapses a section when toggled and expands when defaultExpanded is false", () => {
    render(<ConfigurableForm config={baseConfig} values={{}} onChange={() => {}} />);
    const contactToggle = screen.getByRole("button", { name: /contact details/i });
    expect(contactToggle).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(contactToggle);
    expect(screen.getByRole("button", { name: /contact details/i })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(screen.getByText("Email address")).toBeInTheDocument();
  });

  it("collapses an open section on toggle", () => {
    render(<ConfigurableForm config={baseConfig} values={{}} onChange={() => {}} />);
    const personalToggle = screen.getByRole("button", { name: /personal information/i });
    expect(personalToggle).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(personalToggle);
    expect(screen.getByRole("button", { name: /personal information/i })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(screen.queryByText("First name")).not.toBeInTheDocument();
  });

  it("shows field errors", () => {
    render(
      <ConfigurableForm
        config={baseConfig}
        values={{}}
        errors={{ firstName: "First name is required" }}
        onChange={() => {}}
      />,
    );
    expect(screen.getByText("First name is required")).toBeInTheDocument();
  });

  it("fires onChange with name and value for text fields", () => {
    const handleChange = vi.fn();
    render(<ConfigurableForm config={baseConfig} values={{}} onChange={handleChange} />);
    fireEvent.change(screen.getByPlaceholderText("First name"), { target: { value: "Ada" } });
    expect(handleChange).toHaveBeenCalledWith("firstName", "Ada");
  });

  it('renders "Expand all" / "Collapse all" toolbar', () => {
    render(<ConfigurableForm config={baseConfig} values={{}} onChange={() => {}} />);
    expect(screen.getByRole("button", { name: /expand all/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /expand all/i }));
    expect(screen.getByRole("button", { name: /collapse all/i })).toBeInTheDocument();
  });

  it("does not render toggle buttons when expandable is false", () => {
    const staticConfig = { layout: { expandable: false }, sections: baseConfig.sections };
    render(<ConfigurableForm config={staticConfig} values={{}} onChange={() => {}} />);
    expect(screen.queryByRole("button", { name: /personal information/i })).not.toBeInTheDocument();
    expect(screen.getByText("Personal Information")).toBeInTheDocument();
  });

  it("renders select fields with a built-in labelled dropdown and fires onChange with the selected value", () => {
    const config = {
      layout: { columns: 2 },
      sections: [
        {
          id: "personal",
          title: "Personal",
          fields: [
            {
              name: "travellerType",
              type: "select",
              label: "Traveller type",
              options: [
                { value: "adult", label: "Adult (12+ years)" },
                { value: "child", label: "Child" },
              ],
            },
          ],
        },
      ],
    };
    const handleChange = vi.fn();
    render(<ConfigurableForm config={config} values={{}} onChange={handleChange} />);
    expect(screen.getByText("Traveller type")).toBeInTheDocument();
    expect(screen.getByText(/select/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText("Traveller type"));
    fireEvent.click(screen.getByText("Child"));
    expect(handleChange).toHaveBeenCalledWith("travellerType", "child");
  });

  it("applies the span, wide classes and responsive grid variables", () => {
    const config = {
      layout: { columns: 2, columnsMobile: 3 },
      sections: [
        {
          id: "details",
          title: "Details",
          fields: [
            {
              name: "title",
              type: "select",
              label: "Title",
              width: "auto",
              options: [{ value: "Mr", label: "Mr" }],
            },
            { name: "firstName", type: "text", label: "First name" },
            { name: "email", type: "email", label: "Email", wide: true },
          ],
        },
      ],
    };
    render(<ConfigurableForm config={config} values={{}} onChange={() => {}} />);

    const titleField = screen.getByText("Title").closest(".trem-form__field");
    expect(titleField).toHaveClass("trem-form__field--span-1");

    const emailField = screen.getByText("Email").closest(".trem-form__field");
    expect(emailField).toHaveClass("trem-form__field--wide");

    const grid = document.querySelector(".trem-form__grid");
    expect(grid).toHaveStyle("--trem-form-cols: 2");
    expect(grid).toHaveStyle("--trem-form-cols-mobile: 3");
  });

  it("sizes selects to content by default and honors an explicit fixed width so the portal adjusts", () => {
    const config = {
      layout: { columns: 2 },
      sections: [
        {
          id: "details",
          title: "Details",
          fields: [
            {
              name: "title",
              type: "select",
              label: "Title",
              options: [
                { value: "mr", label: "Mr" },
                { value: "ms", label: "Ms" },
              ],
            },
            {
              name: "gender",
              type: "select",
              label: "Gender",
              options: [
                { value: "male", label: "Male" },
                { value: "female", label: "Female" },
              ],
              width: 140,
            },
            {
              name: "nationality",
              type: "select",
              label: "Nationality",
              options: [
                { value: "in", label: "India" },
                { value: "gb", label: "United States of America" },
              ],
            },
          ],
        },
      ],
    };
    render(<ConfigurableForm config={config} values={{}} onChange={() => {}} />);

    const titleWrapper = screen.getByText("Title").closest(".trem-dropdown");
    expect(titleWrapper.style.width).toBe("auto");
    expect(titleWrapper.style.alignSelf).toBe("flex-start");

    const genderWrapper = screen.getByText("Gender").closest(".trem-dropdown");
    expect(genderWrapper.style.width).toBe("140px");

    const nationalityWrapper = screen.getByText("Nationality").closest(".trem-dropdown");
    expect(nationalityWrapper.style.width).toBe("");
  });
});
