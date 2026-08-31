import React, { useCallback } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import TourBuilder from "@packages/tour-builder";
import { PRODUCT_TYPE } from "@packages/trem-ui";
import { uploadTourImage } from "../../../services/agentService";

const uploader = {
  upload: async (files) => Promise.all(files.map((file) => uploadTourImage(file))),
};

export default function TourBuilderPage({ mode = "create" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { tourId: routeTourId } = useParams();
  const query = new URLSearchParams(location.search);
  const tourId = routeTourId || query.get("tourId") || null;
  const productKey = query.get("product") === PRODUCT_TYPE.TREVIO
    ? PRODUCT_TYPE.TREVIO
    : PRODUCT_TYPE.TREVISTA;
  const startStepKey =
    mode === "view" ? "review" : query.get("step") || (mode === "edit" ? "resume" : null);
  const exitTarget = productKey === PRODUCT_TYPE.TREVIO ? "/agent/trevio/trips" : "/agent/services/tours";
  const exit = useCallback(() => navigate(exitTarget), [exitTarget, navigate]);
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
    <TourBuilder
      mode={mode}
      productKey={productKey}
      tourId={tourId}
      startStepKey={startStepKey}
      onLocationChange={syncBuilderLocation}
      onExit={exit}
      onComplete={() => navigate(exitTarget)}
      uploader={uploader}
    />
  );
}
