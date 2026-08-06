import React from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import { AuthPage } from "@apps/auth";
import ManageTours from "../features/services/tours/ManageTours";
import ServicesContainer from "../features/services/container";
import BookingDetail from "../features/bookings/tours/BookingDetail/BookingDetail";
import PartnerTrevioTrips from "../features/trevio/PartnerTrevioTrips";
import { useAgentPortalConfig, isAllowedAgentRole } from "./providers/AgentPortalProvider";
import api from "../services/apiClient";
import authService from "../services/authService";
import { emit } from "@packages/trem-events";

const agentRoles = ["agent"];

const Routers = ({ theme = "light", onToggleTheme }) => {
    const location = useLocation();
    const { loading, session, reload } = useAgentPortalConfig();
    const fromLocation = location.state?.from;
    const afterAuthPath = fromLocation
        ? `${fromLocation.pathname || "/agent/dashboard"}${fromLocation.search || ""}${fromLocation.hash || ""}`
        : "/agent/dashboard";

    const accessError = session?.isAuthenticated && !isAllowedAgentRole(session)
        ? "This account does not have PartnerTREM access. Use the email address from your agency invitation."
        : "";
    const agentAuthPage = (
        <AuthPage
            api={api}
            authService={authService}
            emit={emit}
            reload={reload}
            appName="PartnerTREM"
            authStoragePrefix="agentTREM"
            allowedRoles={agentRoles}
            roleOptions={[
                {
                    value: "agent",
                    title: "Partner Admin or Agent",
                    subtitle: "Manage assigned bookings, quotes, product inventory, and agency operations",
                    descriptor: "Operations",
                    requiresSecret: false,
                },
            ]}
            defaultRole="agent"
            afterAuthPath={afterAuthPath}
            otpLoginEnabled
            registerEnabled={false}
            theme={theme}
            onToggleTheme={onToggleTheme}
            headerBrand={{
                name: "PartnerTREM",
                tagline: "Agency Operations · Trips · Agents · Bookings",
            }}
            companyContent={{
                eyebrow: "PARTNER WITH TRAVELSTREM",
                title: "Run your travel business from one secure workspace.",
                description: "Manage your agency's products, agents, customers and bookings with",
                descriptionHighlight: "PartnerTREM by TravelsTREM.",
                highlights: [
                    { icon: "map", title: "Product operations", description: "Create and manage the trips enabled for your agency." },
                    { icon: "usersRound", title: "Controlled team access", description: "Invite agents and delegate only the permissions they need." },
                    { icon: "calendar", title: "Agency-owned bookings", description: "Track customers, assignments and booking activity in one place." },
                ],
                businessName: "TravelsTREM Partner Network",
                location: "Secure multi-tenant workspace",
            }}
            formNotice={accessError}
            skipExistingSessionRedirect={Boolean(accessError)}
        />
    );

    if (loading) return null;

    if (!session?.isAuthenticated || !isAllowedAgentRole(session)) {
        return (
            <Routes>
                <Route path="*" element={agentAuthPage} />
            </Routes>
        );
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
