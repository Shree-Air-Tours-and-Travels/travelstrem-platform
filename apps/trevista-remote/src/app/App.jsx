import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FavoritesProvider,
  ProductHeader,
  GlobalLoader,
  PRODUCT_TYPE,
  ErrorState,
  ProductFooter,
  ScrollToTopButton,
  useTheme,
  Toaster,
} from "@packages/trem-ui";
import AppRoutes from "./routes";
import { initApp } from "../core/initApp";
import "../main.scss";
import { applyDocumentBranding, setComponentDataFetcher, fetchData, createProductAuth } from "@packages/trem-utils";
import {
  emit,
  registerSessionCacheClearer,
  initRealtimeNotifications,
  RealtimeProvider,
} from "@packages/trem-events";
import { API_BASE } from "../services/configService";
import { clearUserSessionCache } from "../services/userSession";

setComponentDataFetcher(fetchData);

const { buildAuthAction } = createProductAuth({
  app: PRODUCT_TYPE.TREVISTA,
  apiBase: API_BASE,
  emit,
  registerSessionCacheClearer,
  clearUserSessionCache,
});
const getPlatformUrl = () => {
  const host = window.location.hostname;
  const parts = host.split(".");
  if (parts.length > 2) return `https://${parts.slice(-2).join(".")}`;
  return "/";
};

const getProductUrl = (product) => {
  const platform = getPlatformUrl();
  if (platform === "/") return `/${product}`;
  return `${platform.replace(/\/$/, "")}/${product}`;
};

const buildNavItemsFromConfig = (headerConfig, currentPath) => {
  const menu = headerConfig?.menu || [];
  const normalizedPath = currentPath || "/";
  const activeItem = menu
    .filter((item) => item.type !== "dropdown" && item.path)
    .filter((item) => normalizedPath === item.path || normalizedPath.startsWith(`${item.path}/`))
    .sort((a, b) => b.path.length - a.path.length)[0];
  const items = menu
    .map((item) => {
      if (item.type === "dropdown") {
        return {
          id: item.id || item.label,
          type: "dropdown",
          label: item.label,
          items: (item.items || []).map((child) => ({
            id: child.id || child.label,
            label: child.label,
            description: child.description,
            icon: child.icon,
            href: child.href || getProductUrl(child.label?.toLowerCase()),
            target: child.target || "_self",
          })),
        };
      }
      const itemPath = item.path || "";
      const isActive = item === activeItem;
      return {
        id: item.id || item.label,
        label: item.label,
        active: isActive,
        href: item.type === "external" ? item.href : item.path,
        disabled: Boolean(item.disabled),
        type: item.type,
        target: item.target,
        rel: item.rel,
      };
    })
    .filter((item) => item.label);
  if (!activeItem && items.length) items[0].active = true;
  return items;
};

function AppHeader({ headerConfig, state, navItems, activeTab, authAction, brand }) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const logoConfig = headerConfig.logos?.trevista || {};
  const linkedNavItems = navItems.map((item) => ({
    ...item,
    onClick: item.disabled
      ? undefined
      : () => {
          if (item.type === "external") window.location.assign(item.href);
          else navigate(item.href);
        },
  }));
  const profileItems = [
    ...(headerConfig.accountNavigation || []).map((item) => ({
      ...item,
      onClick: () => window.location.assign(item.href),
    })),
    {
      id: "auth",
      label: authAction?.label || "Sign in",
      icon: state.session?.isAuthenticated ? "logout" : "user",
      onClick:
        authAction?.onClick ||
        (authAction?.href ? () => window.location.assign(authAction.href) : undefined),
    },
    {
      id: "theme",
      label: theme === "dark" ? "Light mode" : "Dark mode",
      icon: theme === "dark" ? "sun" : "moon",
      onClick: toggleTheme,
    },
  ];

  return (
    <ProductHeader
      brand={{
        ...brand,
        label: brand.label || logoConfig.name,
        subtitle: brand.subtitle || logoConfig.subtitle,
        logoSrc: brand.logoSrc || logoConfig.logoSrc || "",
        logoAlt: brand.label || logoConfig.name,
        href: "/trevista",
      }}
      navItems={linkedNavItems}
      linkTabs={{
        options: linkedNavItems,
        ariaLabel: "Trevista navigation",
        onSelect: (item) => item.onClick?.(),
      }}
      activeTab={activeTab}
      theme={theme}
      profile={{
        label: "Profile",
        displayName: state.session?.user?.name || "Guest",
        items: profileItems,
      }}
    />
  );
}

function App({ dispatchEvent, embedded = false, userSession = null }) {
  const location = useLocation();
  const [state, setState] = React.useState({
    loading: !embedded,
    error: null,
    session: null,
    headerConfig: null,
  });

  // Backend-authored realtime toasts (enquiry confirmations live here).
  useEffect(() => initRealtimeNotifications(), []);

  React.useEffect(() => {
    if (embedded) return undefined;

    let active = true;

    initApp({
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      app: PRODUCT_TYPE.TREVISTA,
    })
      .then(({ session, header }) => {
        if (!active) return;
        applyDocumentBranding(header.brand, { tenant: Boolean(header.tenantId) });
        setState({ loading: false, error: null, session, headerConfig: header });
      })
      .catch((error) => {
        if (!active) return;
        setState({
          loading: false,
          error: error?.message || "init-app-failed",
          session: null,
          headerConfig: null,
        });
      });

    return () => {
      active = false;
    };
  }, [embedded]);

  if (state.error)
    return (
      <ErrorState
        title="Trevista could not start"
        description="The tour experience is temporarily unavailable."
        error={state.error}
        retry={() => window.location.reload()}
      />
    );

  if (!embedded && state.loading) return <GlobalLoader visible text="Loading Trevista" />;

  const headerConfig = state.headerConfig || {};
  const logoConfig = headerConfig.logos?.trevista || {};
  const brand = headerConfig.brand || {
    label: "Trevista",
    subtitle: "by TravelsTrem",
    mark: "T",
  };
  const navItems = buildNavItemsFromConfig(headerConfig, location.pathname);
  const activeTab = navItems.find((item) => item.active)?.id || "";
  const authAction = buildAuthAction(headerConfig, state.session);

  return (
    <>
      <div className={embedded ? "tours-app-shell tours-app-shell--embedded" : "tours-app-shell"}>
        {/* Shared singleton client: when embedded in the shell, the shell's
                    provider already owns the connection and this is a no-op. */}
        <RealtimeProvider>
          <Toaster />
          <FavoritesProvider>
            {!embedded && (
              <AppHeader
                headerConfig={headerConfig}
                state={state}
                navItems={navItems}
                activeTab={activeTab}
                authAction={authAction}
                brand={brand}
              />
            )}
            <AppRoutes
              dispatchEvent={dispatchEvent}
              embedded={embedded}
              userSession={userSession || state.session}
            />
          </FavoritesProvider>
        </RealtimeProvider>
        {!embedded && (
          <ProductFooter
            tenantConfig={headerConfig.tenant?.footer}
            clientConfig={headerConfig.client?.footer}
            config={headerConfig.footer}
            tenantId={headerConfig.tenantId}
          />
        )}
        <ScrollToTopButton />
      </div>
    </>
  );
}

export function TrevistaApp(props) {
  return <App {...props} />;
}

export default TrevistaApp;
