import React from "react";
import ReviewWidgetView from "./ReviewWidget.view";

const getReviews = ({ reviews, tour, data }) => {
  if (Array.isArray(reviews)) return reviews;
  if (Array.isArray(tour?.reviews)) return tour.reviews;
  if (Array.isArray(data?.reviews)) return data.reviews;
  return [];
};

export default function ReviewWidgetContainer({
  reviews,
  tour,
  data,
  limit = 4,
  emptyText = "No guest reviews yet.",
}) {
  const items = getReviews({ reviews, tour, data }).slice(0, limit);
  return <ReviewWidgetView items={items} emptyText={emptyText} />;
}
