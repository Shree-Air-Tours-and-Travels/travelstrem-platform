import React, { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Icon, StatusBadge } from "@packages/trem-ui";
import PartnerAgencyPage from "../services/tours/PartnerAgencyPage.view";
import PartnerWorkspace from "./PartnerWorkspace";
import "./AgencyWorkspace.scss";

const PROFILE_VIEW = "profile";
const TEAM_VIEW = "team";

export default function AgencyWorkspace({
  user,
  auth,
  agencyApplication,
  agencyLoading,
  onApplyAgency,
  fetchAgency,
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const isPartnerAdmin = user?.agencyRole === "partner_admin";
  const requestedView = searchParams.get("view");
  const activeView = isPartnerAdmin && requestedView === TEAM_VIEW ? TEAM_VIEW : PROFILE_VIEW;
  const agency = agencyApplication?.agency || agencyApplication || {};
  const agencyName =
    agency.agencyName || agency.name || user?.agencyName || user?.partnerAgencyName || "Your agency";
  const agencyStatus = agency.status || (user?.agencyId ? "approved" : "pending");

  const views = useMemo(
    () => [
      {
        id: PROFILE_VIEW,
        label: "Agency profile",
        description: "Identity, product access and business details",
        icon: "building2",
      },
      ...(isPartnerAdmin
        ? [
            {
              id: TEAM_VIEW,
              label: "Team",
              description: "Agents, invitations and account access",
              icon: "usersRound",
            },
          ]
        : []),
    ],
    [isPartnerAdmin],
  );

  const selectView = (view) => {
    const next = new URLSearchParams(searchParams);
    next.set("view", view);
    setSearchParams(next, { replace: true });
  };

  return (
    <section className="agency-workspace">
      <header className="agency-workspace__hero">
        <div className="agency-workspace__hero-copy">
          <p>Partner workspace</p>
          <h1>Agency Workspace</h1>
          <span>Manage your agency identity, product access and team from one place.</span>
        </div>
        <div className="agency-workspace__identity">
          <span className="agency-workspace__identity-icon" aria-hidden="true">
            <Icon name="building2" size={22} />
          </span>
          <div>
            <strong>{agencyName}</strong>
            <StatusBadge value={agencyStatus} size="sm" />
          </div>
        </div>
      </header>

      <nav className="agency-workspace__switcher" aria-label="Agency workspace sections">
        {views.map((view) => (
          <button
            key={view.id}
            type="button"
            className={activeView === view.id ? "is-active" : ""}
            onClick={() => selectView(view.id)}
            aria-current={activeView === view.id ? "page" : undefined}
          >
            <span aria-hidden="true">
              <Icon name={view.icon} size={20} />
            </span>
            <span>
              <strong>{view.label}</strong>
              <small>{view.description}</small>
            </span>
          </button>
        ))}
      </nav>

      <div className="agency-workspace__panel">
        {activeView === TEAM_VIEW ? (
          <PartnerWorkspace tab="agents" user={user} embedded />
        ) : (
          <PartnerAgencyPage
            agencyApplication={agencyApplication}
            agencyLoading={agencyLoading}
            auth={auth}
            onApplyAgency={onApplyAgency}
            fetchAgency={fetchAgency}
            embedded
          />
        )}
      </div>
    </section>
  );
}
