import { initEventBus } from "@packages/trem-events";
import { createInitApp } from "@packages/trem-runtime";
import { PRODUCT_TYPE } from "@packages/trem-ui";
import { getHeaderConfig } from "../services/configService.js";
import { initUserSession } from "../services/userSession.js";

export const initApp = createInitApp({
  initEventBus,
  initUserSession,
  getHeaderConfig,
  defaultPage: PRODUCT_TYPE.TREHUB,
});
