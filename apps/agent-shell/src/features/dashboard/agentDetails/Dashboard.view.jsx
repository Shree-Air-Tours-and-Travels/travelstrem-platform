import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Breadcrumbs, GlobalLoader } from "@packages/trem-ui";
import { getLabel, getWidgetProps } from "./widgets/_helpers";
import CustomerDashboardShell from "./widgets/CustomerDashboardShell";
import DashboardAlert from "./widgets/DashboardAlert";
import DashboardMetrics from "./widgets/DashboardMetrics";
import RecentBookings from "./widgets/RecentBookings";
import BookingStatistics from "./widgets/BookingStatistics";
import ServiceShortcuts from "./widgets/ServiceShortcuts";
import BookingsChart from "./widgets/BookingsChart";
import CompactServiceList from "./widgets/CompactServiceList";
import FavoritesTourList from "./widgets/FavoritesTourList";
import DashboardBookingTable from "./widgets/DashboardBookingTable";
import MobileBottomNav from "./widgets/MobileBottomNav";
import SettingsForm from "./widgets/SettingsForm";
import "./Dashboard.styles.scss";

const widgetRenderers = {
    DashboardAlert,
    DashboardMetrics,
    RecentBookings,
    BookingStatistics,
    ServiceShortcuts,
    BookingsChart,
    MostBookedServices: (props) => <CompactServiceList {...props} type="Most Booked Services" />,
    RecentInvoices: (props) => <CompactServiceList {...props} type="Recent Invoices" />,
    BookingTable: DashboardBookingTable,
    SettingsForm: () => null,
};

const NAV_TAB_MAP = {
    dashboard: "dashboard",
    bookings: "mybookings",
    tours: "mybookings",
    settings: "settings",
};

const STORAGE_KEY = "admin_dashboard_activeNav";

export default function DashboardPageView({ loading, error, labels, widgets, options, user, profile, icons, onProfileUpdate, bookingState, bookingQuery, onBookingQueryChange, favoritesState, favoritesChips, loadFavorites }) {
    const location = useLocation();
    const [activeNav, setActiveNav] = useState(() => {
        if (location.state?.activeNav && NAV_TAB_MAP[location.state.activeNav]) return location.state.activeNav;
        const saved = sessionStorage.getItem(STORAGE_KEY);
        if (saved && NAV_TAB_MAP[saved]) return saved;
        return "dashboard";
    });

    useEffect(() => {
        sessionStorage.setItem(STORAGE_KEY, activeNav);
    }, [activeNav]);

    if (loading) return <GlobalLoader visible text="Loading dashboard" />;
    if (error) return <main className="customer-dashboard-page customer-dashboard-page--error">Error: {error}</main>;

    const shellWidget = widgets.find((widget) => widget.type === "CustomerDashboardShell");
    const contentWidgets = widgets.filter((widget) => widget.type !== "CustomerDashboardShell");
    const shellProps = getWidgetProps(shellWidget);
    const navigation = (shellProps?.navigation || []).map((section) => ({
        ...section,
        items: (section.items || [])
            .filter((item) => item.id !== "favorites")
            .map((item) => ({
                ...item,
                children: (item.children || []).filter((child) => child.id !== "favorites"),
            })),
    }));

    const activeTab = NAV_TAB_MAP[activeNav] || "dashboard";

    const breadcrumbItems = (() => {
        if (activeNav === "tours") {
            return [
                { label: getLabel(labels, "navDashboard", "Bookings"), path: "/agent/bookings?tab=dashboard" },
                { label: getLabel(labels, "navBookings", "My Bookings") },
                { label: getLabel(labels, "navTours", "Tours") },
            ];
        }
        if (activeTab === "favorites") {
            return [
                { label: getLabel(labels, "navDashboard", "Bookings"), path: "/agent/bookings?tab=dashboard" },
                { label: getLabel(labels, "navFavorites", "Favorites") },
            ];
        }
        if (activeTab === "settings") {
            return [
                { label: getLabel(labels, "navDashboard", "Bookings"), path: "/agent/bookings?tab=dashboard" },
                { label: getLabel(labels, "navSettings", "Settings") },
            ];
        }
        return [
            { label: getLabel(labels, "navDashboard", "Dashboard") },
        ];
    })();

    const filteredWidgets = activeTab === "dashboard"
        ? contentWidgets.filter((w) => w.type !== "BookingTable")
        : contentWidgets.filter((w) => w.type === "BookingTable");

    const mergedUser = { ...user, avatar: profile?.avatar || user?.avatar };

    const settingsWidget = contentWidgets.find((w) => w.type === "SettingsForm");

    return (
        <>
        <CustomerDashboardShell
            widget={shellWidget}
            labels={labels}
            user={mergedUser}
            activeNav={activeNav}
            onNavChange={setActiveNav}
            banner={activeTab === "dashboard" ? getLabel(labels, "dashboardBanner", "Dashboard data is placeholder while we integrate real-time bookings.") : null}
        >
            <Breadcrumbs items={breadcrumbItems} />
            {activeTab === "settings" ? (
                <SettingsForm widget={settingsWidget} labels={labels} profile={profile} icons={icons} onProfileUpdate={onProfileUpdate} />
            ) : (
                <div className="customer-dashboard-grid">
                    {filteredWidgets.map((widget, index) => {
                        const Renderer = widgetRenderers[widget.type];
                        if (!Renderer) return null;
                        return (
                            <Renderer
                                key={`${widget.type}-${index}`}
                                widget={widget}
                                labels={labels}
                                options={options}
                                bookingState={bookingState}
                                bookingQuery={bookingQuery}
                                onBookingQueryChange={onBookingQueryChange}
                            />
                        );
                    })}
                </div>
            )}
        </CustomerDashboardShell>
        <MobileBottomNav navigation={navigation} labels={labels} activeNav={activeNav} onNavChange={setActiveNav} />
        </>
    );
}
