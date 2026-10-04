import { clearAuthBrowserState, emitAuthEvent } from "@packages/trem-auth-core";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  DashboardPanel,
  ErrorState,
  NoDataFound,
  Preloader,
  ThemeProvider,
} from "@packages/trem-ui";
import { fetchData, buildGlobalAuthUrl } from "@packages/trem-utils";
import { UserBookingJourney } from "@apps/booking-engine";
import ProfileView from "../../../app-shell/src/views/ProfileView";
import SupportHomePage from "../../../app-shell/src/features/support/SupportHomePage";
import SupportRoutes from "../../../app-shell/src/features/support/SupportRoutes";
import AccountBookingPage from "../views/traveller/AccountBookingPage";
import AccountFlightDetail from "../views/traveller/AccountFlightDetail";
import AccountDashboardView from "../views/traveller/AccountDashboard.view";
import AccountOverviewView from "../views/traveller/AccountOverview.view";
import useDashboard from "./useDashboard";

export default function AccountDashboard({ userId }) {
  const location = useLocation();
  const navigate = useNavigate();
  const originProduct = new URLSearchParams(location.search).get("product") || "";
  const legacyFlight = location.pathname.match(/^\/trehub\/flights\/bookings\/([^/]+)\/?$/);
  const { data, loading, error, status, reload } = useDashboard(userId, originProduct);
  const bookingSections = new Set([
    "bookings",
    ...(data?.navigation || [])
      .filter((item) => item.parentId === "bookings")
      .map((item) => item.id),
  ]);
  useEffect(() => {
    if (!legacyFlight) return;
    const params = new URLSearchParams(location.search);
    params.set("flight", decodeURIComponent(legacyFlight[1]));
    navigate(`/dashboard/flights?${params}`, { replace: true });
  }, [location.pathname, location.search, navigate]);
  useEffect(() => {
    if (!data || data.origin.product !== originProduct || location.pathname !== "/dashboard")
      return;
    navigate(`/dashboard/${data.origin.defaultPage}${location.search}`, { replace: true });
  }, [data, location.pathname, location.search, navigate]);
  const sectionId = legacyFlight
    ? "flights"
    : location.pathname.startsWith("/help")
      ? "support"
      : location.pathname.split("/")[2] || "overview";
  const search = new URLSearchParams(location.search);
  const flightReference =
    search.get("flight") || (legacyFlight ? decodeURIComponent(legacyFlight[1]) : "");
  const detail = Boolean(
    search.get("booking") || search.get("enquiry") || search.get("bookingId") || flightReference,
  );
  const pageSection = bookingSections.has(sectionId) || sectionId === "support" ? "" : sectionId;
  const [page, setPage] = useState({ loading: true, data: null, error: "" });
  const pageRequest = useRef(0);
  const [saving, setSaving] = useState("");
  const [actionError, setActionError] = useState("");

  const loadPage = useCallback(async () => {
    if (!data || !pageSection || !data.navigation.some((item) => item.id === pageSection)) return;
    const request = ++pageRequest.current;
    setPage({ section: pageSection, loading: true, data: null, error: "" });
    try {
      const response = await fetchData(`/dashboard/pages/${pageSection}`, {
        params: originProduct ? { product: originProduct } : {},
        signal: AbortSignal.timeout(20000),
      });
      if (response?.status !== "success")
        throw new Error(response?.message || "This page could not be loaded.");
      if (request !== pageRequest.current) return;
      setPage({ section: pageSection, loading: false, data: response.data, error: "" });
    } catch (failure) {
      if (request !== pageRequest.current) return;
      setPage({
        section: pageSection,
        loading: false,
        data: null,
        error: failure.message || "This page could not be loaded.",
      });
    }
  }, [data, pageSection, originProduct]);
  useEffect(() => {
    setActionError("");
    loadPage();
    return () => {
      pageRequest.current += 1;
    };
  }, [loadPage]);

  const signOut = async () => {
    try {
      const response = await fetchData("/auth/logout", { method: "POST" });
      if (response?.status !== "success" && response?.success !== true) throw new Error(response?.message || "Unable to sign out.");
      clearAuthBrowserState();
      emitAuthEvent({ type: "LOGOUT" });
      window.location.assign(buildGlobalAuthUrl({ app: "dashboard", returnTo: window.location.origin }));
    } catch (failure) { setActionError(failure.message); }
  };

  const go = (target) => {
    if (!target) return;
    const section = data?.navigation.find((item) => item.id === target);
    const url = new URL(section?.href || target, window.location.origin);
    if (url.origin !== window.location.origin) {
      window.location.assign(url.toString());
      return;
    }
    if (
      originProduct &&
      (url.pathname.startsWith("/dashboard") || url.pathname.startsWith("/help"))
    )
      url.searchParams.set("product", originProduct);
    navigate(`${url.pathname}${url.search}`, { state: { dashboardOrigin: "dashboard" } });
  };

  const saveProfile = async (payload, kind = "profile") => {
    setSaving(kind);
    setActionError("");
    try {
      const response = await fetchData(`/auth/${kind}`, { method: "PUT", body: payload });
      if (response?.status !== "success")
        throw new Error(response?.message || "Profile could not be saved.");
      await loadPage();
      if (kind === "profile")
        window.dispatchEvent(
          new CustomEvent("USER_PROFILE_UPDATED", {
            detail: { user: response.componentData?.data },
          }),
        );
      return { success: true };
    } catch (failure) {
      setActionError(failure.message);
      return { success: false, message: failure.message };
    } finally {
      setSaving("");
    }
  };

  const markNotificationRead = async (id) => {
    try {
      const response = await fetchData(`/dashboard/notifications/${encodeURIComponent(id)}/read`, {
        method: "PATCH",
      });
      if (response?.status !== "success")
        throw new Error(response?.message || "Notification could not be updated.");
      await loadPage();
    } catch (failure) {
      setActionError(failure.message);
    }
  };

  if (loading && !data) return <Preloader variant="dashboard" label="Loading dashboard" />;
  if (status === 401)
    return (
      <NoDataFound
        title="Sign in to your dashboard"
        description="Your account is available after signing in."
        actionLabel="Sign in"
        onAction={() =>
          window.location.assign(
            buildGlobalAuthUrl({ app: "dashboard", returnTo: window.location.href }),
          )
        }
      />
    );
  if (error || !data) return <ErrorState title="Dashboard unavailable" description={error} />;

  const allowed = data.navigation.some((item) => item.id === sectionId);
  let content;
  if (!allowed)
    content = (
      <NoDataFound
        title="Page unavailable"
        description="This page is not available for your account."
      />
    );
  else if (bookingSections.has(sectionId))
    content = flightReference ? (
      <AccountFlightDetail reference={flightReference} />
    ) : detail ? (
      <UserBookingJourney ignoreProduct />
    ) : sectionId === "bookings" ? (
      <NoDataFound
        title="Select a travel service"
        description="Open Bookings in the sidebar and choose Tours, Trips, Flights, or Hotels."
      />
    ) : (
      <AccountBookingPage key={sectionId} section={sectionId} onOpen={go} />
    );
  else if (sectionId === "support")
    content = location.pathname.startsWith("/help/") ? (
      <SupportRoutes
        isAuthenticated
        onRequireAuthentication={() =>
          window.location.assign(
            buildGlobalAuthUrl({ app: "dashboard", returnTo: window.location.href }),
          )
        }
      />
    ) : (
      <SupportHomePage isAuthenticated embedded />
    );
  else if (page.section !== pageSection || page.loading || !page.data)
    content =
      page.section === pageSection && page.error ? (
        <ErrorState title="Page unavailable" description={page.error} retry={loadPage} />
      ) : (
        <Preloader
          variant={sectionId === "overview" ? "dashboard" : "dashboardWidget"}
          count={4}
          label="Loading page"
        />
      );
  else if (sectionId === "overview")
    content = (
      <AccountOverviewView
        key={`${data.context.tenantId}:${originProduct}`}
        data={page.data}
        product={originProduct}
        onNavigate={go}
        onRefresh={reload}
      />
    );
  else if (sectionId === "profile")
    content = (
      <ProfileView
        user={page.data.user}
        saving={saving === "profile"}
        passwordSaving={saving === "password"}
        avatarSaving={saving === "profile"}
        onSaveProfile={saveProfile}
        onUpdatePassword={(payload) => saveProfile(payload, "password")}
        onUpdateAvatar={(avatar) => saveProfile({ avatar })}
      />
    );
  else if (page.data.items?.length)
    content = (
      <DashboardPanel
        title={page.data.title}
        items={page.data.items.map((item) => ({
          id: item.id,
          label: item.title,
          description: item.reference || item.message,
          icon: sectionId === "wishlist" ? "heart" : sectionId === "support" ? "support" : "bell",
          status:
            item.status || (item.readAt ? "Read" : sectionId === "notifications" ? "Unread" : ""),
          target:
            item.href ||
            (sectionId === "notifications" && !item.readAt ? `notification:${item.id}` : ""),
        }))}
        action={
          page.data.action
            ? { label: page.data.action.label, onClick: () => go(page.data.action.href) }
            : undefined
        }
        onItemClick={(target) =>
          target.startsWith("notification:") ? markNotificationRead(target.slice(13)) : go(target)
        }
      />
    );
  else
    content = (
      <NoDataFound
        title={page.data.emptyTitle || data.copy.emptyTitle}
        description={page.data.emptyDescription || data.copy.emptyDescription}
        actionLabel={page.data.action?.label}
        onAction={page.data.action ? () => go(page.data.action.href) : undefined}
      />
    );

  return (
    <ThemeProvider tenantId={data.context.tenantId} tenantTheme={data.context.theme}>
      <AccountDashboardView
        home={data}
        sectionId={sectionId}
        detail={detail}
        nestedSupport={sectionId === "support" && location.pathname.startsWith("/help/")}
        onNavigate={go}
        onSignOut={signOut}
      >
        {content}
      </AccountDashboardView>
      {actionError ? <ErrorState description={actionError} /> : null}
    </ThemeProvider>
  );
}
