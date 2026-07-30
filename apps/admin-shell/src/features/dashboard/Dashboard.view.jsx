import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button, GlobalLoader, Icon, FavoriteCard, Breadcrumbs, PortalPreloader, BottomSheet, EmptyState, QuickChips, Title, SubTitle, Paragraph, BookingTable as TremBookingTable, DashboardSidebar } from "@packages/trem-ui";
import { fetchData, getTourDetailsPath, slugify } from "@packages/trem-utils";
import "./Dashboard.styles.scss";

const getLabel = (labels, ref, fallback = "") => (ref ? labels[ref] || fallback : fallback);
const getWidgetProps = (widget) => widget?.props || {};
const getToneClass = (tone) => ` tone-${tone || "primary"}`;
const getMetricIcon = (icon) => ({
    coin: "payment",
    money: "payment",
    transaction: "payment",
    transactions: "payment",
    bookings: "calendar",
    average: "wallet",
}[icon] || icon || "compass");

const statusClass = (status = "") => `status-${String(status).toLowerCase().replace(/\s+/g, "-")}`;

function Panel({ className = "", title, action, children }) {
    return (
        <section className={`dashboard-panel ${className}`.trim()}>
            {(title || action) && (
                <header className="dashboard-panel__header">
                    {title ? <Title text={title} /> : <span />}
                    {action}
                </header>
            )}
            {children}
        </section>
    );
}

function CustomerDashboardShell({ widget, labels, children, user, activeNav, onNavChange, banner }) {
    const props = getWidgetProps(widget);
    const profile = props.profile || {};
    const navigation = props.navigation || [];
    const displayName = user?.name || getLabel(labels, profile.nameRef, "Customer");
    const since = getLabel(labels, profile.sinceRef, "Since 10 May 2025");
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        const saved = sessionStorage.getItem("dashboard_sidebar_open");
        return saved !== null ? saved === "true" : true;
    });

    const setSidebarCollapsed = (collapsed) => {
        const open = !collapsed;
        sessionStorage.setItem("dashboard_sidebar_open", String(open));
        setSidebarOpen(open);
    };
    const sidebarSections = navigation.map((section) => ({
        ...section,
        title: getLabel(labels, section.sectionRef, section.title || section.sectionRef),
        items: (section.items || []).map((item) => ({
            ...item,
            label: getLabel(labels, item.labelRef, item.label),
            children: (item.children || []).map((child) => ({
                ...child,
                label: getLabel(labels, child.labelRef, child.label),
            })),
        })),
    }));

    return (
        <main className={`customer-dashboard-page${!sidebarOpen ? " is-sidebar-collapsed" : ""}`}>
            {banner && <div className="customer-dashboard-page__banner">{banner}</div>}
            <div className="customer-dashboard-page__body">
                <DashboardSidebar
                    profile={{
                        name: displayName,
                        meta: since,
                        avatar: user?.avatar || profile.avatar || "user",
                        actionLabel: getLabel(labels, "navSettings", "Settings"),
                    }}
                    sections={sidebarSections}
                    activeId={activeNav}
                    collapsed={!sidebarOpen}
                    collapseMode="rail"
                    onCollapsedChange={setSidebarCollapsed}
                    onProfileAction={() => onNavChange?.("settings")}
                    onNavigate={(item) => onNavChange?.(item.id)}
                />
                <section className="customer-dashboard-page__content">
                    {children}
                </section>
            </div>
        </main>
    );
}

function DashboardAlert({ widget, labels }) {
    const props = getWidgetProps(widget);
    return (
        <div className={`dashboard-alert${getToneClass(props.tone)}`}>
            <Icon name="alertTriangle" aria-hidden="true" />
            <span>{getLabel(labels, props.messageRef, props.message)}</span>
            <Button variant="text" text="×" aria-label="Dismiss alert" />
        </div>
    );
}

