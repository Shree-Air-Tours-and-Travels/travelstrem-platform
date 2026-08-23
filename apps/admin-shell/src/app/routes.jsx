import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { buildGlobalAuthUrl } from "@packages/trem-utils";
import ManageTours from "../features/tours/ManageTours";
import TourBuilderPage from "../features/tours/TourBuilderPage";
import ManageClients from "../features/clients/ManageClients";
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
        <Route path="/manage/tours/builder" element={<TourBuilderPage />} />
        <Route path="/manage/tours/:tourId/edit" element={<TourBuilderPage mode="edit" />} />
        <Route path="/manage/tours/:tourId/view" element={<TourBuilderPage mode="view" />} />
        <Route path="/manage/trips" element={<ManageTours session={session} tab="trips" />} />
        <Route path="/admin/tours" element={<ManageTours session={session} />} />
        <Route path="/admin/trips" element={<ManageTours session={session} tab="trips" />} />
        <Route path="/admin/agencies" element={<ManageTours session={session} />} />
        <Route path="/admin/clients" element={<ManageClients session={session} />} />
        <Route
          path="/admin/bookings"
          element={<Navigate to="/manage/tours?tab=enquiries" replace />}
        />
        <Route
          path="/manage/bookings"
          element={<Navigate to="/manage/tours?tab=enquiries" replace />}
        />
        <Route path="/manage/clients" element={<ManageClients session={session} />} />
        <Route path="*" element={<Navigate to="/manage/tours" replace />} />
      </Routes>
    </>
  );
};

export default Routers;
