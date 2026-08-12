import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { buildGlobalAuthUrl } from "@packages/trem-utils";
import ManageTours from "../features/tours/ManageTours";
import ManageClients from "../features/clients/ManageClients";
import BookingDetail from "../features/tours/BookingDetail/BookingDetail";
import { useAdminPortalConfig } from "./providers/AdminPortalProvider";

const adminRoles = ["admin"];
const isAllowedAdminRole = (session) => adminRoles.includes(session?.user?.role);

const Routers = () => {
    const { loading, session } = useAdminPortalConfig();

    if (loading) return null;

    if (!session?.isAuthenticated || !isAllowedAdminRole(session)) {
        window.location.replace(buildGlobalAuthUrl({ app: "admin", returnTo: window.location.href }));
        return null;
    }

    return (
        <>
            <Routes>
                <Route path="/manage/tours" element={<ManageTours session={session} />} />
                <Route path="/manage/trips" element={<ManageTours session={session} tab="trips" />} />
                <Route path="/admin/tours" element={<ManageTours session={session} />} />
                <Route path="/admin/trips" element={<ManageTours session={session} tab="trips" />} />
                <Route path="/admin/agencies" element={<ManageTours session={session} />} />
                <Route path="/admin/clients" element={<ManageClients session={session} />} />
                <Route path="/manage/clients" element={<ManageClients session={session} />} />
                <Route path="/bookings/:bookingId" element={<BookingDetail />} />
                <Route path="*" element={<Navigate to="/manage/tours" replace />} />
            </Routes>
        </>
    );
};

export default Routers;
