export const createInitApp = ({ initEventBus, initUserSession, getHeaderConfig, defaultPage }) => {
  const fallbackPageConfig = { page: defaultPage, widgets: [] };

  return async (params = {}) => {
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
      pageConfig: session?.config?.pageConfig || fallbackPageConfig,
    };
  };
};
