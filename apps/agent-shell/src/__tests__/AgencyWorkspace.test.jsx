import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import AgencyWorkspace from "../features/tenancy/AgencyWorkspace";

let mockInitialSearch = "";

jest.mock(
  "react-router-dom",
  () => ({
    useSearchParams: () => {
      const React = require("react");
      const [params, setParams] = React.useState(() => new URLSearchParams(mockInitialSearch));
      return [params, (next) => setParams(new URLSearchParams(next))];
    },
  }),
  { virtual: true },
);

jest.mock("@packages/trem-ui", () => ({
  Icon: () => <svg aria-hidden="true" />,
  StatusBadge: ({ value }) => <span>{value}</span>,
}));

jest.mock("../features/services/tours/PartnerAgencyPage.view", () => () => (
  <div>Agency profile content</div>
));

jest.mock("../features/tenancy/PartnerWorkspace", () => ({ embedded }) => (
  <div>{embedded ? "Embedded agency team" : "Agency team"}</div>
));

const props = {
  user: {
    id: "admin-1",
    agencyId: "agency-1",
    agencyName: "Shree Air Tours",
    agencyRole: "partner_admin",
  },
  auth: { user: { agencyRole: "partner_admin" } },
  agencyApplication: { agency: { agencyName: "Shree Air Tours", status: "approved" } },
  agencyLoading: false,
  onApplyAgency: jest.fn(),
  fetchAgency: jest.fn(),
};

test("combines agency profile and team in one route-driven workspace", () => {
  mockInitialSearch = "";
  render(<AgencyWorkspace {...props} />);

  expect(screen.getByRole("heading", { name: "Agency Workspace" })).toBeInTheDocument();
  expect(screen.getByText("Agency profile content")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: /Team/ }));

  expect(screen.getByText("Embedded agency team")).toBeInTheDocument();
  expect(screen.queryByText("Agency profile content")).not.toBeInTheDocument();
});

test("opens the team view directly from its canonical query parameter", () => {
  mockInitialSearch = "view=team";
  render(<AgencyWorkspace {...props} />);

  expect(screen.getByText("Embedded agency team")).toBeInTheDocument();
});