function DashboardMetrics({ widget, labels, bookingState }) {
    const items = getWidgetProps(widget).items || [];
    const metrics = bookingState?.metrics;
    const metricItems = metrics ? items.map((item) => {
        if (item.id === "bookings") return { ...item, value: metrics.totalBookings };
        if (item.id === "transactions") return { ...item, value: metrics.totalTransactions };
        if (item.id === "average") return { ...item, value: metrics.averageValue };
        return item;
    }) : items;
    return (
        <section className="dashboard-metrics" aria-label="Dashboard metrics">
            {metricItems.map((item) => (
                    <article className={`dashboard-metric${getToneClass(item.tone)}`} key={item.id}>
                        <span className="dashboard-metric__icon"><Icon name={getMetricIcon(item.icon || item.id)} size={26} aria-hidden="true" /></span>
                        <div>
                            <strong>{item.value}</strong>
                            <span>{getLabel(labels, item.labelRef, item.label)}</span>
                        </div>
                    </article>
            ))}
        </section>
    );
}

function RecentBookings({ widget, labels }) {
    const props = getWidgetProps(widget);
    return (
        <Panel className="dashboard-recent-bookings" title={getLabel(labels, props.titleRef, "Recent Booking")} action={<Button variant="text" text="Plane" />}>
            <div className="dashboard-list">
                {(props.items || []).map((item) => (
                    <article className="dashboard-list-row" key={item.id}>
                        <img src={item.image} alt="" />
                        <div>
                            <strong>{item.name}</strong>
                            <span>{item.type}</span>
                            <small>Date : {item.date} <i /> Time : {item.time}</small>
                        </div>
                        <b className={statusClass(item.status)}>{item.status}</b>
                    </article>
                ))}
            </div>
        </Panel>
    );
}

function BookingStatistics({ widget, labels }) {
    const props = getWidgetProps(widget);
    const segments = props.segments || [];
    return (
        <Panel className="dashboard-statistics" title={getLabel(labels, props.titleRef, "Booking Statistic")} action={<Button variant="text" text="January" />}>
            <span>{getLabel(labels, props.amountLabelRef, "Total Amount Spend")}</span>
            <strong>{props.amount}</strong>
            <div className="dashboard-rings" aria-hidden="true">
                {segments.map((segment, index) => (
                    <i
                        key={segment.labelRef || segment.label}
                        className={getToneClass(segment.tone)}
                        style={{
                            "--ring-size": `${132 - index * 18}px`,
                            "--ring-value": `${Math.max(8, Math.min(100, segment.value || 0))}%`,
                        }}
                    />
                ))}
            </div>
            <ul className="dashboard-statistics__legend">
                {segments.map((segment) => (
                    <li key={segment.labelRef || segment.label} className={getToneClass(segment.tone)}>
                        {getLabel(labels, segment.labelRef, segment.label)}
                    </li>
                ))}
            </ul>
            <Paragraph text={props.comparison} />
        </Panel>
    );
}

function ServiceShortcuts({ widget, labels }) {
    const items = getWidgetProps(widget).items || [];
    return (
        <section className="dashboard-services" aria-label="Travel services">
            {items.map((item) => (
                <article className="dashboard-service-card" key={item.id}>
                    <img src={item.image} alt="" />
                    <strong>{item.count} {getLabel(labels, item.labelRef, item.label)}</strong>
                    <span>{item.cta}</span>
                </article>
            ))}
        </section>
    );
}

function BookingsChart({ widget, labels }) {
    const props = getWidgetProps(widget);
    const bars = props.bars || [];
    return (
        <Panel className="dashboard-chart" title={getLabel(labels, props.titleRef, "Recent Bookings")} action={<Button variant="text" text="2025" />}>
            <span>{getLabel(labels, props.metricLabelRef, "Spending For Bookings")}</span>
            <div className="dashboard-chart__metric">
                <strong>{props.amount}</strong>
                <b>{props.change}</b>
                <small>{props.period}</small>
            </div>
            <div className="dashboard-chart__bars">
                {bars.map((bar) => {
                    const label = getLabel(labels, bar.labelRef, bar.label);
                    return <i key={bar.labelRef || label} style={{ "--bar-height": `${bar.value || 0}%` }}><span>{label}</span></i>;
                })}
            </div>
        </Panel>
    );
}

function CompactServiceList({ widget, labels, type }) {
    const props = getWidgetProps(widget);
    return (
        <Panel className="dashboard-compact-list" title={getLabel(labels, props.titleRef, type)} action={<Button variant="text" text="All" />}>
            <div className="dashboard-list dashboard-list--compact">
                {(props.items || []).map((item) => (
                    <article className="dashboard-list-row" key={`${item.name}-${item.date}`}>
                        <img src={item.image} alt="" />
                        <div>
                            <strong>{item.name}</strong>
                            <span>{item.id ? <>{item.id} · </> : null}{item.date}</span>
                        </div>
                    {item.price || item.amount ? <b>{item.price || item.amount}</b> : <b className={statusClass(item.status)}>{item.status}</b>}
                    </article>
                ))}
            </div>
        </Panel>
    );
}

