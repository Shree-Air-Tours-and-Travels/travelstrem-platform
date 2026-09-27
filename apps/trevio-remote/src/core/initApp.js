import { initEventBus } from "@packages/trem-events";
import { createInitApp } from "@packages/trem-runtime";
import { PRODUCT_TYPE } from "@packages/trem-ui";
import { initUserSession } from "../services/userSession";
import { getHeaderConfig } from "../services/configService";

export const initApp = createInitApp({
  initEventBus,
  initUserSession,
  getHeaderConfig,
  defaultPage: PRODUCT_TYPE.TREVIO,
});
