import React, { useEffect, useState } from "react";
import { AppFooter, AppHeader, BottomSheet, Breadcrumbs, Button, SideBar, useTheme } from "@packages/trem-ui";
import "./AccountDashboard.view.scss";

export default function AccountDashboardView({
  home,
  sectionId,
  detail,
  nestedSupport = false,
  onNavigate,
  onSignOut,
  children,
}) {
  const { theme, toggleTheme } = useTheme();
  const [bookingsOpen, setBookingsOpen] = useState(false);
  const navigation = home.navigation;
  const bookingOptions = navigation.filter((item) => item.parentId === "bookings");
  const bookingSection = navigation.find((item) => item.id === "bookings");
  const isBookingSection =
    sectionId === "bookings" || bookingOptions.some((item) => item.id === sectionId);
  const section = navigation.find((item) => item.id === sectionId);
  const title = section?.label || home.copy.title;

  useEffect(() => {
    setBookingsOpen(false);
  }, [sectionId, detail]);
  useEffect(() => {
    if (!bookingsOpen) return undefined;
    const desktop = window.matchMedia("(min-width: 769px)");
    const closeOnDesktop = () => {
      if (desktop.matches) setBookingsOpen(false);
    };
    closeOnDesktop();
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, [bookingsOpen]);

  const selectSection = (id) => {
    setBookingsOpen(false);
    onNavigate(id);
  };
  const handleAction = (action, item) => action === "logout" ? onSignOut() : action === "theme" ? toggleTheme() : selectSection(item.target || item.id);
  const handleFooterAction = (action, item) => {
    if (item.id === "bookings") setBookingsOpen(true);
    else handleAction(action, item);
  };
  const breadcrumbs =
    sectionId === "overview"
      ? [{ label: home.copy.title }, { label: title }]
      : [
          { label: home.copy.title, onClick: () => onNavigate("overview") },
          ...(isBookingSection && sectionId !== "bookings"
            ? [{ label: bookingSection?.label }]
            : []),
          { label: title, ...(detail ? { onClick: () => onNavigate(sectionId) } : {}) },
          ...(detail ? [{ label: "Booking details" }] : []),
        ];
  const sidebarSections = [
    {
      id: "dashboard",
      title: home.copy.title,
      items: navigation.filter((item) => item.id === "overview"),
    },
    { id: "bookings", title: bookingSection?.label, items: bookingOptions },
    {
      id: "account",
      title: home.copy.accountTitle,
      items: navigation.filter(
        (item) => !item.parentId && !["overview", "bookings"].includes(item.id),
      ),
    },
  ]
    .filter((group) => group.items.length)
    .map((group) => ({
      ...group,
      items: group.items.map((item) => ({ ...item, target: item.id })),
    }));
  if (home.actions?.signOut) sidebarSections.push({ id: "session", title: home.copy.sessionTitle, items: [home.actions.signOut] });
  const headerActions = navigation
    .filter((item) => ["wishlist", "notifications"].includes(item.id))
    .map((item) => ({ ...item, target: item.id, active: item.id === sectionId }));
  const footerActions = ["overview", "bookings", "support", "profile"]
    .map((id) => navigation.find((item) => item.id === id))
    .filter(Boolean)
    .map((item) => ({
      ...item,
      target: item.id,
      active: item.id === "bookings" ? isBookingSection : item.id === sectionId,
    }));

  return (
    <div className="account-dashboard">
      <AppHeader
        config={{
          variant: "withBackAction",
          backAction: { label: `Back to ${home.origin.label}`, href: home.origin.href || "/" },
          actions: [
            ...headerActions,
            ...(home.actions?.theme?.enabled ? [{ id: "theme", action: "theme", label: theme === "dark" ? home.actions.theme.lightLabel : home.actions.theme.darkLabel, icon: theme === "dark" ? home.actions.theme.lightIcon : home.actions.theme.darkIcon }] : []),
            ...(home.actions?.signOut ? [home.actions.signOut] : []),
          ],
          themeAction: home.actions?.theme,
        }}
        theme={theme}
        onToggleTheme={home.actions?.theme?.enabled ? toggleTheme : undefined}
        onAction={handleAction}
      />
      <div className="account-dashboard__body">
        <SideBar
          className="account-dashboard__sidebar"
          config={{
            variant: "withoutCollapse",
            hideBrand: true,
            ariaLabel: home.copy.title,
            sections: sidebarSections,
            profile: { fallbackMeta: home.context.tenantName },
          }}
          user={home.user}
          activeId={sectionId}
          onNavigate={selectSection}
          onAction={handleAction}
        />
        <main className="account-dashboard__content">
          {!nestedSupport && <Breadcrumbs items={breadcrumbs} />}
          {sectionId !== "profile" && !nestedSupport ? (
            <div className="account-dashboard__page-heading">
              <h1>{detail ? "Booking details" : title}</h1>
            </div>
          ) : null}
          <div className="account-dashboard__page" aria-live="polite">
            {children}
          </div>
        </main>
      </div>
      <AppFooter
        config={{ variant: "withActions", ariaLabel: home.copy.title, actions: footerActions }}
        onAction={handleFooterAction}
      />
      <BottomSheet
        open={bookingsOpen}
        onClose={() => setBookingsOpen(false)}
        title={bookingSection?.label}
      >
        <div className="account-dashboard__booking-options">
          {bookingOptions.map((item) => (
            <Button
              key={item.id}
              variant={sectionId === item.id ? "solid" : "outline"}
              fullWidth
              text={item.label}
              iconLeft={item.icon}
              iconRight="chevronRight"
              aria-current={sectionId === item.id ? "page" : undefined}
              onClick={() => selectSection(item.id)}
            />
          ))}
        </div>
      </BottomSheet>
    </div>
  );
}
