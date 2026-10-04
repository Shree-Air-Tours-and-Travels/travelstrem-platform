import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import PartnerWorkspace from "../features/tenancy/PartnerWorkspace";
import api from "../services/apiClient";

const mockNavigate = jest.fn();

jest.mock(
  "react-router-dom",
  () => ({ useNavigate: () => mockNavigate }),
  { virtual: true },
);

jest.mock("../services/apiClient", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
  },
}));

jest.mock("@packages/trem-events", () => ({
  showRealtimeToast: jest.fn(),
  useEnquiryRealtime: jest.fn(),
  useTourCatalogRealtime: jest.fn(),
  useRealtimeStatus: () => ({ isConnected: true, isReconnecting: false }),
}));

jest.mock("@packages/trem-ui", () => {
  const React = require("react");
  return {
    Button: ({ children, text, onClick, type = "button", ...props }) => (
      <button type={type} onClick={onClick} aria-label={props["aria-label"]}>
        {children || text}
      </button>
    ),
    Dropdown: ({ trigger }) => <div>{typeof trigger === "function" ? trigger({}) : trigger}</div>,
    EmptyState: ({ title, description, action }) => (
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
        {action}
      </div>
    ),
    Icon: () => <svg aria-hidden="true" />,
    InputField: ({ label, value, onChange, required, variant = "text" }) => (
      <label>
        {label}
        <input
          aria-label={label}
          type={variant}
          value={value}
          required={required}
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
    ),
    NoDataFound: ({ title, description }) => (
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    ),
    Pagination: ({ currentPage, totalPages, onPageChange, ariaLabel }) => (
      <nav aria-label={ariaLabel}>
        <span>Page {currentPage} of {totalPages}</span>
        {currentPage < totalPages ? (
          <button type="button" onClick={() => onPageChange(currentPage + 1)}>Next page</button>
        ) : null}
      </nav>
    ),
    Spinner: ({ label }) => <span>{label}</span>,
    StatusBadge: ({ value }) => <span>{String(value).replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</span>,
  };
});

const response = {
  data: {
    componentData: {
      data: {
        total: 2,
        summary: { total: 2, active: 1, invited: 1, inactive: 0 },
        items: [
          {
            _id: "admin-1",
            name: "Agency Owner",
            email: "owner@example.com",
            agencyRole: "partner_admin",
            accountStatus: "active",
            productAccess: ["trevista"],
            createdAt: "2026-08-20T00:00:00.000Z",
          },
          {
            _id: "agent-1",
            name: "Invited Agent",
            email: "agent@example.com",
            agencyRole: "partner_agent",
            accountStatus: "invited",
            productAccess: ["trevista"],
            createdAt: "2026-08-24T00:00:00.000Z",
          },
        ],
      },
    },
  },
};

beforeEach(() => {
  jest.clearAllMocks();
  api.get.mockResolvedValue(response);
});

test("renders the backend-driven agent operations directory and valid invitation actions", async () => {
  render(
    <PartnerWorkspace
      tab="agents"
      user={{ id: "admin-1", agencyId: "agency-1", agencyRole: "partner_admin" }}
    />,
  );

  expect(await screen.findByRole("heading", { name: "Agent Operations" })).toBeInTheDocument();
  expect(screen.getByText("Agency team")).toBeInTheDocument();
  expect(screen.getByText("Invited Agent")).toBeInTheDocument();
  expect(screen.getAllByText("Invited").length).toBeGreaterThan(0);
  expect(screen.getByRole("button", { name: "Resend invite" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Activate" })).not.toBeInTheDocument();
  expect(api.get).toHaveBeenCalledWith(
    "/tenancy/agencies/agency-1/users",
    expect.objectContaining({
      params: expect.objectContaining({ limit: 100 }),
    }),
  );
});

test("opens the secure invitation journey from the primary action", async () => {
  render(
    <PartnerWorkspace
      tab="agents"
      user={{ id: "admin-1", agencyId: "agency-1", agencyRole: "partner_admin" }}
    />,
  );

  await screen.findByRole("heading", { name: "Agent Operations" });
  fireEvent.click(screen.getByRole("button", { name: "Invite agent" }));

  expect(screen.getByRole("heading", { name: "Invite an agent" })).toBeInTheDocument();
  expect(screen.getByLabelText("Full name")).toBeInTheDocument();
  expect(screen.getByLabelText("Email")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Send invitation" })).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Close dialog" }));
  await waitFor(() =>
    expect(screen.queryByRole("heading", { name: "Invite an agent" })).not.toBeInTheDocument(),
  );
});

test("renders the versioned partner dashboard contract and follows backend actions", async () => {
  api.get.mockResolvedValueOnce({
    data: {
      componentData: {
        data: {
          schemaVersion: "partner-dashboard.v1",
          agency: { name: "Shree Air Tours", status: "active" },
          viewer: { roleLabel: "Partner Admin" },
          hero: {
            eyebrow: "Agency operations",
            title: "Agency dashboard",
            description: "Monitor agency operations.",
          },
          kpis: [
            {
              id: "open-enquiries",
              label: "Open enquiries",
              value: 3,
              helper: "2 new",
              icon: "messageCircle",
              target: "/agent/bookings",
            },
          ],
          workload: [],
          products: [],
          recentActivity: [],
          quickActions: [
            {
              id: "review-enquiries",
              label: "Review enquiries",
              description: "Respond to travellers.",
              icon: "messageCircle",
              target: "/agent/bookings",
              variant: "primary",
            },
          ],
        },
      },
    },
  });

  render(
    <PartnerWorkspace
      tab="dashboard"
      user={{ id: "admin-1", agencyId: "agency-1", agencyRole: "partner_admin" }}
    />,
  );

  expect(await screen.findByRole("heading", { name: "Agency dashboard" })).toBeInTheDocument();
  expect(screen.getByText("Open enquiries")).toBeInTheDocument();
  expect(screen.getByText("Live updates")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /Review enquiries/ }));
  expect(mockNavigate).toHaveBeenCalledWith("/agent/bookings");
});

