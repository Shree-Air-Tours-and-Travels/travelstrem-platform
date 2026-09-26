import React from "react";
import { createWidgetDefinition, createWidgetRegistry } from "@packages/trem-widget-contracts";
import ToursTabWidget from "../../features/tours/ToursTabWidget.view";
import AgenciesTabWidget from "../../features/tours/AgenciesTabWidget.view";
import TripsTabWidget from "../../features/trips/TripsTabWidget.view";

const adminShellWidgetDefinitions = [
  createWidgetDefinition({
    type: "AdminTourManagement",
    aliases: ["admin.tours", "tours"],
    component: ToursTabWidget,
  }),
  createWidgetDefinition({
    type: "AdminTripManagement",
    aliases: ["admin.trips", "trips"],
    component: TripsTabWidget,
  }),
  createWidgetDefinition({
    type: "AgencyManagement",
    aliases: ["admin.agencies", "agencies"],
    component: AgenciesTabWidget,
  }),
];

export const adminWidgetRegistry = createWidgetRegistry(adminShellWidgetDefinitions);
