import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { buildGlobalAuthUrl } from "@packages/trem-utils";
import ManageTours from "../features/services/tours/ManageTours";
import ServicesContainer from "../features/services/container";
import BookingDetail from "../features/bookings/tours/BookingDetail/BookingDetail";
import PartnerTrevioTrips from "../features/trevio/PartnerTrevioTrips";
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
                <Route path="/agent/services/*" element={session?.user?.productAccess?.includes("trevista") ? <ServicesContainer /> : <Navigate to="/agent/dashboard" replace />} />
                <Route path="/agent/profile" element={<ManageTours session={session} />} />
                <Route path="/agent/dashboard" element={<ManageTours session={session} />} />
                <Route path="/agent/agents" element={<ManageTours session={session} />} />
                <Route path="/agent/customers" element={<ManageTours session={session} />} />
                <Route path="/agent/reports" element={<ManageTours session={session} />} />
                <Route path="/agent/deletion-requests" element={<ManageTours session={session} />} />
                <Route path="/agent/notifications" element={<ManageTours session={session} />} />
                <Route path="/agent/partner-agency" element={<ManageTours session={session} />} />
                <Route path="/agent/bookings" element={<ManageTours session={session} />} />
                <Route path="/agent/settings" element={<ManageTours session={session} />} />
                <Route path="/agent/trevio/trips" element={<PartnerTrevioTrips session={session} />} />
                <Route path="/bookings/:bookingId" element={<BookingDetail />} />
                <Route path="*" element={<Navigate to="/agent/dashboard" replace />} />
            </Routes>
        </>
    );
};

export default Routers;
