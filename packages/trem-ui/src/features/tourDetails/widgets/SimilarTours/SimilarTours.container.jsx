import React from "react";
import { useNavigate } from "react-router-dom";
import useTourDetailWidget from "../../hooks/useTourDetailWidget";
import { getDisplayText, slugifyTitle } from "../../helper";
import { WidgetError, WidgetSkeleton } from "../../shared";
import SimilarToursView from "./SimilarTours.view";
import { PRODUCT_TYPE } from "../../../../constants/productTypes.js";

export default function SimilarToursContainer({
  tourRef,
  isFavorited,
  onFavorite,
  appKey = PRODUCT_TYPE.TREVISTA,
  showEmpty = false,
}) {
  const navigate = useNavigate();
  const { loading, error, widgetData, retry } = useTourDetailWidget(tourRef, "similar-tours.json");
  const labels = widgetData?.elements?.labels || {};
  const tours = Array.isArray(widgetData?.data?.tours) ? widgetData.data.tours : [];

  const handleView = (tour) => {
    const ref =
      getDisplayText(tour?.slug) ||
      getDisplayText(tour?.tourRef) ||
      slugifyTitle(tour?.title || tour?.name) ||
      getDisplayText(tour?._id || tour?.id);
    if (!ref) return;
    navigate(`/${appKey}/tours/${encodeURIComponent(ref)}`, { state: { tour } });
  };

  if (loading) return <WidgetSkeleton compact />;
  if (error) return <WidgetError message={error} retry={retry} />;
  return (
    <SimilarToursView
      labels={labels}
      tours={tours}
      onView={handleView}
      isFavorited={isFavorited}
      onFavorite={onFavorite}
      showEmpty={showEmpty}
    />
  );
}
