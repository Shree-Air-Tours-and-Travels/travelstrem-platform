import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { TourDetailsPage } from "@packages/trem-ui";

import { buildGlobalAuthUrl } from "@packages/trem-utils";
import ManageTours from "../features/tours/ManageTours";
import TourBuilderPage from "../features/tours/TourBuilderPage";
import { useAdminPortalConfig } from "./providers/AdminPortalProvider";

const adminRoles = ["admin"];
const isAllowedAdminRole = (session) => adminRoles.includes(session?.user?.role);
const tourDetailsProps = {
  appKey: "manage",
  breadcrumbRoot: { label: "AdminTREM", path: "/manage/tours" },
};

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
        <Route
          path="/manage/tours/:tourRef/view"
          element={<TourDetailsPage {...tourDetailsProps} />}
        />
        <Route path="/manage/tours/:tourRef" element={<TourDetailsPage {...tourDetailsProps} />} />
        <Route
          path="/manage/trips"
          element={<Navigate to="/manage/tours?tab=services" replace />}
        />
        <Route
          path="/admin/tours"
          element={<Navigate to="/manage/tours?tab=services" replace />}
        />
        <Route
          path="/admin/trips"
          element={<Navigate to="/manage/tours?tab=services" replace />}
        />
        <Route
          path="/admin/agencies"
          element={<Navigate to="/manage/tours?tab=tenancy" replace />}
        />
        <Route
          path="/admin/clients"
          element={<Navigate to="/manage/tours?tab=clients" replace />}
        />
        <Route
          path="/admin/bookings"
          element={<Navigate to="/manage/tours?tab=enquiries" replace />}
        />
        <Route
          path="/manage/bookings"
          element={<Navigate to="/manage/tours?tab=enquiries" replace />}
        />
        <Route
          path="/manage/clients"
          element={<Navigate to="/manage/tours?tab=clients" replace />}
        />
        <Route path="*" element={<Navigate to="/manage/tours" replace />} />
      </Routes>
    </>
  );
};

export default Routers;
