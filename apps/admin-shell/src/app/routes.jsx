import React from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import { AuthPage } from "@apps/auth";
import ManageTours from "../features/tours/ManageTours";
import BookingDetail from "../features/tours/BookingDetail/BookingDetail";
import { ScrollToTop } from "@packages/trem-ui";
import { useAdminPortalConfig } from "./providers/AdminPortalProvider";
import api from "../services/apiClient";
import authService from "../services/authService";
import { emit } from "@packages/trem-events";

const adminRoles = ["admin"];
const isAllowedAdminRole = (session) => adminRoles.includes(session?.user?.role);

const Routers = () => {
    const location = useLocation();
    const { loading, session, reload } = useAdminPortalConfig();
    const fromLocation = location.state?.from;
    const afterAuthPath = fromLocation
        ? `${fromLocation.pathname || "/manage/tours"}${fromLocation.search || ""}${fromLocation.hash || ""}`
        : "/manage/tours";

    const adminAuthPage = (
        <AuthPage
            api={api}
            authService={authService}
            emit={emit}
            reload={reload}
            appName="AdminTREM"
            authStoragePrefix="adminTREM"
            allowedRoles={adminRoles}
            roleOptions={[
                {
                    value: "admin",
                    title: "Admin",
                    subtitle: "Request admin access or bootstrap master admin",
                    descriptor: "Platform",
                    requiresSecretForEmail: process.env.REACT_APP_MASTER_ADMIN_EMAIL || "",
                },
            ]}
            defaultRole="admin"
            afterAuthPath={afterAuthPath}
            otpLoginEnabled
        />
    );

    const adminAuthGuard = session?.isAuthenticated && !isAllowedAdminRole(session) ? (
        <div className="admin-auth-page">
            <div className="admin-auth-page__notice">This account does not have AdminTREM access.</div>
            {adminAuthPage}
        </div>
    ) : null;

    if (loading) return null;

    if (!session?.isAuthenticated || !isAllowedAdminRole(session)) {
        return (
            <Routes>
                <Route path="*" element={adminAuthGuard || adminAuthPage} />
            </Routes>
        );
    }

    return (
        <>
            <ScrollToTop />
            <Routes>
                <Route path="/manage/tours" element={<ManageTours session={session} />} />
                <Route path="/manage/trips" element={<ManageTours session={session} tab="trips" />} />
                <Route path="/admin/tours" element={<ManageTours session={session} />} />
                <Route path="/admin/trips" element={<ManageTours session={session} tab="trips" />} />
                <Route path="/admin/agencies" element={<ManageTours session={session} />} />
                <Route path="/bookings/:bookingId" element={<BookingDetail />} />
                <Route path="*" element={<Navigate to="/manage/tours" replace />} />
            </Routes>
        </>
    );
};

export default Routers;
