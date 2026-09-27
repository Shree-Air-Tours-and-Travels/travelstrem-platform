import React, { useMemo, useState } from "react";
import { Button, EmptyState, MetricSummary, SearchBar, StatusBadge } from "@packages/trem-ui";
import "./InternalTeamPage.scss";

const idOf = (value) => String(value?.id || value?._id || "");
const includesTeam = (member, team) => (member.internalTeamRoles || []).includes(team);

export default function InternalTeamPage({
  admins = [],
  currentUser,
  isMasterAdmin = false,
  loading,
  onRefresh,
  onReview,
  onRemove,
  onUpdateTeam,
}) {
  const [query, setQuery] = useState("");
  const [view, setView] = useState("all");
  const normalizedQuery = query.trim().toLowerCase();
  const metrics = useMemo(() => {
    const standardAdmins = admins.filter((member) => member.adminLevel !== "master");
    return [
      { id: "all", label: "Internal accounts", value: admins.length, icon: "usersRound" },
      {
        id: "active",
        label: "Approved admins",
        value: standardAdmins.filter((member) => member.adminApprovalStatus === "approved").length,
        icon: "shieldCheck",
      },
      {
        id: "pending",
        label: "Awaiting approval",
        value: standardAdmins.filter((member) => member.adminApprovalStatus === "pending").length,
        icon: "clock",
      },
      {
        id: "support",
        label: "Support team",
        value: standardAdmins.filter((member) => includesTeam(member, "support")).length,
        icon: "support",
      },
    ];
  }, [admins]);

  const filtered = useMemo(
    () =>
      admins.filter((member) => {
        const matchesQuery = !normalizedQuery
          ? true
          : [member.name, member.email, member.phone]
              .filter(Boolean)
              .join(" ")
              .toLowerCase()
              .includes(normalizedQuery);
        const matchesView =
          view === "all" ||
          (view === "support" && includesTeam(member, "support")) ||
          (view === "pending" && member.adminApprovalStatus === "pending") ||
          (view === "admins" &&
            member.adminLevel !== "master" &&
            member.adminApprovalStatus === "approved");
        return matchesQuery && matchesView;
      }),
    [admins, normalizedQuery, view],
  );

  return (
    <section className="internal-team">
      <header className="internal-team__hero">
        <div className="internal-team__hero-copy">
          <span>{isMasterAdmin ? "Master Admin workspace" : "Administration workspace"}</span>
          <h1>TravelsTREM internal team</h1>
          <p>
            {isMasterAdmin
              ? "Approve platform administrators and maintain the support-team roster from one secure workspace."
              : "Review pending support accounts and maintain the support-team roster. Master and sibling administrators remain protected."}
          </p>
        </div>
        <Button text="Refresh team" variant="secondary" iconLeft="refreshCw" onClick={onRefresh} />
      </header>

      <MetricSummary variant="cards" items={metrics} />

      <aside className="internal-team__future-note">
        <span className="internal-team__future-icon">ST</span>
        <div>
          <strong>Ready for SupportTREM</strong>
          <p>
            Support membership is stored on the backend independently of this screen. The future
            SupportTREM app can use the same roster and support-desk APIs.
          </p>
        </div>
        <StatusBadge value="Planned" tone="info" />
      </aside>

      <div className="internal-team__toolbar">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Search internal team"
          ariaLabel="Search TravelsTREM internal team"
        />
        <div className="internal-team__tabs" role="tablist" aria-label="Internal team filters">
          {[
            ["all", "Everyone"],
            ["admins", "Admins"],
            ["support", "Support team"],
            ["pending", "Pending"],
          ].map(([id, label]) => (
            <button
              type="button"
              role="tab"
              aria-selected={view === id}
              className={view === id ? "is-active" : ""}
              key={id}
              onClick={() => setView(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? <p className="internal-team__loading">Loading internal team…</p> : null}
      {!loading && !filtered.length ? (
        <EmptyState
          icon="usersRound"
          title="No matching internal accounts"
          description="Try another search or team filter."
        />
      ) : null}

      <div className="internal-team__grid">
        {filtered.map((member) => {
          const memberId = idOf(member);
          const isMaster = member.adminLevel === "master";
          const isSelf = memberId && memberId === idOf(currentUser);
          const approved = member.adminApprovalStatus === "approved";
          const supportMember = includesTeam(member, "support");
          return (
            <article className="internal-team-card" key={memberId}>
              <div className="internal-team-card__identity">
                <span className="internal-team-card__avatar" aria-hidden="true">
                  {(member.name || member.email || "T").slice(0, 1).toUpperCase()}
                </span>
                <div>
                  <span className="internal-team-card__name-line">
                    <strong>{member.name || "Unnamed administrator"}</strong>
                    {isSelf ? <em>You</em> : null}
                  </span>
                  <p>{member.email}</p>
                  {member.phone ? <small>{member.phone}</small> : null}
                </div>
              </div>

              <div className="internal-team-card__badges">
                <StatusBadge
                  value={isMaster ? "Master Admin" : "Administrator"}
                  tone={isMaster ? "info" : "neutral"}
                  size="sm"
                />
                <StatusBadge value={member.adminApprovalStatus || "pending"} size="sm" />
                {supportMember ? (
                  <StatusBadge value="Support team" tone="success" size="sm" />
                ) : null}
              </div>

              <dl className="internal-team-card__details">
                <div>
                  <dt>Account status</dt>
                  <dd>{member.accountStatus || "active"}</dd>
                </div>
                <div>
                  <dt>Joined</dt>
                  <dd>
                    {member.createdAt ? new Date(member.createdAt).toLocaleDateString() : "—"}
                  </dd>
                </div>
              </dl>

              {!isMaster ? (
                <div className="internal-team-card__actions">
                  {!approved ? (
                    <>
                      <Button text="Approve admin" onClick={() => onReview(memberId, "approved")} />
                      {member.adminApprovalStatus !== "rejected" ? (
                        <Button
                          text="Reject"
                          variant="secondary"
                          color="danger"
                          onClick={() => onReview(memberId, "rejected")}
                        />
                      ) : null}
                    </>
                  ) : (
                    <Button
                      text={supportMember ? "Remove from support" : "Add to support team"}
                      variant={supportMember ? "secondary" : "outline"}
                      onClick={() => onUpdateTeam(memberId, "support", !supportMember)}
                    />
                  )}
                  {!isSelf && member.adminApprovalStatus !== "removed" ? (
                    <Button
                      text="Remove access"
                      variant="text"
                      color="danger"
                      onClick={() => onRemove(memberId)}
                    />
                  ) : null}
                </div>
              ) : (
                <p className="internal-team-card__master-note">
                  Master Admin has permanent access to every internal workspace.
                </p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
