import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { buildGlobalAuthUrl } from "@packages/trem-utils";
import ManageTours from "../features/services/tours/ManageTours";
import ServicesContainer from "../features/services/container";
import PartnerTrevioTrips from "../features/trevio/PartnerTrevioTrips";
import { AgentAdminBookingJourney } from "@apps/booking-engine";
import AgentSupportPage from "../features/support/AgentSupportPage";
import { useAgentPortalConfig, isAllowedAgentRole } from "./providers/AgentPortalProvider";

const Routers = () => {
  const { loading, session } = useAgentPortalConfig();

  if (loading) return null;

  if (!session?.isAuthenticated || !isAllowedAgentRole(session)) {
    window.location.replace(buildGlobalAuthUrl({ app: "partner", returnTo: window.location.href }));
    return null;
  }

  return (
    <>
      <Routes>
        <Route
          path="/agent/services/*"
          element={
            session?.user?.productAccess?.includes("trevista") ? (
              <ServicesContainer />
            ) : (
              <Navigate to="/agent/dashboard" replace />
            )
          }
        />
        <Route path="/agent/profile" element={<ManageTours session={session} />} />
        <Route path="/agent/dashboard" element={<ManageTours session={session} />} />
        <Route path="/agent/agency" element={<ManageTours session={session} />} />
        <Route path="/agent/agents" element={<Navigate to="/agent/agency?view=team" replace />} />
        <Route path="/agent/customers" element={<ManageTours session={session} />} />
        <Route path="/agent/enquiries/*" element={<AgentAdminBookingJourney />} />
        <Route path="/agent/bookings/*" element={<AgentAdminBookingJourney />} />
        <Route path="/agent/support" element={<AgentSupportPage />} />
        <Route path="/agent/reports" element={<ManageTours session={session} />} />
        <Route path="/agent/deletion-requests" element={<ManageTours session={session} />} />
        <Route path="/agent/notifications" element={<ManageTours session={session} />} />
        <Route
          path="/agent/partner-agency"
          element={<Navigate to="/agent/agency?view=profile" replace />}
        />
        <Route path="/agent/settings" element={<ManageTours session={session} />} />
        <Route path="/agent/trevio/trips" element={<PartnerTrevioTrips session={session} />} />
        <Route path="*" element={<Navigate to="/agent/dashboard" replace />} />
      </Routes>
    </>
  );
};

export default Routers;
