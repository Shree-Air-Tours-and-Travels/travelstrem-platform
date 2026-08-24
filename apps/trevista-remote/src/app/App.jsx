import React, { useEffect } from "react";
import {
  FavoritesProvider,
  ProductHeader,
  GlobalLoader,
  AppFooter,
  ScrollToTopButton,
  useTheme,
  useFavoritesContext,
  Toaster,
} from "@packages/trem-ui";
import AppRoutes from "./routes";
import { initApp } from "../core/initApp";
import "../main.scss";
import {
  redirectToGlobalAuth,
  setComponentDataFetcher,
  fetchData,
  createProductAuth,
  buildGlobalAppShellUrl,
  getCurrentReturnUrl,
} from "@packages/trem-utils";
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
  app: "trevista",
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
  let hasActive = false;
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
      const isActive = itemPath && normalizedPath === itemPath;
      if (isActive) hasActive = true;
      return {
        id: item.id || item.label,
        label: item.label,
        active: isActive,
        href: item.type === "external" ? item.href : item.path,
      };
    })
    .filter((item) => item.label);
  if (!hasActive && items.length) items[0].active = true;
  return items;
};

function AppHeader({ headerConfig, state, navItems, activeTab, authAction, brand }) {
  const { favoritesCount } = useFavoritesContext();
  const { theme, toggleTheme } = useTheme();
  const logoConfig = headerConfig.logos?.trevista || {};

  return (
    <ProductHeader
      brand={{
        ...brand,
        logoSrc: logoConfig.logoSrc || "",
        logoAlt: logoConfig.name || brand.label,
        href: "/trevista",
      }}
      navItems={navItems}
      activeTab={activeTab}
      theme={theme}
      onToggleTheme={toggleTheme}
      wishlist={{
        label: "Wishlist",
        ariaLabel: "Wishlist",
        icon: "heart",
        count: favoritesCount,
        href: buildGlobalAppShellUrl({ product: "trevista" }),
      }}
      profile={{
        label: state.session?.user?.name || brand.label || "Dashboard",
        href: buildGlobalAppShellUrl({ product: "trevista" }),
      }}
      authAction={authAction}
    />
  );
}

function App({ dispatchEvent, embedded = false, userSession = null }) {
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
      app: "trevista",
    })
      .then(({ session, header }) => {
        if (!active) return;
        setState({ loading: false, error: null, session, headerConfig: header });
        if (!session?.isAuthenticated) {
          redirectToGlobalAuth({ app: "trevista", returnTo: getCurrentReturnUrl() });
        }
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
    return <div className="app-status">Trevista initialization failed: {state.error}</div>;

  if (!embedded && state.loading) return <GlobalLoader visible text="Loading Trevista" />;

  if (!embedded && !state.session?.isAuthenticated) {
    return <div className="app-status">Redirecting to TravelsTrem secure login...</div>;
  }

  const headerConfig = state.headerConfig || {};
  const logoConfig = headerConfig.logos?.trevista || {};
  const brand = headerConfig.brand || {
    label: "Trevista",
    subtitle: "by TravelsTrem",
    mark: "T",
  };
  const navItems = buildNavItemsFromConfig(headerConfig, window.location.pathname);
  const aboutUrl = process.env.REACT_APP_ABOUT_URL;
  if (aboutUrl)
    navItems.push({
      id: "about",
      label: "About Us",
      href: aboutUrl,
      target: "_blank",
      rel: "noopener noreferrer",
    });
  const activeTab = navItems.find((item) => item.active)?.id || "";
  const authAction = buildAuthAction(headerConfig, state.session);

  return (
    <>
      <GlobalLoader visible={state.loading} />
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
          <AppFooter
            config={{
              ...(headerConfig.footer || {}),
              productName: "Trevista by TravelsTrem",
              description: "Holiday packages and customized travel planning.",
            }}
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
