import React, { useCallback } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import TourBuilder from "@packages/tour-builder";
import { uploadTourImage } from "../../services/adminService";
import AdminRouteFrame from "../../app/AdminRouteFrame";

const uploader = {
  upload: async (files) => Promise.all(files.map((file) => uploadTourImage(file))),
};

export default function TourBuilderPage({ mode = "create" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { tourId: routeTourId } = useParams();
  const query = new URLSearchParams(location.search);
  const tourId = routeTourId || query.get("tourId") || null;
  const startStepKey =
    mode === "view" ? "review" : query.get("step") || (mode === "edit" ? "resume" : null);
  const exit = useCallback(() => navigate("/manage/tours?tab=services"), [navigate]);
  const syncBuilderLocation = useCallback(
    ({ tourId: nextTourId, stepKey }) => {
      const params = new URLSearchParams(location.search);
      if (nextTourId && !routeTourId) params.set("tourId", nextTourId);
      else params.delete("tourId");
      if (stepKey) params.set("step", stepKey);
      else params.delete("step");
      const nextSearch = params.toString();
      const nextUrl = `${location.pathname}${nextSearch ? `?${nextSearch}` : ""}`;
      const currentUrl = `${location.pathname}${location.search}`;
      if (nextUrl !== currentUrl) navigate(nextUrl, { replace: true });
    },
    [location.pathname, location.search, navigate, routeTourId],
  );

  return (
    <AdminRouteFrame
      activeId="services"
      currentLabel={mode === "edit" ? "Edit tour" : "Create tour"}
      backLabel="Back to travel products"
      backTarget="/manage/tours?tab=services"
      pageClassName="admin-dashboard-shell__page--builder"
    >
      <TourBuilder
        mode={mode}
        tourId={tourId}
        startStepKey={startStepKey}
        onLocationChange={syncBuilderLocation}
        onExit={exit}
        onComplete={() => navigate("/manage/tours?tab=services")}
        uploader={uploader}
      />
    </AdminRouteFrame>
  );
}
