import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import "@testing-library/jest-dom/vitest";
import AccountProfile from "../components/AccountProfile/AccountProfile.jsx";

afterEach(cleanup);

const member = {
  id: "user-c22971e8",
  name: "Creative Ak",
  email: "member@example.com",
  createdAt: "2026-08-21T00:00:00.000Z",
  accountRole: "member",
  adminLevel: "none",
  agencyRole: "none",
  agentApprovalStatus: "not_required",
};

describe("AccountProfile account details", () => {
  it("keeps an ordinary member profile focused on useful account information", () => {
    render(<AccountProfile user={member} showExtendedAccountDetails={false} />);

    expect(screen.getByText("Member since")).toBeInTheDocument();
    expect(screen.queryByText("Role")).not.toBeInTheDocument();
    expect(screen.queryByText("Admin level")).not.toBeInTheDocument();
    expect(screen.queryByText("Agency role")).not.toBeInTheDocument();
    expect(screen.queryByText("Agent status")).not.toBeInTheDocument();
    expect(screen.queryByText("User ID")).not.toBeInTheDocument();
  });

  it("retains operational identity details for a member who is also an agent", () => {
    render(
      <AccountProfile
        user={{ ...member, agencyRole: "partner_admin", agentApprovalStatus: "approved" }}
        showExtendedAccountDetails
      />,
    );

    expect(screen.getByText("Role")).toBeInTheDocument();
    expect(screen.getByText("Agency role")).toBeInTheDocument();
    expect(screen.getByText("Agent status")).toBeInTheDocument();
    expect(screen.getByText("User ID")).toBeInTheDocument();
  });

  it("supports a minimal role-aware partner summary without internal references", () => {
    render(
      <AccountProfile
        user={{ ...member, accountRole: "Partner admin" }}
        showRole
        showAdminLevel={false}
        showAgencyRole={false}
        showAgentStatus={false}
        showUserId={false}
        showExtraDetails={false}
      />,
    );

    expect(screen.getByText("Partner admin")).toBeInTheDocument();
    expect(screen.getByText("Member since")).toBeInTheDocument();
    expect(screen.queryByText("Admin level")).not.toBeInTheDocument();
    expect(screen.queryByText("Agency role")).not.toBeInTheDocument();
    expect(screen.queryByText("Agent status")).not.toBeInTheDocument();
    expect(screen.queryByText("User ID")).not.toBeInTheDocument();
  });
});
