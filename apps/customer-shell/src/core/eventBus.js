export {
    emit,
    on,
    registerAuthHeaderClearer,
    registerSessionCacheClearer,
} from "@packages/trem-events";

import { initEventBus as initSharedEventBus } from "@packages/trem-events";

export const initEventBus = () =>
    initSharedEventBus({
        clearSessionOnLogout: true,
        dispatchWindowEvent: "when-no-listeners",
    });
