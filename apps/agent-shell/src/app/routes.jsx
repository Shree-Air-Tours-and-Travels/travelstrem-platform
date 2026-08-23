import React from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import { AuthPage } from "@apps/auth";
import ManageTours from "../features/services/tours/ManageTours";
import ServicesContainer from "../features/services/container";
import BookingDetail from "../features/bookings/tours/BookingDetail/BookingDetail";
import { useAgentPortalConfig, isAllowedAgentRole } from "./providers/AgentPortalProvider";
import api from "../services/apiClient";
import authService from "../services/authService";
import { emit } from "@packages/trem-events";

const agentRoles = ["agent"];

const Routers = () => {
    const location = useLocation();
    const { loading, session, reload } = useAgentPortalConfig();
    const fromLocation = location.state?.from;
    const afterAuthPath = fromLocation
        ? `${fromLocation.pathname || "/agent/profile"}${fromLocation.search || ""}${fromLocation.hash || ""}`
        : "/agent/profile";

    const agentAuthPage = (
        <AuthPage
            api={api}
            authService={authService}
            emit={emit}
            reload={reload}
            appName="Partner Portal"
            authStoragePrefix="agentTREM"
            allowedRoles={agentRoles}
            roleOptions={[
                {
                    value: "agent",
                    title: "Partner",
                    subtitle: "Manage assigned bookings, quotes, product inventory, and agency operations",
                    descriptor: "Operations",
                    requiresSecret: false,
                },
            ]}
            defaultRole="agent"
            afterAuthPath={afterAuthPath}
            otpLoginEnabled
        />
    );

    const agentAuthGuard = session?.isAuthenticated && !isAllowedAgentRole(session) ? (
        <div className="agent-auth-page">
            <div className="agent-auth-page__notice">This account does not have Partner Portal access.</div>
            {agentAuthPage}
        </div>
    ) : null;

    if (loading) return null;

    if (!session?.isAuthenticated || !isAllowedAgentRole(session)) {
        return (
            <Routes>
                <Route path="*" element={agentAuthGuard || agentAuthPage} />
            </Routes>
        );
    }

    return (
        <>
            <Routes>
                <Route path="/agent/services/*" element={<ServicesContainer />} />
                <Route path="/agent/profile" element={<ManageTours session={session} />} />
                <Route path="/agent/partner-agency" element={<ManageTours session={session} />} />
                <Route path="/agent/bookings" element={<ManageTours session={session} />} />
                <Route path="/agent/settings" element={<ManageTours session={session} />} />
                <Route path="/bookings/:bookingId" element={<BookingDetail />} />
                <Route path="*" element={<Navigate to="/agent/profile" replace />} />
            </Routes>
        </>
    );
};

export default Routers;
