import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  Dropdown,
  EmptyState,
  Icon,
  InputField,
  MetricSummary,
  NoDataFound,
  Spinner,
  StatusBadge,
} from "@packages/trem-ui";
import { showRealtimeToast } from "@packages/trem-events";
import api from "../../services/apiClient";
import PartnerDashboard from "./PartnerDashboard";
import CustomerDirectory from "./CustomerDirectory";
import "./PartnerWorkspace.scss";

const unwrap = (response) =>
  response?.data?.componentData?.data ?? response?.data?.data ?? response?.data;
const pretty = (value = "") =>
  String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
const configs = {
  dashboard: { endpoint: "/tenancy/dashboard", title: "Agency dashboard" },
  agents: { endpoint: "/tenancy/agencies/me/users", title: "Agency agents" },
  customers: { endpoint: "/tenancy/customers", title: "Customers" },
  reports: { endpoint: "/tenancy/reports", title: "Agency reports" },
  deletions: { endpoint: "/tenancy/deletion-requests", title: "Deletion requests" },
  notifications: { endpoint: "/tenancy/notifications", title: "Notifications" },
};

const AGENT_STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "invited", label: "Invitation pending" },
  { value: "suspended", label: "Suspended" },
  { value: "deactivated", label: "Deactivated" },
];

const AGENT_ROLE_OPTIONS = [
  { value: "", label: "All roles" },
  { value: "partner_admin", label: "Partner admins" },
  { value: "partner_agent", label: "Partner agents" },
];

