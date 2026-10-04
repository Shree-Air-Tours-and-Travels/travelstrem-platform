import React, { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import {
  ErrorState,
  LinkTabs,
  PRODUCT_TYPE,
  ConfiguredProductHeader,
  ProductFooter,
  GlobalLoader,
  ThemeProvider,
  useTheme,
} from "@packages/trem-ui";
import {
  applyDocumentBranding,
  buildGlobalAppShellUrl,
  createProductAuth,
} from "@packages/trem-utils";
import Home from "../views/home/Home.jsx";
import FlightFilters from "../views/home/flights/flightFilters/FlightFilters.jsx";
import FlightDetails from "../views/home/flights/flightDetails/FlightDetails.jsx";
import HotelFilters from "../views/home/hotels/hotelFilters/HotelFilters.jsx";
import HotelDetails from "../views/home/hotels/hotelDetails/HotelDetails.jsx";
import "../../main.scss";

import { initApp } from "../../core/initApp.js";
import { API_BASE, getHeaderConfig } from "../../services/configService.js";
import { clearUserSessionCache } from "../../services/userSession.js";
import { emit, registerSessionCacheClearer } from "@packages/trem-events";
const { buildAuthAction } = createProductAuth({
  app: PRODUCT_TYPE.TREHUB,
  apiBase: API_BASE,
  emit,
  registerSessionCacheClearer,
  clearUserSessionCache,
});

class TrehubRouteBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidUpdate(previousProps) {
    if (previousProps.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    if (this.state.error) {
      return (
        <ErrorState
          title="This section could not be displayed"
          description="Your dashboard is still available. Return to Trehub and try this action again."
          retry={() =>
            window.location.assign(
              buildGlobalAppShellUrl({ product: PRODUCT_TYPE.TREHUB, tab: PRODUCT_TYPE.TREHUB }),
            )
          }
          retryText="Back to Trehub"
        />
      );
    }
    return this.props.children;
  }
}

export default function App({ embedded = false, userSession }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { configuration } = useTheme();
  const services = configuration?.modules?.trehub;
  const defaultService = services?.includes("flights") || !services ? "flights" : services[0];
  const requestedService = /^\/trehub\/(flights|hotels)(?:\/|$)/.exec(location.pathname)?.[1];
  const [state, setState] = useState({ loading: true, header: {}, session: null, error: null });
  useEffect(() => {
    let active = true;
    const params = {
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      app: PRODUCT_TYPE.TREHUB,
    };
    const request = embedded
      ? getHeaderConfig({ ...params, app: "app-shell" }).then((header) => ({
          header,
          session: null,
        }))
      : initApp(params);
    request
      .then(({ header, session }) => {
        if (active) {
          if (!embedded) applyDocumentBranding(header.brand, { tenant: Boolean(header.tenantId) });
          setState({ loading: false, header, session, error: null });
        }
      })
      .catch((error) => {
        if (active) setState((previous) => ({ ...previous, loading: false, error }));
      });
    return () => {
      active = false;
    };
  }, [embedded]);
  if (state.loading) return <GlobalLoader visible text="Loading Trehub" />;
  if (state.error)
    return (
      <ErrorState
        title="Trehub could not start"
        error={state.error.message || "Unable to load Trehub. Please try again."}
        retry={() => window.location.reload()}
      />
    );
  const session = userSession || state.session;
  const serviceTabs = (
    embedded ? state.header.serviceNavigation?.trehub || [] : state.header.menu || []
  )
    .filter(
      (item) =>
        item.path?.startsWith("/trehub/") &&
        !item.hide &&
        !item.disabled &&
        (!services || services.includes(item.id)),
    )
    .map((item) => ({
      ...item,
      href: item.path,
      active: location.pathname === item.path || location.pathname.startsWith(`${item.path}/`),
    }));
  if (
    embedded &&
    services &&
    (!defaultService || (requestedService && !services.includes(requestedService)))
  )
    return <ErrorState title="This service is not enabled for your company" />;

  return (
    <ThemeProvider tenantId={state.header.tenantId} tenantTheme={state.header.tenantTheme}>
      {!embedded && (
        <ConfiguredProductHeader
          config={state.header}
          product="trehub"
          session={session}
          authAction={buildAuthAction(state.header, session)}
        />
      )}
      <TrehubRouteBoundary resetKey={`${location.pathname}${location.search}`}>
        <div className="trehub-service-page">
          {embedded && serviceTabs.length > 1 && (
            <LinkTabs
              className="trehub-service-tabs"
              ariaLabel="Travel services"
              options={serviceTabs}
              onSelect={(item) => {
                const query = new URLSearchParams();
                for (const key of ["tab", "product", "navFrom", "guest"]) {
                  const value = new URLSearchParams(location.search).get(key);
                  if (value) query.set(key, value);
                }
                navigate(
                  { pathname: item.path, search: query.toString() },
                  { state: location.state },
                );
              }}
            />
          )}
          {/^\/trehub\/hotels\/[^/]+/.test(location.pathname) ? (
            <HotelDetails />
          ) : location.pathname.startsWith("/trehub/hotels") ? (
            <HotelFilters
              key={`${session?.user?.id || "guest"}:${session?.user?.agencyRef || session?.user?.agencyId || ""}`}
              userSession={session}
            />
          ) : /^\/trehub\/flights\/[^/]+/.test(location.pathname) ? (
            <FlightDetails />
          ) : location.pathname.startsWith("/trehub/flights") ? (
            <FlightFilters />
          ) : embedded ? (
            <Navigate to={`/trehub/${defaultService}`} replace />
          ) : (
            <Home />
          )}
        </div>
        <Analytics />
      </TrehubRouteBoundary>
      {!embedded && <ProductFooter config={state.header.footer} tenantId={state.header.tenantId} />}
    </ThemeProvider>
  );
}
