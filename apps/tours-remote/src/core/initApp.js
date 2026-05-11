import { initEventBus } from "./eventBus";
import { initUserSession } from "../services/userSession";
import { getHeaderConfig } from "../services/configService";

export const initApp = async (params = {}) => {
    initEventBus();
    const session = await initUserSession(params);
    const header = await getHeaderConfig({
        ...params,
        isAuthenticated: session?.isAuthenticated ? "true" : "false",
        role: session?.user?.role || "public",
        userName: session?.user?.name || "",
        userEmail: session?.user?.email || "",
    });

    return {
        session,
        header,
        pageConfig: session?.config?.pageConfig || { page: "tours", widgets: [] },
    };
};
