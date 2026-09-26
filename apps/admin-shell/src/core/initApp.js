import { createInitApp } from "@packages/trem-runtime";
import { initEventBus } from "./eventBus";
import { initUserSession } from "../services/userSession";
import { getHeaderConfig } from "../services/configService";

export const initApp = createInitApp({
  initEventBus,
  initUserSession,
  getHeaderConfig,
  defaultPage: "admin",
});