function FavoritesTourList({ labels, favoritesState, favoritesChips, loadFavorites }) {
    const navigate = useNavigate();
    const [activeChip, setActiveChip] = useState("tours");
    const [sort, setSort] = useState("recommended");
    const { loading, error, items: favorites } = favoritesState;

    const handleChipClick = (chipId) => {
        const chip = favoritesChips.find((c) => c.id === chipId);
        if (!chip || chip.disabled) return;
        setActiveChip(chipId);
    };

    const openTour = useCallback(
        (tour) => {
            const ref = slugify(tour?.title) || tour?._id || tour?.id;
            if (!ref) return;
            navigate(getTourDetailsPath(ref), { state: { tour, from: { label: "Dashboard", path: "/dashboard" } } });
        },
        [navigate]
    );

    const sorted = [...favorites].sort((a, b) => {
        if (sort === "price-asc") return (a.price?.min || 0) - (b.price?.min || 0);
        if (sort === "price-desc") return (b.price?.min || 0) - (a.price?.min || 0);
        if (sort === "rating") return (b.avgRating || 0) - (a.avgRating || 0);
        return 0;
    });

    if (loading) {
        return (
            <section className="dashboard-favorites">
                <div className="dashboard-favorites__container">
                    <PortalPreloader type="cards" count={3} text={getLabel(labels, "favoritesLoading", "Loading favorites")} />
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section className="dashboard-favorites">
                <div className="dashboard-favorites__container">
                    <div className="dashboard-favorites__error">
                        <Icon name="alertTriangle" size={24} />
                        <Paragraph>{error}</Paragraph>
                        <Button variant="solid" color="primary" text={getLabel(labels, "retry", "Try again")} onClick={loadFavorites} primaryClassName="dashboard-favorites__retry" />
                    </div>
                </div>
            </section>
        );
    }

    const hasFavorites = favorites.length > 0;

    return (
        <section className="dashboard-favorites">
            <div className="dashboard-favorites__container">
                <header className="dashboard-favorites__header">
                    <Title primaryClassname="dashboard-favorites__title" text={getLabel(labels, "favoritesTitle", "My Favorites")} />
                    {hasFavorites && <span className="dashboard-favorites__count">{favorites.length} {getLabel(labels, "favoritesSaved", "saved")}</span>}
                    <select className="dashboard-favorites__sort" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort tours">
                        <option value="recommended">{getLabel(labels, "navRecommended", "Recommended")}</option>
                        <option value="price-asc">{getLabel(labels, "navPriceLow", "Price: Low to High")}</option>
                        <option value="price-desc">{getLabel(labels, "navPriceHigh", "Price: High to Low")}</option>
                        <option value="rating">{getLabel(labels, "navTopRated", "Top Rated")}</option>
                    </select>
                </header>

                <QuickChips
                    filters={favoritesChips}
                    activeId={activeChip}
                    onClick={handleChipClick}
                    className="dashboard-favorites__chips"
                />

                {!hasFavorites ? (
                    <EmptyState
                        icon="heart"
                        title={getLabel(labels, "favoritesEmptyTitle", "No favorites yet")}
                        description={getLabel(labels, "favoritesEmptyDescription", "Start exploring tours and save the ones you love. Your favorites will appear here.")}
                    />
                ) : (
                    <div className="dashboard-favorites__grid">
                        {activeChip === "tours" && sorted.map((tour) => (
                            <FavoriteCard key={tour._id || tour.id} tour={tour} onView={openTour} />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}

function DashboardBookingTable({ widget, labels, options, bookingState, bookingQuery, onBookingQueryChange }) {
    const props = getWidgetProps(widget);
    const rows = bookingState?.rows?.length || bookingState?.loading || bookingState?.error ? (bookingState?.rows || []) : (props.rows || []);
    const tableOptions = options || {};
    const navigate = useNavigate();
    const total = Number(bookingState?.total || rows.length || 0);
    const limit = Number(bookingState?.limit || rows.length || 1);
    const page = Number(bookingQuery?.page || 1);
    const heroSource = props.heroBanner || props.summary;
    const hero = heroSource || {};
    const summarySubtitle = bookingState
        ? `${getLabel(labels, "summarySubtitleLabel", "No of Booking :")} ${total}`
        : getLabel(labels, hero.subtitleRef, hero.subtitle);
    const updateQuery = (patch) => {
        onBookingQueryChange?.((prev) => ({ ...prev, page: 1, ...patch }));
    };
    const optionList = (key, fallback = []) => (tableOptions[key] || fallback).map((item) => (
        typeof item === "string" ? { label: item, value: item } : item
    ));
    const table = {
        ...(props.table || {}),
        title: getLabel(labels, props.table?.titleRef, getLabel(labels, props.titleRef, "My Journeys")),
        ariaLabel: getLabel(labels, props.table?.ariaLabelRef, "My Journeys"),
        loading: Boolean(bookingState?.loading),
        error: bookingState?.error || "",
        emptyState: props.table?.emptyState ? {
            title: getLabel(labels, props.table.emptyState.titleRef, "No bookings found"),
            description: getLabel(labels, props.table.emptyState.descriptionRef, "No bookings found for the selected filters."),
        } : undefined,
    };
    const actions = {
        ...(props.actions || {}),
        search: props.actions?.search ? {
            ...props.actions.search,
            value: bookingQuery?.search || "",
            placeholder: getLabel(labels, props.actions.search.placeholderRef, "Search"),
            onChange: (value) => updateQuery({ search: value }),
        } : undefined,
        filters: (props.actions?.filters || []).map((filter) => ({
            ...filter,
            label: getLabel(labels, filter.labelRef, filter.label || filter.id),
            value: bookingQuery?.[filter.id] || "All",
            options: optionList(filter.optionsKey, filter.options || ["All"]),
            onChange: (value) => updateQuery({ [filter.id]: value }),
        })),
    };
    const sortingHeader = {
        ...(props.sortingHeader || {}),
        label: `${getLabel(labels, props.sortingHeader?.labelRef, "Sort By")} :`,
        selectLabel: getLabel(labels, props.sortingHeader?.selectLabelRef, "Sort By"),
        value: bookingQuery?.sort || "Recommended",
        options: optionList(props.sortingHeader?.optionsKey, props.sortingHeader?.options || ["Recommended"]),
        onChange: (value) => updateQuery({  value }),
    };
    const viewBooking = (row) => {
        if (row.bookingId) {
            navigate(`/bookings/${row.bookingId}`, { state: { from: { label: "Dashboard", path: "/manage/tours?tab=dashboard", activeNav: "tours" } } });
        }
    };
    const columns = (props.columns || []).map((column) => ({
        ...column,
        label: getLabel(labels, column.labelRef, column.label || ""),
        actionLabel: getLabel(labels, column.actionLabelRef, column.actionLabel || column.label || ""),
        onClick: column.action === "viewBooking" ? viewBooking : column.onClick,
        actions: (column.actions || []).map((action) => ({
            ...action,
            label: getLabel(labels, action.labelRef, action.label || ""),
            onClick: viewBooking,
        })),
    }));
    const pagination = {
        ...(props.pagination || {}),
        currentPage: page,
        pageSize: limit,
        total,
        onPageChange: (pageNumber) => onBookingQueryChange?.((prev) => ({ ...prev, page: pageNumber })),
        onPageSizeChange: (pageSize) => onBookingQueryChange?.((prev) => ({ ...prev, page: 1, limit: pageSize })),
    };
    const heroBanner = heroSource ? {
        ...hero,
        title: getLabel(labels, hero.titleRef, hero.title || "Tour"),
        subtitle: summarySubtitle,
        actions: (hero.actions || []).map((action) => {
            const dateRange = hero.dateRange || props.summary?.dateRange;
            return {
                ...action,
                label: action.id === "dateRange" && dateRange ? dateRange : getLabel(labels, action.labelRef, action.label || ""),
                ariaLabel: action.id === "dateRange" ? dateRange || action.label || "Booking date range" : getLabel(labels, action.ariaLabelRef, getLabel(labels, action.labelRef, action.label || "")),
                options: (action.options || []).map((option) => ({
                    ...option,
                    label: getLabel(labels, option.labelRef, option.label || option.id),
                })),
            };
        }),
    } : undefined;

    return (
        <section className="dashboard-booking-table">
            <TremBookingTable
                heroBanner={heroBanner}
                table={table}
                actions={actions}
                sortingHeader={sortingHeader}
                pagination={pagination}
                columns={columns}
                rows={rows}
            />
        </section>
    );
}

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

function MobileBottomNav({ navigation, labels, activeNav, onNavChange }) {
    const [sheet, setSheet] = useState(null);

    const bookingsItem = (
        navigation.find((s) => s.sectionRef === "menuMain")?.items || []
    ).find((i) => i.id === "bookings");

    const bookingChildActive = bookingsItem?.children?.some((c) => activeNav === c.id);

    const moreSections = navigation
        .map((section) => ({
            ...section,
            items: (section.items || []).filter(
                (i) => !["dashboard", "bookings", "favorites"].includes(i.id)
            ),
        }))
        .filter((s) => s.items.length > 0);

    return (
        <>
            <nav className="dashboard-mobile-nav">
                <Button variant="text" iconLeft="user" text={getLabel(labels, "navDashboard", "Profile")} primaryClassName={activeNav === "dashboard" ? "is-active" : ""} onClick={() => onNavChange("dashboard")} />
                <Button variant="text" iconLeft="suitcase" text={getLabel(labels, "navBookings", "My Bookings")} primaryClassName={bookingChildActive ? "is-active" : ""} onClick={() => setSheet("bookings")} />
                <Button variant="text" iconLeft="moreVertical" text={getLabel(labels, "mobileNavMore", "More")} onClick={() => setSheet("more")} />
            </nav>

            <BottomSheet open={sheet === "bookings"} onClose={() => setSheet(null)} title="My Bookings">
                {bookingsItem?.children?.map((child) => (
                    <Button
                        key={child.id}
                        variant="text"
                        iconLeft={child.icon || "compass"}
                        text={getLabel(labels, child.labelRef, child.label)}
                        primaryClassName="dashboard-mobile-sheet-item"
                        onClick={() => { onNavChange(child.id); setSheet(null); }}
                    />
                ))}
            </BottomSheet>

            <BottomSheet open={sheet === "more"} onClose={() => setSheet(null)} title="More">
                {moreSections.map((section) => (
                    <div key={section.sectionRef || section.items?.[0]?.id}>
                        <SubTitle primaryClassname="dashboard-mobile-sheet-section" text={getLabel(labels, section.sectionRef, section.sectionRef)} />
                        {section.items.map((item) => (
                            <Button
                                key={item.id}
                                variant="text"
                                iconLeft={item.icon || "compass"}
                                text={`${getLabel(labels, item.labelRef, item.label)}${item.badge ? ` ${item.badge}` : ""}`}
                                primaryClassName={`dashboard-mobile-sheet-item${item.disabled ? " is-disabled" : ""}`}
                                disabled={item.disabled}
                                onClick={() => {
                                    if (!item.disabled) {
                                        onNavChange(item.id);
                                        setSheet(null);
                                    }
                                }}
                            />
                        ))}
                    </div>
                ))}
            </BottomSheet>
        </>
    );
}

function SettingsForm({ widget, labels, profile, icons = [], onProfileUpdate }) {
    const props = getWidgetProps(widget);
    const sections = props.sections || [];
    const [form, setForm] = useState({ name: "", avatar: "user", currentPassword: "", newPassword: "", confirmPassword: "" });
    const [saving, setSaving] = useState(null);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        if (profile) {
            setForm((prev) => ({ ...prev, name: profile.name || "", avatar: profile.avatar || "user" }));
        }
    }, [profile]);

    const showToast = (msg, type = "success") => {
        setToast({ message: msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const saveProfile = async () => {
        setSaving("profile");
        try {
            const res = await fetchData("/auth/profile", {
                method: "PUT",
                body: JSON.stringify({ name: form.name, avatar: form.avatar }),
                headers: { "Content-Type": "application/json" },
            });
            if (res?.status === "success") {
                onProfileUpdate?.(res.componentData?.data);
                showToast(getLabel(labels, "toastProfileSaved", "Profile updated successfully"));
            } else {
                showToast(res?.message || getLabel(labels, "toastError", "Something went wrong"), "error");
            }
        } catch {
            showToast(getLabel(labels, "toastError", "Something went wrong"), "error");
        } finally {
            setSaving(null);
        }
    };

    const savePassword = async () => {
        if (form.newPassword !== form.confirmPassword) {
            showToast(getLabel(labels, "passwordMismatch", "Passwords do not match"), "error");
            return;
        }
        if (form.newPassword.length < 6) {
            showToast(getLabel(labels, "passwordMinLength", "Password must be at least 6 characters"), "error");
            return;
        }
        setSaving("password");
        try {
            const res = await fetchData("/auth/password", {
                method: "PUT",
                body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword }),
                headers: { "Content-Type": "application/json" },
            });
            if (res?.status === "success") {
                setForm((prev) => ({ ...prev, currentPassword: "", newPassword: "", confirmPassword: "" }));
                showToast(getLabel(labels, "toastPasswordSaved", "Password updated successfully"));
            } else {
                showToast(res?.message || getLabel(labels, "toastError", "Something went wrong"), "error");
            }
        } catch {
            showToast(getLabel(labels, "toastError", "Something went wrong"), "error");
        } finally {
            setSaving(null);
        }
    };

    return (
        <section className="dashboard-settings">
            {toast && (
                <div className={`dashboard-settings__toast ${toast.type === "error" ? "is-error" : ""}`}>
                    {toast.message}
                </div>
            )}
            {sections.map((section) => (
                <div key={section.id} className="dashboard-settings__section">
                    <Title text={getLabel(labels, section.titleRef, section.id)} />
                    <div className="dashboard-settings__fields">
                        {section.fields.map((field) => {
                            const label = getLabel(labels, field.labelRef, field.id);
                            const placeholder = getLabel(labels, field.placeholderRef, "");
                            if (field.type === "iconPicker") {
                                return (
                                    <div key={field.id} className="dashboard-settings__field">
                                        <label>{label}</label>
                                        <div className="dashboard-settings__icon-grid">
                                            {icons.map((icon) => (
                                                <Button
                                                    key={icon}
                                                    variant="outline"
                                                    iconLeft={icon}
                                                    isCircular
                                                    primaryClassName={`dashboard-settings__icon-btn${form.avatar === icon ? " is-active" : ""}`}
                                                    onClick={() => setForm((prev) => ({ ...prev, avatar: icon }))}
                                                    title={icon}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                );
                            }
                            return (
                                <div key={field.id} className="dashboard-settings__field">
                                    <label htmlFor={`settings-${field.id}`}>{label}</label>
                                    <input
                                        id={`settings-${field.id}`}
                                        type={field.type || "text"}
                                        placeholder={placeholder}
                                        value={form[field.id] || ""}
                                        onChange={(e) => setForm((prev) => ({ ...prev, [field.id]: e.target.value }))}
                                    />
                                </div>
                            );
                        })}
                    </div>
                    {section.id === "profile" && (
                        <Button
                            variant="solid"
                            color="primary"
                            text={saving === "profile" ? getLabel(labels, "btnUpdating", "Saving...") : getLabel(labels, "btnSave", "Save Changes")}
                            onClick={saveProfile}
                            disabled={saving === "profile"}
                            primaryClassName="dashboard-settings__submit"
                        />
                    )}
                    {section.id === "password" && (
                        <Button
                            variant="solid"
                            color="primary"
                            text={saving === "password" ? getLabel(labels, "btnUpdating", "Saving...") : getLabel(labels, "btnSave", "Save Changes")}
                            onClick={savePassword}
                            disabled={saving === "password"}
                            primaryClassName="dashboard-settings__submit"
                        />
                    )}
                </div>
            ))}
        </section>
    );
}

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

    if (loading) return <GlobalLoader visible text="Loading App" />;
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
                { label: getLabel(labels, "navDashboard", "Dashboard"), path: "/manage/tours?tab=dashboard" },
                { label: getLabel(labels, "navBookings", "My Bookings") },
                { label: getLabel(labels, "navTours", "Tours") },
            ];
        }
        if (activeTab === "favorites") {
            return [
                { label: getLabel(labels, "navDashboard", "Dashboard"), path: "/manage/tours?tab=dashboard" },
                { label: getLabel(labels, "navFavorites", "Favorites") },
            ];
        }
        if (activeTab === "settings") {
            return [
                { label: getLabel(labels, "navDashboard", "Dashboard"), path: "/manage/tours?tab=dashboard" },
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
