import { initEventBus } from "@packages/trem-events";
import { createInitApp } from "@packages/trem-runtime";
import { initUserSession } from "../services/userSession";
import { getHeaderConfig } from "../services/configService";

export const initApp = createInitApp({
  initEventBus,
  initUserSession,
  getHeaderConfig,
  defaultPage: "trevista",
});