const formatDate = (value) => {
  if (!value) return "Not activated yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

function AgentAvatar({ item }) {
  const selectedAvatar = String(item?.avatar || "").trim();
  const avatar = /^https?:\/\//i.test(selectedAvatar) ? "user" : selectedAvatar || "user";
  return (
    <span className="partner-agent-card__avatar" aria-hidden="true">
      <Icon name={avatar} size={25} />
    </span>
  );
}

function FilterMenu({ label, value, options, onChange }) {
  const selected = options.find((option) => option.value === value) || options[0];
  return (
    <Dropdown
      align="right"
      hoverable={false}
      trigger={
        <Button
          variant="outline"
          color="primary"
          text={selected.label}
          iconRight="chevronDown"
          className="partner-workspace__filter-trigger"
          aria-label={label}
        />
      }
      items={options.map((option) => ({
        id: option.value || "all",
        label: option.label,
        active: option.value === value,
        onClick: () => onChange(option.value),
      }))}
    />
  );
}

function AgentDirectory({
  items,
  total,
  summary,
  loading,
  filters,
  setFilters,
  searchValue,
  setSearchValue,
  isAdmin,
  currentUserId,
  onInvite,
  onRefresh,
  onStatusChange,
  onResendInvite,
  onPasswordReset,
  onDeleteRequest,
  embedded = false,
}) {
  const metrics = [
    { id: "total", label: "Total team", value: summary.total || 0, icon: "usersRound" },
    { id: "active", label: "Active", value: summary.active || 0, icon: "shieldCheck" },
    { id: "invited", label: "Invited", value: summary.invited || 0, icon: "messageCircle" },
    { id: "inactive", label: "Inactive", value: summary.inactive || 0, icon: "clock" },
  ];

  return (
    <div className={`partner-agent-directory${embedded ? " is-embedded" : ""}`}>
      {!embedded ? <header className="partner-workspace__hero">
        <div>
          <p>Partner Admin Workspace</p>
          <h1>Agent Operations</h1>
          <span>Manage agency access, invitations and account security from one workspace.</span>
        </div>
        <div className="partner-workspace__header-actions">
          {isAdmin ? (
            <Button text="Invite agent" iconLeft="plus" onClick={onInvite} />
          ) : null}
          <Button text="Refresh" iconLeft="refreshCw" variant="outline" onClick={onRefresh} />
        </div>
      </header> : null}

      <MetricSummary
        variant="cards"
        className="partner-workspace__metric-summary"
        ariaLabel="Agent account summary"
        items={metrics}
      />

      <section className="partner-workspace__directory-panel">
        <header className="partner-workspace__directory-heading">
          <div>
            <h2>Agency team</h2>
            <p>Agents and administrators with access to this agency workspace.</p>
          </div>
          <span className="partner-workspace__result-count">
            {loading ? <Icon name="refreshCw" size={15} className="is-spinning" /> : null}
            <strong>{total}</strong> {total === 1 ? "account" : "accounts"}
          </span>
        </header>

        <div className="partner-workspace__controls">
          <div className="partner-workspace__search">
            <Icon name="search" size={20} />
            <input
              type="search"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Search by name, email, phone or designation"
              aria-label="Search agency agents"
            />
          </div>
          <div className="partner-workspace__filters">
            <FilterMenu
              label="Filter agents by role"
              value={filters.role}
              options={AGENT_ROLE_OPTIONS}
              onChange={(role) => setFilters((current) => ({ ...current, role }))}
            />
            <FilterMenu
              label="Filter agents by status"
              value={filters.status}
              options={AGENT_STATUS_OPTIONS}
              onChange={(status) => setFilters((current) => ({ ...current, status }))}
            />
          </div>
        </div>

        {items.length ? (
          <div className="partner-workspace__agent-grid">
            {items.map((item) => {
              const isSelf = String(item._id || "") === String(currentUserId || "");
              const canManage = isAdmin && item.agencyRole === "partner_agent" && !isSelf;
              return (
                <article className="partner-agent-card" key={item._id}>
                  <div className="partner-agent-card__identity">
                    <AgentAvatar item={item} />
                    <div>
                      <div className="partner-agent-card__name-row">
                        <h3>{item.name || "Unnamed agent"}</h3>
                        {isSelf ? <span className="partner-agent-card__self">You</span> : null}
                      </div>
                      <a href={`mailto:${item.email}`}>{item.email}</a>
                    </div>
                    <StatusBadge value={item.accountStatus || "active"} size="sm" />
                  </div>

                  <dl className="partner-agent-card__details">
                    <div>
                      <dt>Role</dt>
                      <dd>{pretty(item.agencyRole || "partner_agent")}</dd>
                    </div>
                    <div>
                      <dt>Designation</dt>
                      <dd>{item.designation || "Travel consultant"}</dd>
                    </div>
                    <div>
                      <dt>Joined</dt>
                      <dd>{formatDate(item.activatedAt || item.createdAt)}</dd>
                    </div>
                  </dl>

                  <div className="partner-agent-card__products">
                    <span>Product access</span>
                    <div>
                      {(item.productAccess || []).length ? (
                        item.productAccess.map((product) => <em key={product}>{pretty(product)}</em>)
                      ) : (
                        <small>No products assigned</small>
                      )}
                    </div>
                  </div>

                  {canManage ? (
                    <footer className="partner-agent-card__actions">
                      {item.accountStatus !== "invited" ? (
                        <Button
                          size="small"
                          variant="outline"
                          text={item.accountStatus === "active" ? "Deactivate" : "Activate"}
                          onClick={() => onStatusChange(item)}
                        />
                      ) : null}
                      {item.accountStatus === "invited" ? (
                        <Button
                          size="small"
                          variant="text"
                          text="Resend invite"
                          onClick={() => onResendInvite(item)}
                        />
                      ) : (
                        <Button
                          size="small"
                          variant="text"
                          text="Reset password"
                          onClick={() => onPasswordReset(item)}
                        />
                      )}
                      <Button
                        size="small"
                        variant="text"
                        color="danger"
                        text="Request deletion"
                        onClick={() => onDeleteRequest(item)}
                      />
                    </footer>
                  ) : null}
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon="usersRound"
            title="No agents match this view"
            description="Adjust the search or filters, or invite a new agent to your agency."
            action={
              filters.search || filters.role || filters.status ? (
                <Button
                  variant="outline"
                  text="Clear filters"
                  onClick={() => {
                    setSearchValue("");
                    setFilters({ search: "", role: "", status: "" });
                  }}
                />
              ) : isAdmin ? (
                <Button text="Invite your first agent" onClick={onInvite} />
              ) : null
            }
          />
        )}
      </section>
    </div>
  );
}

export default function PartnerWorkspace({ tab, user, embedded = false }) {
  const config = configs[tab] || configs.dashboard;
  const [state, setState] = useState({ loading: true, error: "", value: null });
  const [notice, setNotice] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", designation: "", reason: "" });
  const [agentFilters, setAgentFilters] = useState({ search: "", role: "", status: "" });
  const [agentSearch, setAgentSearch] = useState("");
  const [activityPage, setActivityPage] = useState(1);
  const isAdmin = user?.agencyRole === "partner_admin";
  const agencyId = user?.agencyId || "me";
  const endpoint = tab === "agents" ? `/tenancy/agencies/${agencyId}/users` : config.endpoint;
  useEffect(() => {
    if (tab !== "agents") return undefined;
    const timer = window.setTimeout(() => {
      setAgentFilters((current) => ({ ...current, search: agentSearch.trim() }));
    }, 300);
    return () => window.clearTimeout(timer);
  }, [agentSearch, tab]);
  const load = useCallback(async () => {
    if (tab === "customers") return;
    setState((value) => ({ ...value, loading: true, error: "" }));
    try {
      const response = await api.get(endpoint, {
        params:
          tab === "agents"
            ? { limit: 100, ...agentFilters }
            : tab === "dashboard"
              ? { activityPage, activityLimit: 6 }
              : { limit: 50 },
      });
      setState({ loading: false, error: "", value: unwrap(response) });
    } catch (error) {
      setState((current) => ({
        loading: false,
        error: error?.response?.data?.message || "This workspace could not be loaded.",
        value: current.value,
      }));
    }
  }, [activityPage, agentFilters, endpoint, tab]);
  useEffect(() => {
    load();
  }, [load]);
  const perform = async (request, message) => {
    try {
      await request();
      setNotice(message);
      showRealtimeToast({
        title: message,
        status: "success",
        dedupeKey: `partner-workspace:success:${message}`,
      });
      setShowCreate(false);
      setForm({ name: "", email: "", phone: "", designation: "", reason: "" });
      await load();
    } catch (error) {
      const message = error?.response?.data?.message || "Action failed.";
      setNotice(message);
      showRealtimeToast({
        title: message,
        status: "error",
        dedupeKey: `partner-workspace:error:${message}`,
      });
    }
  };
  const create = () =>
    tab === "agents"
      ? perform(
          () =>
            api.post(`/tenancy/agencies/${agencyId}/users/invite`, {
              ...form,
              agencyRole: "partner_agent",
              productKeys: user.productAccess || [],
            }),
          "Agent invited securely.",
        )
      : perform(() => api.post("/tenancy/customers", form), "Customer added.");
  const items = state.value?.items || (Array.isArray(state.value) ? state.value : []);
  const metrics =
    state.value && !items.length
      ? Object.entries(state.value).filter(([, value]) => typeof value === "number")
      : [];
  const agentSummary = useMemo(
    () => state.value?.summary || { total: items.length, active: 0, invited: 0, inactive: 0 },
    [items.length, state.value?.summary],
  );

  const requestAgentDeletion = (item) => {
    setForm({
      name: item.name || "",
      email: item.email || "",
      phone: "",
      designation: "",
      reason: "",
      agentId: item._id,
    });
    setShowCreate(true);
  };

  if (tab === "dashboard") {
    return (
      <PartnerDashboard
        data={state.value}
        loading={state.loading}
        error={state.error}
        onRefresh={load}
        onActivityPageChange={setActivityPage}
      />
    );
  }

  if (tab === "customers") return <CustomerDirectory embedded={embedded} />;

  if (tab === "reports" && state.loading) {
    return (
      <div className="partner-workspace__state partner-workspace__state--panel">
        <Spinner label="Loading reports" />
      </div>
    );
  }

  if (tab === "reports" && state.error) {
    return (
      <div className="partner-workspace__state partner-workspace__state--panel">
        <strong>Unable to load reports</strong>
        <span>{state.error}</span>
        <Button text="Try again" onClick={load} />
      </div>
    );
  }

  if (tab === "reports" && state.value?.available === false) {
    const reportView = state.value.view;
    return (
      <section className="partner-workspace partner-workspace--reports">
        <header>
          <div>
            <p>{reportView.eyebrow}</p>
            <h2>{reportView.title}</h2>
            <span>{reportView.subtitle}</span>
          </div>
        </header>
        <div className="partner-workspace__reports-notice">
          <EmptyState
            icon="chart"
            title={reportView.emptyTitle}
            description={reportView.emptyDescription}
          />
        </div>
      </section>
    );
  }

  return (
    <section className="partner-workspace">
      {tab === "agents" && state.loading && !state.value ? (
        <div className="partner-workspace__state partner-workspace__state--panel">
          <Spinner label="Loading agency team" />
        </div>
      ) : tab === "agents" && state.error && !state.value ? (
        <div className="partner-workspace__state partner-workspace__state--panel">
          <Icon name="alertTriangle" size={36} />
          <strong>Unable to load the agency team</strong>
          <span>{state.error}</span>
          <Button text="Try again" onClick={load} />
        </div>
      ) : tab === "agents" ? (
        <AgentDirectory
          items={items}
          total={state.value?.total ?? items.length}
          summary={agentSummary}
          loading={state.loading}
          filters={agentFilters}
          setFilters={setAgentFilters}
          searchValue={agentSearch}
          setSearchValue={setAgentSearch}
          isAdmin={isAdmin}
          currentUserId={user?.id || user?._id}
          onInvite={() => {
            setForm({ name: "", email: "", phone: "", designation: "", reason: "" });
            setShowCreate(true);
          }}
          onRefresh={load}
          onStatusChange={(item) =>
            perform(
              () =>
                api.patch(`/tenancy/users/${item._id}`, {
                  accountStatus: item.accountStatus === "active" ? "deactivated" : "active",
                }),
              "Agent status updated.",
            )
          }
          onResendInvite={(item) =>
            perform(
              () => api.post(`/tenancy/users/${item._id}/resend-invitation`),
              "Invitation resent.",
            )
          }
          onPasswordReset={(item) =>
            perform(
              () => api.post("/auth/forgot-password", { email: item.email }),
              "Password reset instructions sent.",
            )
          }
          onDeleteRequest={requestAgentDeletion}
          embedded={embedded}
        />
      ) : (
      <header>
        <div>
          <p>{isAdmin ? "Partner Admin" : "Partner Agent"}</p>
          <h2>{config.title}</h2>
          <span>
            {isAdmin
              ? "Agency-wide, tenant-isolated operations."
              : "Your assigned work and customers only."}
          </span>
        </div>
        <div className="partner-workspace__header-actions">
          {["agents", "customers"].includes(tab) && (
            <Button
              text={tab === "agents" ? "Invite agent" : "Add customer"}
              onClick={() => setShowCreate(true)}
            />
          )}
          <Button text="Refresh" variant="outline" onClick={load} />
        </div>
      </header>
      )}
      {notice && (
        <div className="partner-workspace__notice" role="status">
          {notice}
          <button onClick={() => setNotice("")}>×</button>
        </div>
      )}
      {tab === "agents" ? null : state.loading ? (
        <div className="partner-workspace__state">
          <Spinner label="Loading workspace" />
        </div>
      ) : state.error ? (
        <div className="partner-workspace__state">
          <strong>Unable to load</strong>
          <span>{state.error}</span>
          <Button text="Try again" onClick={load} />
        </div>
      ) : metrics.length ? (
        <>
          <MetricSummary
            variant="cards"
            className="partner-workspace__metric-summary"
            ariaLabel={`${config.title} summary`}
            items={metrics.map(([key, value]) => ({
              id: key,
              label: pretty(key),
              value,
              icon: "sparkles",
            }))}
          />
        </>
      ) : items.length ? (
        <div className="partner-workspace__list">
          {items.map((item) => (
            <article key={item._id}>
              <div>
                <strong>{item.name || item.title || item.email || pretty(item.type)}</strong>
                <span>{item.email || item.phone || item.message || item.reason || ""}</span>
              </div>
              <StatusBadge
                value={item.accountStatus || item.status || (item.readAt ? "read" : "new")}
              />
            </article>
          ))}
        </div>
      ) : (
        <NoDataFound
          title="No records yet"
          description="New records will appear here as your agency works in TravelsTREM."
        />
      )}
      {showCreate && (
        <div
          className="partner-workspace__overlay"
          onMouseDown={(event) => event.target === event.currentTarget && setShowCreate(false)}
        >
          <form
            className="partner-workspace__modal"
            onSubmit={(event) => {
              event.preventDefault();
              form.agentId
                ? perform(
                    () =>
                      api.post(`/tenancy/users/${form.agentId}/deletion-request`, {
                        reason: form.reason,
                      }),
                    "Deletion request sent to TravelsTREM.",
                  )
                : create();
            }}
          >
            <header>
              <div>
                <span>PARTNERTREM</span>
                <h3>
                  {form.agentId
                    ? "Request permanent deletion"
                    : tab === "agents"
                      ? "Invite an agent"
                      : "Add a customer"}
                </h3>
              </div>
              <Button
                type="button"
                variant="text"
                isCircular
                onClick={() => setShowCreate(false)}
                aria-label="Close dialog"
              >
                <Icon name="x" size={20} />
              </Button>
            </header>
            <p className="partner-workspace__modal-intro">
              {form.agentId
                ? `Request deletion of ${form.name || form.email}. TravelsTREM will review the request before any data is removed.`
                : tab === "agents"
                  ? "The agent will receive a secure, time-limited invitation to activate their account."
                  : "Add the customer details required by your agency workspace."}
            </p>
            {form.agentId ? (
              <label>
                Reason
                <textarea
                  value={form.reason}
                  onChange={(event) =>
                    setForm((value) => ({ ...value, reason: event.target.value }))
                  }
                  required
                />
              </label>
            ) : (
              <>
                <InputField
                  label="Full name"
                  required
                  value={form.name}
                  onChange={(name) => setForm((value) => ({ ...value, name }))}
                />
                <InputField
                  label="Email"
                  variant="email"
                  required
                  value={form.email}
                  onChange={(email) => setForm((value) => ({ ...value, email }))}
                />
                <InputField
                  label="Phone"
                  variant="tel"
                  value={form.phone}
                  onChange={(phone) => setForm((value) => ({ ...value, phone }))}
                />
                {tab === "agents" && (
                  <InputField
                    label="Designation"
                    value={form.designation}
                    onChange={(designation) => setForm((value) => ({ ...value, designation }))}
                  />
                )}
              </>
            )}
            <footer>
              <Button
                type="button"
                variant="outline"
                text="Cancel"
                onClick={() => setShowCreate(false)}
              />
              <Button
                type="submit"
                text={
                  form.agentId
                    ? "Submit request"
                    : tab === "agents"
                      ? "Send invitation"
                      : "Save customer"
                }
              />
            </footer>
          </form>
        </div>
      )}
    </section>
  );
}
