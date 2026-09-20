import React from "react";
import HotelFiltersContainer from "./container/HotelFilters.container.jsx";

export default function HotelFilters({ userSession }) {
  return <HotelFiltersContainer userSession={userSession} />;
}
