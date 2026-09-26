import React from "react";
import { createWidgetDefinition, createWidgetRegistry } from "@packages/trem-widget-contracts";
import ProfilePage from "../../features/services/tours/ProfilePage.view";
import PartnerAgencyPage from "../../features/services/tours/PartnerAgencyPage.view";
import SettingsPage from "../../features/services/tours/SettingsPage.view";
import AgentWorkspaceSidebar from "../../features/services/tours/AgentWorkspaceSidebar.view";

const agentShellWidgetDefinitions = [
  createWidgetDefinition({
    type: "AgentProfile",
    aliases: ["agent.profile", "profile"],
    component: ProfilePage,
  }),
  createWidgetDefinition({
    type: "AgentPartnerAgency",
    aliases: ["agent.partnerAgency", "partnerAgency"],
    component: PartnerAgencyPage,
  }),
  createWidgetDefinition({
    type: "AgentSettings",
    aliases: ["agent.settings", "settings"],
    component: SettingsPage,
  }),
  createWidgetDefinition({
    type: "AgentWorkspaceSidebar",
    aliases: ["agent.sidebar"],
    component: AgentWorkspaceSidebar,
  }),
];

export const agentWidgetRegistry = createWidgetRegistry(agentShellWidgetDefinitions);
