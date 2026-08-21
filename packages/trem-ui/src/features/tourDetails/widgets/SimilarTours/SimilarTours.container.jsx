import React from "react";
import { useNavigate } from "react-router-dom";
import useTourDetailWidget from "../../hooks/useTourDetailWidget";
import { slugifyTitle } from "../../helper";
import { WidgetError, WidgetSkeleton } from "../../shared";
import SimilarToursView from "./SimilarTours.view";

export default function SimilarToursContainer({ tourRef, isFavorited, onFavorite, appKey = "trevista" }) {
  const navigate = useNavigate();
  const { loading, error, widgetData } = useTourDetailWidget(tourRef, "similar-tours.json");
  const labels = widgetData?.elements?.labels || {};
  const tours = Array.isArray(widgetData?.data?.tours) ? widgetData.data.tours : [];

  const handleView = (tour) => {
    const ref = tour?.slug || tour?._id || tour?.id || slugifyTitle(tour?.title);
    if (!ref) return;
    navigate(`/${appKey}/tours/${encodeURIComponent(ref)}`, { state: { tour } });
  };

  if (loading) return <WidgetSkeleton compact />;
  if (error) return <WidgetError message={error} />;
  return <SimilarToursView labels={labels} tours={tours} onView={handleView} isFavorited={isFavorited} onFavorite={onFavorite} />;
}
