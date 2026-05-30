import React from "react";
import { createWidgetDefinition, createWidgetRegistry } from "@packages/trem-widget-contracts";
import AdminDashboard from "../../features/dashboard/Dashboard";
import ToursTabWidget from "../../features/tours/ToursTabWidget.view";
import AgenciesTabWidget from "../../features/tours/AgenciesTabWidget.view";

const adminShellWidgetDefinitions = [
    createWidgetDefinition({
        type: "AdminDashboard",
        aliases: ["admin.dashboard", "dashboard"],
        component: AdminDashboard,
    }),
    createWidgetDefinition({
        type: "AdminTourManagement",
        aliases: ["admin.tours", "tours"],
        component: ToursTabWidget,
    }),
    createWidgetDefinition({
        type: "AgencyManagement",
        aliases: ["admin.agencies", "agencies"],
        component: AgenciesTabWidget,
    }),
];

export const adminWidgetRegistry = createWidgetRegistry(adminShellWidgetDefinitions);
