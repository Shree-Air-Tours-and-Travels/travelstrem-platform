import React from "react";
import { FavoritesProvider, ProductHeader, GlobalLoader, Footer, ScrollToTopButton, useTheme, useFavoritesContext } from "@packages/trem-ui";
import AppRoutes from "./routes";
import { initApp } from "../core/initApp";
import "../main.scss";
import { redirectToGlobalAuth, setComponentDataFetcher, fetchData, createProductAuth, buildGlobalDashboardUrl } from "@packages/trem-utils";
import { emit, registerSessionCacheClearer } from "@packages/trem-events";
import { consumeUrlToken, appendTokenToUrl } from "@packages/trem-auth-core";
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
    const items = menu.map((item) => {
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
    }).filter((item) => item.label);
    if (!hasActive && items.length) items[0].active = true;
    return items;
};

function AppHeader({ headerConfig, state, navItems, activeTab, authAction, brand }) {
    const { favoritesCount } = useFavoritesContext();
    const { theme, toggleTheme } = useTheme();

    return (
        <ProductHeader
            brand={{
                ...brand,
                logoSrc: "/favicon.svg",
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
                href: appendTokenToUrl(buildGlobalDashboardUrl({ product: "trevista" }), localStorage.getItem("travelstrem:token") || null),
            }}
            profile={{
                label: state.session?.user?.name || brand.label || "Dashboard",
                href: appendTokenToUrl(buildGlobalDashboardUrl({ product: "trevista" }), localStorage.getItem("travelstrem:token") || null),
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

    React.useEffect(() => {
        if (embedded) return undefined;

        consumeUrlToken({ token: "travelstrem:token" });

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
                    redirectToGlobalAuth({ app: "trevista" });
                }
            })
            .catch((error) => {
                if (!active) return;
                setState({ loading: false, error: error?.message || "init-app-failed", session: null, headerConfig: null });
            });

        return () => {
            active = false;
        };
    }, [embedded]);

    if (state.error) return <div className="app-status">Trevista initialization failed: {state.error}</div>;

    if (!embedded && state.loading) return <GlobalLoader visible text="Loading Trevista" />;

    if (!embedded && !state.session?.isAuthenticated) {
        return <div className="app-status">Redirecting to TravelsTrem secure login...</div>;
    }

    const headerConfig = state.headerConfig || {};
    const brand = headerConfig.brand || {
        label: "Trevista",
        subtitle: "by TravelsTrem",
        mark: "T",
    };
    const navItems = buildNavItemsFromConfig(headerConfig, window.location.pathname);
    const aboutUrl = process.env.REACT_APP_ABOUT_URL;
    if (aboutUrl) navItems.push({ id: "about", label: "About Us", href: aboutUrl, target: "_blank", rel: "noopener noreferrer" });
    const activeTab = navItems.find((item) => item.active)?.id || "";
    const authAction = buildAuthAction(headerConfig, state.session);

    return (
        <>
            <GlobalLoader visible={state.loading} />
            <div className={embedded ? "tours-app-shell tours-app-shell--embedded" : "tours-app-shell"}>
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
                    <AppRoutes dispatchEvent={dispatchEvent} embedded={embedded} userSession={userSession || state.session} />
                </FavoritesProvider>
                {!embedded && <Footer productName="Trevista · Holiday planning" />}
                <ScrollToTopButton />
            </div>
        </>
    );
}

export function TrevistaApp(props) {
    return <App {...props} />;
}

export default TrevistaApp;
