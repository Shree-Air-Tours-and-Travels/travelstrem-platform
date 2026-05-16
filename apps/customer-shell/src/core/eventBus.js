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
        dispatchWindowEvent: "when-no-listeners",
    });
