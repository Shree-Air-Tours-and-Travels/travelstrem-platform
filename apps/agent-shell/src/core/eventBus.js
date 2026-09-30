import {
  emit,
  on,
  registerAuthHeaderClearer,
  registerSessionCacheClearer,
  initEventBus as initSharedEventBus,
} from "@packages/trem-events";

export { emit, on, registerAuthHeaderClearer, registerSessionCacheClearer };

export const initEventBus = () =>
  initSharedEventBus({
    clearSessionOnLogout: true,
    sessionStorageKeys: ["agentTREM:token", "agentTREM:auth_user", "agentTREM:remember_email"],
    dispatchWindowEvent: "when-no-listeners",
  });
