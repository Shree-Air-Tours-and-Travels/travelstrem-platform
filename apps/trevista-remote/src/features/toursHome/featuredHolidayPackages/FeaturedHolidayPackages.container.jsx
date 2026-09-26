import React from "react";
import { useFavoritesContext } from "@packages/trem-ui";
import { useNavigate } from "react-router-dom";
import FeaturedHolidayPackagesView from "./FeaturedHolidayPackages.view";
import useFeaturedHolidayPackages from "./hooks/useFeaturedHolidayPackages";
import { mapHolidayPackagesToDestinationCards } from "./mappers/mapHolidayPackageToDestinationCard";

export default function FeaturedHolidayPackages({ widgetData, onTourEnquiry }) {
  const navigate = useNavigate();
  const labels = widgetData?.elements?.labels || {};
  const urls = widgetData?.elements?.urls || {};
  const widgetProps = widgetData?.structure?.widgets?.[0]?.props || {};
  const configuredActions = widgetData?.structure?.actions || [];

  const eyebrow = labels.eyebrow || "";
  const title = labels.title || "Featured holiday packages";
  const description = labels.description || "";
  const viewAllLabel = labels.viewAllLabel || "View all packages";
  const viewAllHref = urls.viewAllUrl || widgetProps.viewAllHref || "/trevista/tours";

  const limit = Number(widgetProps.limit) || 4;
  const columns = Number(widgetProps.columns) || Math.min(limit, 4);
  const horizontal = widgetProps.horizontal !== false;

  const cardProps = {
    variant: widgetProps.cardVariant || "overlay",
    size: widgetProps.cardSize || "large",
    aspectRatio: widgetProps.cardAspectRatio || "landscape",
    overlay: widgetProps.cardOverlay || "strong",
  };

  const { packages, loading, error, retry } = useFeaturedHolidayPackages(
    widgetData?.data?.packages,
  );
  const destinations = mapHolidayPackagesToDestinationCards(packages, { limit }).map(
    ({ href, ...destination }) => ({ ...destination, navigationHref: href }),
  );
  const resolvedColumns = loading
    ? Math.min(columns, 4)
    : Math.min(Math.max(destinations.length, 1), columns, 4);
  const emptyActions = configuredActions
    .map((action) => ({
      ...action,
      label: labels[action.labelRef] || "",
      onClick: action.behavior === "openTourEnquiry" ? onTourEnquiry : undefined,
    }))
    .filter((action) => action.label);

  const { isFavorited, toggleFavorite } = useFavoritesContext();

  const handleFavorite = (card) => {
    const raw = (Array.isArray(packages) ? packages : []).find(
      (pkg) => (pkg._id || pkg.id) === card.id,
    );
    if (raw) toggleFavorite(raw);
  };

  return (
    <FeaturedHolidayPackagesView
      eyebrow={eyebrow}
      title={title}
      description={description}
      viewAllLabel={viewAllLabel}
      viewAllHref={viewAllHref}
      destinations={destinations}
      loading={loading}
      error={error}
      onRetry={retry}
      columns={resolvedColumns}
      horizontal={horizontal}
      cardProps={cardProps}
      isFavorited={(card) => isFavorited({ _id: card.id })}
      onFavorite={handleFavorite}
      onCardClick={(card) => card.navigationHref && navigate(card.navigationHref)}
      emptyActions={emptyActions}
    />
  );
}