test("requests the next server-backed recent activity page", async () => {
  const dashboard = (page) => ({
    data: {
      componentData: {
        data: {
          schemaVersion: "partner-dashboard.v1",
          agency: { name: "Shree Air Tours", status: "active" },
          viewer: { roleLabel: "Partner Admin" },
          hero: { eyebrow: "Agency operations", title: "Agency dashboard", description: "Operations" },
          kpis: [],
          workload: [],
          products: [],
          quickActions: [],
          recentActivity: [{
            id: `activity-${page}`,
            title: `Activity page ${page}`,
            description: "Customer record updated",
            icon: "user",
            status: "active",
            occurredAt: "2026-08-24T10:00:00.000Z",
            target: "/agent/customers",
          }],
          recentActivityPagination: { page, limit: 6, total: 7, totalPages: 2 },
        },
      },
    },
  });
  api.get.mockResolvedValueOnce(dashboard(1)).mockResolvedValueOnce(dashboard(2));

  render(
    <PartnerWorkspace
      tab="dashboard"
      user={{ id: "admin-1", agencyId: "agency-1", agencyRole: "partner_admin" }}
    />,
  );

  await screen.findByText("Activity page 1");
  fireEvent.click(screen.getByRole("button", { name: "Next page" }));

  await screen.findByText("Activity page 2");
  expect(api.get).toHaveBeenLastCalledWith("/tenancy/dashboard", {
    params: { activityPage: 2, activityLimit: 6 },
  });
});

test("renders customers from the lifecycle contract instead of pagination counters", async () => {
  api.get.mockResolvedValueOnce({
    data: {
      componentData: {
        data: {
          items: [
            {
              id: "customer-1",
              name: "Traveller One",
              email: "traveller@example.com",
              status: "active",
              lifecycleStage: "lead",
              source: "enquiry",
              owner: { id: "agent-1", name: "Travel Agent" },
              activity: {
                enquiries: 2,
                openEnquiries: 1,
                bookings: 0,
                latestTour: "Rajasthan Journey",
              },
            },
          ],
          summaryCards: [
            { id: "total", label: "Customers", value: 1, icon: "usersRound" },
            { id: "active", label: "Active", value: 1, icon: "shieldCheck" },
          ],
          pagination: {
            total: 1,
            page: 1,
            totalPages: 1,
            hasPrevious: false,
            hasNext: false,
          },
          view: {
            hero: {
              eyebrow: "Partner Admin Workspace",
              title: "Customer relationships",
              description: "Manage every traveller.",
            },
            search: { placeholder: "Search customers" },
            directory: {
              title: "Customer directory",
              description: "Enquiries and follow-up.",
              resultLabel: "customers",
            },
            filters: { status: [], lifecycleStage: [], ownerAgent: [], sort: [] },
            form: {
              createTitle: "Add a customer",
              editTitle: "Update customer",
              description: "One customer record.",
              fields: [
                { name: "name", type: "text", label: "Full name", required: true },
                { name: "email", type: "email", label: "Email address" },
              ],
              createLabel: "Save customer",
              updateLabel: "Save changes",
              cancelLabel: "Cancel",
            },
            empty: { title: "No customers", description: "Add one." },
            actions: {
              create: "Add customer",
              refresh: "Refresh",
              view: "View journey",
              edit: "Edit",
              clearFilters: "Clear filters",
              previous: "Previous",
              next: "Next",
            },
            capabilities: { create: true, update: true, assign: true, archive: true },
          },
        },
      },
    },
  });

  render(
    <PartnerWorkspace
      tab="customers"
      user={{ id: "admin-1", agencyId: "agency-1", agencyRole: "partner_admin" }}
    />,
  );

  expect(await screen.findByRole("heading", { name: "Customer relationships" })).toBeInTheDocument();
  expect(screen.getByText("Traveller One")).toBeInTheDocument();
  expect(screen.getByText("Rajasthan Journey")).toBeInTheDocument();
  expect(screen.queryByText("Skip")).not.toBeInTheDocument();
  expect(screen.queryByText("Limit")).not.toBeInTheDocument();
  expect(api.get).toHaveBeenCalledWith(
    "/tenancy/customers",
    expect.objectContaining({ params: expect.objectContaining({ limit: 12, skip: 0 }) }),
  );

  fireEvent.click(screen.getByRole("button", { name: "Add customer" }));
  expect(screen.getByRole("heading", { name: "Add a customer" })).toBeInTheDocument();
  expect(screen.getByLabelText("Full name")).toBeInTheDocument();
});
