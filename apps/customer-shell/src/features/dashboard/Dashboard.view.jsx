import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Dropdown, GlobalLoader, Icon, TourCard, Breadcrumbs, PortalPreloader, BottomSheet, EmptyState, QuickChips } from "@packages/trem-ui";
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
                    {title ? <h2>{title}</h2> : <span />}
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
    const [expandedSections, setExpandedSections] = useState({});
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        const saved = sessionStorage.getItem("dashboard_sidebar_open");
        return saved !== null ? saved === "true" : true;
    });

    const itemOrChildActive = (item) => {
        if (activeNav === item.id) return true;
        if (item.children?.length) return item.children.some((child) => activeNav === child.id);
        return false;
    };

    const shouldExpand = (item) => {
        if (!item.children?.length) return false;
        const userValue = expandedSections[item.id];
        if (userValue !== undefined) return userValue;
        return item.children.some((child) => activeNav === child.id);
    };

    const toggleExpand = (id) => {
        setExpandedSections((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const handleNavClick = (item) => {
        if (item.disabled) return;
        if (item.children?.length) {
            const userValue = expandedSections[item.id];
            if (userValue !== undefined) {
                toggleExpand(item.id);
            } else {
                const isAnyChildActive = item.children.some((child) => activeNav === child.id);
                setExpandedSections((prev) => ({ ...prev, [item.id]: isAnyChildActive ? false : true }));
            }
        } else {
            onNavChange?.(item.id);
        }
    };

    const toggleSidebar = () => {
        setSidebarOpen((prev) => {
            sessionStorage.setItem("dashboard_sidebar_open", String(!prev));
            return !prev;
        });
    };

    return (
        <main className={`customer-dashboard-page${!sidebarOpen ? " is-sidebar-collapsed" : ""}`}>
            {banner && <div className="customer-dashboard-page__banner">{banner}</div>}
            <button
                type="button"
                className="customer-dashboard-page__sidebar-toggle"
                onClick={toggleSidebar}
                aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
                <Icon name={sidebarOpen ? "chevronLeft" : "chevronRight"} />
            </button>
            <div className="customer-dashboard-page__body">
                <aside className={`customer-dashboard-sidebar${!sidebarOpen ? " is-collapsed" : ""}`} aria-label="Dashboard navigation">
                    <div className="customer-dashboard-sidebar__profile">
                        <span className="customer-dashboard-sidebar__avatar">
                            <Icon name={user?.avatar || "user"} size={28} />
                        </span>
                        <div>
                            <strong>{displayName}</strong>
                            <span>{since}</span>
                        </div>
                        <button type="button" aria-label="Edit profile" className="customer-dashboard-sidebar__profile-action" onClick={() => onNavChange?.("settings")}>
                            <Icon name="settings" size={16} />
                        </button>
                    </div>

                    <nav className="customer-dashboard-sidebar__nav">
                        {navigation.map((section) => (
                            <section key={section.sectionRef || section.items?.[0]?.id}>
                                <h3>{getLabel(labels, section.sectionRef, section.sectionRef)}</h3>
                                {(section.items || []).map((item) => {
                                    const isExpanded = shouldExpand(item);
                                    const hasChildren = item.children?.length > 0;
                                    return (
                                        <div key={item.id}>
                                            <button
                                                type="button"
                                                className={`customer-dashboard-sidebar__item${itemOrChildActive(item) ? " is-active" : ""}${item.disabled ? " is-disabled" : ""}`}
                                                disabled={item.disabled}
                                                onClick={() => handleNavClick(item)}
                                            >
                                                <div>
                                                    <Icon name={item.icon || "compass"} aria-hidden="true" />
                                                    <span>{getLabel(labels, item.labelRef, item.label)}</span>
                                                    {item.badge ? <b>{item.badge}</b> : null}
                                                    {hasChildren ? <Icon name={isExpanded ? "chevronDown" : "chevronRight"} className="customer-dashboard-sidebar__chevron" aria-hidden="true" /> : null}
                                                </div>
                                            </button>
                                            {hasChildren && isExpanded ? (
                                                <ul className="customer-dashboard-sidebar__sublist">
                                                    {item.children.map((child) => (
                                                        <li key={child.id || child.labelRef}>
                                                            <button
                                                                type="button"
                                                                className={`customer-dashboard-sidebar__subitem${activeNav === child.id ? " is-active" : ""}`}
                                                                onClick={() => onNavChange?.(child.id)}
                                                            >
                                                                {child.icon ? <Icon name={child.icon} aria-hidden="true" /> : null}
                                                                <span>{getLabel(labels, child.labelRef, child.label)}</span>
                                                            </button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : null}
                                        </div>
                                    );
                                })}
                            </section>
                        ))}
                    </nav>
                </aside>
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
            <button type="button" aria-label="Dismiss alert">×</button>
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
        <Panel className="dashboard-recent-bookings" title={getLabel(labels, props.titleRef, "Recent Booking")} action={<button type="button">Plane</button>}>
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
        <Panel className="dashboard-statistics" title={getLabel(labels, props.titleRef, "Booking Statistic")} action={<button type="button">January</button>}>
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
            <p>{props.comparison}</p>
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
        <Panel className="dashboard-chart" title={getLabel(labels, props.titleRef, "Recent Bookings")} action={<button type="button">2025</button>}>
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
        <Panel className="dashboard-compact-list" title={getLabel(labels, props.titleRef, type)} action={<button type="button">All</button>}>
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

function NotificationsPanel({ widget, labels }) {
    const props = getWidgetProps(widget);
    return (
        <Panel className="dashboard-notifications" title={getLabel(labels, props.titleRef, "Notifications")} action={<button type="button">All</button>}>
            {(props.items || []).map((item) => {
                const title = getLabel(labels, item.titleRef, item.title);
                return (
                <article className={`dashboard-notification${getToneClass(item.tone)}`} key={item.titleRef || title}>
                    <span><Icon name="bell" aria-hidden="true" /></span>
                    <div>
                        <strong>{title}</strong>
                        <p>{item.body}</p>
                    </div>
                    <time>{item.time}</time>
                </article>
                );
            })}
        </Panel>
    );
}

const DEFAULT_CHIPS = [
    { id: "tours", label: "Tours", active: true },
    { id: "flights", label: "Flights", disabled: true },
    { id: "hotels", label: "Hotels", disabled: true },
    { id: "experiences", label: "Experiences", disabled: true },
    { id: "visa", label: "Visa", disabled: true },
];

function FavoritesTourList() {
    const navigate = useNavigate();
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeChip, setActiveChip] = useState("tours");
    const [chips, setChips] = useState(DEFAULT_CHIPS);
    const [sort, setSort] = useState("recommended");

    const fetchFavorites = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetchData("/tours.json/favorites");
            if (res?.status === "success") {
                const data = res.componentData?.data || [];
                setFavorites(data);
                const structureChips = res.componentData?.structure?.widgets?.[0]?.props?.chips;
                if (structureChips) setChips(structureChips);
            } else {
                setError(res?.message || "Failed to load favorites");
            }
        } catch (err) {
            setError(err.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFavorites();
    }, [fetchFavorites]);

    const handleChipClick = (chipId) => {
        const chip = chips.find((c) => c.id === chipId);
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
                    <PortalPreloader type="cards" count={3} text="Loading favorites" />
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
                        <p>{error}</p>
                        <button type="button" className="dashboard-favorites__retry" onClick={fetchFavorites}>Try again</button>
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
                    <h1 className="dashboard-favorites__title">My Favorites</h1>
                    {hasFavorites && <span className="dashboard-favorites__count">{favorites.length} saved</span>}
                    <select className="dashboard-favorites__sort" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort tours">
                        <option value="recommended">Recommended</option>
                        <option value="price-asc">Price: Low to High</option>
                        <option value="price-desc">Price: High to Low</option>
                        <option value="rating">Top Rated</option>
                    </select>
                </header>

                <QuickChips
                    filters={chips}
                    activeId={activeChip}
                    onClick={handleChipClick}
                    className="dashboard-favorites__chips"
                />

                {!hasFavorites ? (
                    <EmptyState
                        icon="heart"
                        title="No favorites yet"
                        description="Start exploring tours and save the ones you love. Your favorites will appear here."
                    />
                ) : (
                    <div className="dashboard-favorites__grid">
                        {activeChip === "tours" && sorted.map((tour) => (
                            <TourCard key={tour._id || tour.id} tour={tour} variant="grid" onView={openTour} />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}

function BookingTable({ widget, labels, options, bookingState, bookingQuery, onBookingQueryChange }) {
    const props = getWidgetProps(widget);
    const rows = bookingState?.rows?.length || bookingState?.loading || bookingState?.error ? (bookingState?.rows || []) : (props.rows || []);
    const tableOptions = options || {};
    const dropdownItems = (tableOptions.sortOptions || ["Recommended"]).map((label) => ({ label, id: label }));
    const navigate = useNavigate();
    const total = Number(bookingState?.total || rows.length || 0);
    const limit = Number(bookingState?.limit || rows.length || 1);
    const page = Number(bookingQuery?.page || 1);
    const pageCount = Math.max(1, Math.ceil(total / limit));
    const summarySubtitle = bookingState
        ? `No of Booking : ${total}`
        : getLabel(labels, props.summary?.subtitleRef, props.summary?.subtitle);
    const updateQuery = (patch) => {
        onBookingQueryChange?.((prev) => ({ ...prev, page: 1, ...patch }));
    };

    return (
        <section className="dashboard-booking-table">
            <header className="dashboard-booking-table__summary">
                <div>
                    <h2>{getLabel(labels, props.summary?.titleRef, props.summary?.title || "Tour")}</h2>
                    <span>{summarySubtitle}</span>
                </div>
                <div>
                    <button type="button"><Icon name="calendar" aria-hidden="true" />{props.summary?.dateRange}</button>
                    <button type="button"><Icon name="share" aria-hidden="true" />Export <Icon name="chevronDown" aria-hidden="true" /></button>
                </div>
            </header>
            <div className="dashboard-booking-table__panel">
                <header className="dashboard-booking-table__toolbar">
                    <h2>{getLabel(labels, props.titleRef, "Booking List")}</h2>
                    <label>
                        <Icon name="search" aria-hidden="true" />
                        <input
                            value={bookingQuery?.search || ""}
                            placeholder={getLabel(labels, props.searchRef, "Search")}
                            onChange={(event) => updateQuery({ search: event.target.value })}
                        />
                    </label>
                    <select
                        aria-label={getLabel(labels, props.tourTypeRef, "Tour Type")}
                        value={bookingQuery?.tourType || "All"}
                        onChange={(event) => updateQuery({ tourType: event.target.value })}
                    >
                        {(tableOptions.tourTypeOptions || []).map((item) => <option key={item}>{item}</option>)}
                    </select>
                    <select
                        aria-label={getLabel(labels, props.statusRef, "Status")}
                        value={bookingQuery?.status || "All"}
                        onChange={(event) => updateQuery({ status: event.target.value })}
                    >
                        {(tableOptions.statusOptions || []).map((item) => <option key={item}>{item}</option>)}
                    </select>
                    <div className="dashboard-booking-table__sort">
                        <span>{getLabel(labels, props.sortByRef, "Sort By")} :</span>
                        <Dropdown
                            align="right"
                            hoverable={false}
                            items={dropdownItems.map((item) => ({
                                ...item,
                                onClick: () => updateQuery({ sort: item.label }),
                            }))}
                            trigger={() => <button type="button">{bookingQuery?.sort || "Recommended"} <Icon name="chevronDown" aria-hidden="true" /></button>}
                        />
                    </div>
                </header>
                {bookingState?.loading ? <div className="dashboard-booking-table__state">Loading bookings...</div> : null}
                {bookingState?.error ? <div className="dashboard-booking-table__state is-error">{bookingState.error}</div> : null}
                <div className="dashboard-table-scroll">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Tour & Type</th>
                                <th>Travellers</th>
                                <th>Days</th>
                                <th>Price</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th aria-label="Actions" />
                            </tr>
                        </thead>
                        <tbody>
                            {!bookingState?.loading && rows.map((row) => (
                                <tr key={row.id}>
                                    <td><strong className="dashboard-booking-table__id">{row.id}</strong></td>
                                    <td>
                                        <div className="dashboard-booking-table__tour">
                                            <img src={row.image} alt="" />
                                            <span><strong>{row.tour}</strong><small>{row.type}</small></span>
                                        </div>
                                    </td>
                                    <td>{row.travellers}</td>
                                    <td>{row.days}</td>
                                    <td>{row.price}</td>
                                    <td>{row.date}</td>
                                    <td><b className={statusClass(row.status)}>{row.status}</b></td>
                                    <td className="dashboard-booking-table__actions">
                                        <button
                                            type="button"
                                            aria-label={`View booking ${row.id}`}
                                            onClick={() => {
                                                if (row.bookingId) {
                                                    navigate(`/tours/bookings/${row.bookingId}`, { state: { from: { label: "Dashboard", path: "/dashboard", activeNav: "tours" } } });
                                                }
                                            }}
                                        >
                                            <Icon name="eye" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {!bookingState?.loading && rows.length === 0 ? (
                                <tr>
                                    <td colSpan={8}>
                                        <EmptyState
                                            icon="search"
                                            title="No bookings found"
                                            description="No bookings found for the selected filters."
                                        />
                                    </td>
                                </tr>
                            ) : null}
                        </tbody>
                    </table>
                </div>
                <footer className="dashboard-booking-table__footer">
                    <span>{getLabel(labels, props.showEntriesRef, "Show entries")} {rows.length} of {total}</span>
                    <div>
                        <button type="button" disabled={page <= 1} onClick={() => onBookingQueryChange?.((prev) => ({ ...prev, page: Math.max(1, page - 1) }))}>‹</button>
                        {Array.from({ length: Math.min(3, pageCount) }, (_, index) => {
                            const pageNumber = index + 1;
                            return (
                                <button
                                    type="button"
                                    key={pageNumber}
                                    className={pageNumber === page ? "is-active" : ""}
                                    onClick={() => onBookingQueryChange?.((prev) => ({ ...prev, page: pageNumber }))}
                                >
                                    {pageNumber}
                                </button>
                            );
                        })}
                        <button type="button" disabled={page >= pageCount} onClick={() => onBookingQueryChange?.((prev) => ({ ...prev, page: Math.min(pageCount, page + 1) }))}>›</button>
                    </div>
                </footer>
            </div>
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
    NotificationsPanel,
    RecentInvoices: (props) => <CompactServiceList {...props} type="Recent Invoices" />,
    BookingTable,
    SettingsForm: () => null,
};

const NAV_TAB_MAP = {
    dashboard: "dashboard",
    bookings: "mybookings",
    tours: "mybookings",
    favorites: "favorites",
    settings: "settings",
};

const STORAGE_KEY = "dashboard_activeNav";

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
                <button
                    type="button"
                    className={activeNav === "dashboard" ? "is-active" : ""}
                    onClick={() => onNavChange("dashboard")}
                >
                    <Icon name="user" />
                    <span>Profile</span>
                </button>
                <button type="button" className={bookingChildActive ? "is-active" : ""} onClick={() => setSheet("bookings")}>
                    <Icon name="suitcase" />
                    <span>My Bookings</span>
                </button>
                <button
                    type="button"
                    className={activeNav === "favorites" ? "is-active" : ""}
                    onClick={() => onNavChange("favorites")}
                >
                    <Icon name="heart" />
                    <span>Favorites</span>
                </button>
                <button type="button" onClick={() => setSheet("more")}>
                    <Icon name="moreVertical" />
                    <span>More</span>
                </button>
            </nav>

            <BottomSheet open={sheet === "bookings"} onClose={() => setSheet(null)} title="My Bookings">
                {bookingsItem?.children?.map((child) => (
                    <button
                        key={child.id}
                        type="button"
                        className="dashboard-mobile-sheet-item"
                        onClick={() => { onNavChange(child.id); setSheet(null); }}
                    >
                        <Icon name={child.icon || "compass"} />
                        <span>{getLabel(labels, child.labelRef, child.label)}</span>
                    </button>
                ))}
            </BottomSheet>

            <BottomSheet open={sheet === "more"} onClose={() => setSheet(null)} title="More">
                {moreSections.map((section) => (
                    <div key={section.sectionRef || section.items?.[0]?.id}>
                        <h4 className="dashboard-mobile-sheet-section">
                            {getLabel(labels, section.sectionRef, section.sectionRef)}
                        </h4>
                        {section.items.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                className={`dashboard-mobile-sheet-item${item.disabled ? " is-disabled" : ""}`}
                                disabled={item.disabled}
                                onClick={() => {
                                    if (!item.disabled) {
                                        onNavChange(item.id);
                                        setSheet(null);
                                    }
                                }}
                            >
                                <Icon name={item.icon || "compass"} />
                                <span>{getLabel(labels, item.labelRef, item.label)}</span>
                                {item.badge ? <b>{item.badge}</b> : null}
                            </button>
                        ))}
                    </div>
                ))}
            </BottomSheet>
        </>
    );
}

function SettingsForm({ widget, labels, profile, onProfileUpdate }) {
    const props = getWidgetProps(widget);
    const sections = props.sections || [];
    const [form, setForm] = useState({ name: "", avatar: "user", currentPassword: "", newPassword: "", confirmPassword: "" });
    const [saving, setSaving] = useState(null);
    const [toast, setToast] = useState(null);
    const [icons, setIcons] = useState([]);

    useEffect(() => {
        if (profile) {
            setForm((prev) => ({ ...prev, name: profile.name || "", avatar: profile.avatar || "user" }));
        }
    }, [profile]);

    useEffect(() => {
        fetchData("/auth/profile").then((res) => {
            if (res?.status === "success") {
                const profileData = res.componentData?.data;
                setIcons(res.componentData?.config?.icons || []);
                if (profileData && !profile) {
                    setForm((prev) => ({ ...prev, name: profileData.name || "", avatar: profileData.avatar || "user" }));
                    onProfileUpdate?.(profileData);
                }
            }
        }).catch(() => {});
    }, []);

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
            showToast("Passwords do not match", "error");
            return;
        }
        if (form.newPassword.length < 6) {
            showToast("Password must be at least 6 characters", "error");
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
                    <h2>{getLabel(labels, section.titleRef, section.id)}</h2>
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
                                                <button
                                                    key={icon}
                                                    type="button"
                                                    className={`dashboard-settings__icon-btn${form.avatar === icon ? " is-active" : ""}`}
                                                    onClick={() => setForm((prev) => ({ ...prev, avatar: icon }))}
                                                    title={icon}
                                                >
                                                    <Icon name={icon} />
                                                </button>
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
                        <button
                            type="button"
                            className="dashboard-settings__submit"
                            onClick={saveProfile}
                            disabled={saving === "profile"}
                        >
                            {saving === "profile" ? getLabel(labels, "btnUpdating", "Saving...") : getLabel(labels, "btnSave", "Save Changes")}
                        </button>
                    )}
                    {section.id === "password" && (
                        <button
                            type="button"
                            className="dashboard-settings__submit"
                            onClick={savePassword}
                            disabled={saving === "password"}
                        >
                            {saving === "password" ? getLabel(labels, "btnUpdating", "Saving...") : getLabel(labels, "btnSave", "Save Changes")}
                        </button>
                    )}
                </div>
            ))}
        </section>
    );
}

export default function DashboardPageView({ loading, error, labels, widgets, options, user, profile, onProfileUpdate, bookingState, bookingQuery, onBookingQueryChange }) {
    if (loading) return <GlobalLoader visible text="Loading dashboard" />;
    if (error) return <main className="customer-dashboard-page customer-dashboard-page--error">Error: {error}</main>;

    const location = useLocation();
    const shellWidget = widgets.find((widget) => widget.type === "CustomerDashboardShell");
    const contentWidgets = widgets.filter((widget) => widget.type !== "CustomerDashboardShell");
    const shellProps = getWidgetProps(shellWidget);
    const navigation = shellProps?.navigation || [];

    const [activeNav, setActiveNav] = useState(() => {
        if (location.state?.activeNav && NAV_TAB_MAP[location.state.activeNav]) return location.state.activeNav;
        const saved = sessionStorage.getItem(STORAGE_KEY);
        if (saved && NAV_TAB_MAP[saved]) return saved;
        return "dashboard";
    });

    useEffect(() => {
        sessionStorage.setItem(STORAGE_KEY, activeNav);
    }, [activeNav]);

    const activeTab = NAV_TAB_MAP[activeNav] || "dashboard";

    const breadcrumbItems = (() => {
        if (activeNav === "tours") {
            return [
                { label: getLabel(labels, "navDashboard", "Dashboard"), path: "/dashboard" },
                { label: getLabel(labels, "navBookings", "My Bookings") },
                { label: getLabel(labels, "navTours", "Tours") },
            ];
        }
        if (activeTab === "favorites") {
            return [
                { label: getLabel(labels, "navDashboard", "Dashboard"), path: "/dashboard" },
                { label: getLabel(labels, "navFavorites", "Favorites") },
            ];
        }
        if (activeTab === "settings") {
            return [
                { label: getLabel(labels, "navDashboard", "Dashboard"), path: "/dashboard" },
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
            banner={activeTab === "dashboard" ? "Dashboard data is placeholder while we integrate real-time bookings." : null}
        >
            <Breadcrumbs items={breadcrumbItems} />
            {activeTab === "favorites" ? (
                <FavoritesTourList />
            ) : activeTab === "settings" ? (
                <SettingsForm widget={settingsWidget} labels={labels} profile={profile} onProfileUpdate={onProfileUpdate} />
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
