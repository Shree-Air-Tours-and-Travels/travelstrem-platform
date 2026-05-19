import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import DataScopeResolver from "../../utils/dataScopeResolver.js";
import { validatePageContract } from "../../middleware/pageContractValidator.js";
import Booking from "../bookings/models/Booking.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, "../../data");

class PageDefinitionService {
  constructor(options = {}) {
    this.dataDir = options.dataDir || DATA_DIR;
    this.resolver = new DataScopeResolver({
      cache: options.cache !== false,
      cacheTtl: options.cacheTtl || 300000,
    });
    this.registry = null;
    this.sharedData = null;
    this.environmentOverrides = options.environmentOverrides || null;
  }

  _readJson(...segments) {
    const filePath = path.resolve(this.dataDir, ...segments);
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw);
  }

  _resolveFilePath(baseFile, relativeFile) {
    if (!relativeFile) return null;
    if (relativeFile.startsWith(".")) return path.resolve(path.dirname(baseFile), relativeFile);
    return path.resolve(this.dataDir, relativeFile);
  }

  _loadWidgetDefinition(pageFile, widgetRef) {
    const filePath = this._resolveFilePath(pageFile, widgetRef);
    if (!filePath) return null;
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw);
  }

  _expandWidgetRefs(pageDefinition, pageFile) {
    const pageComponent = pageDefinition?.component || {};
    const widgetEntries = pageComponent?.structure?.widgets || [];
    const expandedWidgets = [];
    const widgetContracts = [];

    widgetEntries.forEach((entry) => {
      if (!entry.widgetRef) {
        expandedWidgets.push(entry);
        return;
      }
      const widgetDefinition = this._loadWidgetDefinition(pageFile, entry.widgetRef);
      const widgetComponent = widgetDefinition?.component || {};
      widgetContracts.push(widgetComponent);
      expandedWidgets.push(...(widgetComponent?.structure?.widgets || []));
    });

    return {
      status: pageDefinition.status,
      component: {
        data: { ...pageComponent.data },
        dataScope: {
          options: Object.assign(
            {},
            pageComponent?.dataScope?.options || {},
            ...widgetContracts.map((widget) => widget?.dataScope?.options || {}),
          ),
        },
        elements: {
          labels: Object.assign(
            {},
            pageComponent?.elements?.labels || {},
            ...widgetContracts.map((widget) => widget?.elements?.labels || {}),
          ),
          urls: Object.assign(
            {},
            pageComponent?.elements?.urls || {},
            ...widgetContracts.map((widget) => widget?.elements?.urls || {}),
          ),
        },
        structure: {
          header: pageComponent?.structure?.header || {},
          widgets: expandedWidgets,
          config: {
            ...(pageComponent?.structure?.config || {}),
            ...Object.assign({}, ...widgetContracts.map((widget) => widget?.structure?.config || {})),
          },
          actions: [
            ...(pageComponent?.structure?.actions || []),
            ...widgetContracts.flatMap((widget) => widget?.structure?.actions || []),
          ],
        },
      },
    };
  }

  _loadRegistry() {
    if (!this.registry) {
      this.registry = this._readJson("index.json");
    }
    return this.registry;
  }

  _loadShared() {
    if (!this.sharedData) {
      try {
        this.sharedData = this._readJson("shared", "shared.json");
      } catch {
        this.sharedData = { elements: { labels: {}, urls: {} } };
      }
    }
    return this.sharedData;
  }

  getRegisteredPages() {
    const registry = this._loadRegistry();
    return { ...registry.pages };
  }

  getPathMap() {
    const registry = this._loadRegistry();
    return { ...registry.pathMap };
  }

  getAliases() {
    const registry = this._loadRegistry();
    return { ...registry.aliases };
  }

  resolvePageKey(pageKey) {
    const registry = this._loadRegistry();
    if (registry.pages[pageKey]) return pageKey;

    const alias = registry.aliases[pageKey];
    if (alias && registry.pages[alias]) return alias;

    const pathEntry = registry.pathMap[pageKey];
    if (pathEntry && registry.pages[pathEntry]) return pathEntry;

    return registry.defaultPage || "customer-shell/home";
  }

  loadPageDefinition(pageKey, overrides = {}) {
    const resolvedKey = this.resolvePageKey(pageKey);
    const registry = this._loadRegistry();
    const entry = registry.pages[resolvedKey];

    if (!entry) {
      throw new Error(`Page definition not found: ${pageKey} (resolved: ${resolvedKey})`);
    }

    let pageDefinition;
    try {
      pageDefinition = this._readJson(entry.file);
    } catch (err) {
      throw new Error(`Failed to load page file for ${resolvedKey}: ${err.message}`);
    }

    const pageFile = path.resolve(this.dataDir, entry.file);
    const expandedPageDefinition = this._expandWidgetRefs(pageDefinition, pageFile);
    const remoteOverrides = overrides.remoteOverrides || {};
    const featureOverrides = overrides.featureOverrides || {};
    const merged = this.resolver.resolve({
      shared: this._loadShared(),
      page: expandedPageDefinition,
      remoteOverrides,
      featureOverrides,
    });
    validatePageContract(merged);

    return {
      pageKey: resolvedKey,
      app: entry.app,
      page: entry.page,
      definition: merged,
    };
  }

  async resolvePage(req, res, pageKey, options = {}) {
    const {
      remoteOverrides,
      featureOverrides,
      injectData,
      injectDataScope,
      injectLabels,
      injectUrls,
      authUser,
      statusCode = 200,
    } = options;

    const resolvedKey = this.resolvePageKey(pageKey);
    const resolved = this.loadPageDefinition(resolvedKey, { remoteOverrides, featureOverrides });

    const payload = {
      status: resolved.definition.status,
      component: resolved.definition.component,
    };

    if (injectData) {
      payload.component.data = {
        ...payload.component.data,
        ...injectData,
      };
    }
    if (injectDataScope) {
      payload.component.dataScope = {
        options: {
          ...payload.component.dataScope.options,
          ...injectDataScope.options,
        },
      };
    }

    if (injectLabels) {
      payload.component.elements.labels = {
        ...payload.component.elements.labels,
        ...injectLabels,
      };
    }

    if (injectUrls) {
      payload.component.elements.urls = {
        ...payload.component.elements.urls,
        ...injectUrls,
      };
    }

    if (authUser?.userId && resolvedKey === "customer-shell/dashboard") {
      try {
        const { widgets: hydrated, labels: extraLabels } = await this._hydrateDashboardWidgets(
          payload.component.structure.widgets,
          authUser.userId,
        );
        payload.component.structure.widgets = hydrated;
        Object.assign(payload.component.elements.labels, extraLabels);
      } catch (err) {
        console.error("[PageDefinitionService] Dashboard hydration error:", err.message);
      }
    }

    return res.status(statusCode).json(payload);
  }

  buildPageResponse(pageKey, options = {}) {
    const {
      remoteOverrides,
      featureOverrides,
      injectData,
      injectDataScope,
      injectLabels,
      injectUrls,
    } = options;

    const resolvedKey = this.resolvePageKey(pageKey);
    const resolved = this.loadPageDefinition(resolvedKey, { remoteOverrides, featureOverrides });

    const payload = {
      status: resolved.definition.status,
      component: {
        data: {
          ...resolved.definition.component.data,
          ...injectData,
        },
        dataScope: {
          options: {
            ...resolved.definition.component.dataScope.options,
            ...injectDataScope?.options,
          },
        },
        elements: {
          labels: {
            ...resolved.definition.component.elements.labels,
            ...injectLabels,
          },
          urls: {
            ...resolved.definition.component.elements.urls,
            ...injectUrls,
          },
        },
        structure: resolved.definition.component.structure,
      },
    };

    return payload;
  }

  renderLabelsOnly(pageKey, options = {}) {
    const resolved = this.loadPageDefinition(pageKey, options);
    return {
      status: "success",
      component: {
        elements: {
          labels: resolved.definition.component.elements.labels,
        },
      },
    };
  }

  buildWidgetResponse(pageKey, widgetRef, options = {}) {
    const resolvedKey = this.resolvePageKey(pageKey);
    const registry = this._loadRegistry();
    const entry = registry.pages[resolvedKey];
    const pageFile = path.resolve(this.dataDir, entry.file);
    const widgetDefinition = this._loadWidgetDefinition(pageFile, widgetRef);
    const merged = this.resolver.resolve({
      shared: this._loadShared(),
      page: widgetDefinition,
      remoteOverrides: options.remoteOverrides,
      featureOverrides: options.featureOverrides,
    });
    validatePageContract(merged);
    return {
      status: merged.status,
      component: {
        data: { ...merged.component.data, ...options.injectData },
        dataScope: {
          options: {
            ...merged.component.dataScope.options,
            ...options.injectDataScope?.options,
          },
        },
        elements: {
          labels: { ...merged.component.elements.labels, ...options.injectLabels },
          urls: { ...merged.component.elements.urls, ...options.injectUrls },
        },
        structure: merged.component.structure,
      },
    };
  }

  /* ------------------------------------------------------------------ */
  /*  Dashboard hydration — replaces mock widget data with live         */
  /* ------------------------------------------------------------------ */

  _mapBookingStatus(status) {
    const map = {
      DRAFT: "Pending",
      QUOTE_REQUESTED: "Pending",
      UNDER_REVIEW: "Pending",
      QUOTE_READY: "Pending",
      QUOTE_SENT: "Pending",
      CUSTOMER_ACCEPTED: "Upcoming",
      CUSTOMER_REJECTED: "Cancelled",
      PAYMENT_PENDING: "Pending",
      PARTIALLY_PAID: "Upcoming",
      PAID: "Upcoming",
      CONFIRMED: "Upcoming",
      TICKETING: "Upcoming",
      TICKETED: "Upcoming",
      TRAVEL_READY: "Upcoming",
      COMPLETED: "Completed",
      CANCELLED: "Cancelled",
      REFUND_PENDING: "Cancelled",
      REFUNDED: "Cancelled",
    };
    return map[status] || "Pending";
  }

  _formatPrice(amount) {
    if (amount == null || isNaN(amount)) return "$0";
    return `$${Number(amount).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  }

  _formatDate(date) {
    if (!date) return "N/A";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "N/A";
    return d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
  }

  _formatTime(date) {
    if (!date) return "";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  }

  _calcDays(booking) {
    if (!booking.travelWindow?.startDate || !booking.travelWindow?.endDate) return "N/A";
    const start = new Date(booking.travelWindow.startDate);
    const end = new Date(booking.travelWindow.endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return "N/A";
    const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    return `${diff} Day${diff !== 1 ? "s" : ""}`;
  }

  _bookingTourType(booking) {
    if (booking.tour?.tags && booking.tour.tags.length > 0) return booking.tour.tags[0];
    if (booking.tour?.city?.to) return `${booking.tour.city.to} Tour`;
    return "Custom Tour";
  }

  _bookingImage(booking) {
    return booking.tour?.photo || "https://res.cloudinary.com/dofxshf3z/image/upload/v1779131576/tour-img01_tljj0m.jpg";
  }

  _hydrateBookingTable(widget, bookings) {
    return {
      ...widget,
      props: {
        ...widget.props,
        summary: {
          ...widget.props.summary,
          dateRange: bookings.length > 0
            ? `${this._formatDate(bookings[bookings.length - 1].createdAt)} - ${this._formatDate(bookings[0].createdAt)}`
            : widget.props.summary.dateRange,
        },
        rows: bookings.map((b) => {
          const tourId = b.tour?._id || null;
          return {
            id: `#${b.bookingRef || b._id}`,
            tour: b.tour?.title || "Unknown Tour",
            type: this._bookingTourType(b),
            travellers: `${b.guestsCount || 1} Guest${(b.guestsCount || 1) !== 1 ? "s" : ""}`,
            days: this._calcDays(b),
            price: this._formatPrice(b.priceSnapshot?.total),
            date: this._formatDate(b.travelWindow?.startDate || b.createdAt),
            status: this._mapBookingStatus(b.status),
            image: this._bookingImage(b),
            tourId: tourId ? String(tourId) : null,
          };
        }),
      },
    };
  }

  _hydrateRecentBookings(widget, bookings) {
    const recent = bookings.slice(0, 5);
    return {
      ...widget,
      props: {
        ...widget.props,
        items: recent.map((b) => ({
          id: b.bookingRef || b._id,
          name: b.tour?.title || "Unknown Tour",
          type: this._bookingTourType(b),
          date: this._formatDate(b.createdAt),
          time: this._formatTime(b.createdAt),
          status: this._mapBookingStatus(b.status),
          image: this._bookingImage(b),
        })),
      },
    };
  }

  _hydrateMetrics(widget, bookings) {
    const totalBookings = bookings.length;
    const totalSpent = bookings.reduce((sum, b) => sum + (b.priceSnapshot?.total || 0), 0);
    const avgSpent = totalBookings > 0 ? totalSpent / totalBookings : 0;

    return {
      ...widget,
      props: {
        ...widget.props,
        items: [
          { id: "bookings", labelRef: "metricTotalBookings", value: String(totalBookings), icon: "calendar", tone: "danger" },
          { id: "transactions", labelRef: "metricTotalTransactions", value: this._formatPrice(totalSpent), icon: "coin", tone: "olive" },
          { id: "average", labelRef: "metricAverageValue", value: this._formatPrice(avgSpent), icon: "wallet", tone: "primary" },
        ],
      },
    };
  }

  _hydrateBookingStatistics(widget, bookings, extraLabels) {
    const totalSpent = bookings.reduce((sum, b) => sum + (b.priceSnapshot?.total || 0), 0);
    const totalBookings = bookings.length;
    const completedBookings = bookings.filter((b) => b.status === "COMPLETED" || b.status === "CONFIRMED").length;
    const pendingBookings = bookings.filter((b) => !["COMPLETED", "CANCELLED", "REFUNDED"].includes(b.status)).length;
    const cancelledBookings = bookings.filter((b) => ["CANCELLED", "REFUNDED", "REFUND_PENDING"].includes(b.status)).length;

    const segments = [];
    if (totalBookings > 0) {
      const completedPct = Math.round((completedBookings / totalBookings) * 100) || 1;
      const pendingPct = Math.round((pendingBookings / totalBookings) * 100) || 1;
      const cancelledPct = Math.round((cancelledBookings / totalBookings) * 100) || 1;

      segments.push({ labelRef: "h_segmentCompleted", value: completedPct, tone: "primary" });
      segments.push({ labelRef: "h_segmentPending", value: pendingPct, tone: "olive" });
      segments.push({ labelRef: "h_segmentCancelled", value: cancelledPct, tone: "danger" });

      extraLabels.h_segmentCompleted = "Completed";
      extraLabels.h_segmentPending = "Pending";
      extraLabels.h_segmentCancelled = "Cancelled";
    }

    return {
      ...widget,
      props: {
        ...widget.props,
        amount: this._formatPrice(totalSpent),
        segments,
      },
    };
  }

  async _hydrateDashboardWidgets(widgets, userId) {
    if (!widgets || !widgets.length) return { widgets, labels: {} };

    let bookings;
    try {
      bookings = await Booking.find({ user: userId })
        .populate("tour")
        .sort({ createdAt: -1 })
        .lean();
    } catch (err) {
      console.error("[PageDefinitionService] Failed to fetch bookings:", err.message);
      return { widgets, labels: {} };
    }

    const extraLabels = {};
    const hydrated = widgets.map((widget) => {
      switch (widget.type) {
        case "BookingTable":
          extraLabels.tableSummarySubtitle = `No of Booking : ${bookings.length}`;
          return this._hydrateBookingTable(widget, bookings);
        case "RecentBookings":
          return this._hydrateRecentBookings(widget, bookings);
        case "DashboardMetrics":
          return this._hydrateMetrics(widget, bookings);
        case "BookingStatistics":
          return this._hydrateBookingStatistics(widget, bookings, extraLabels);
        default:
          return widget;
      }
    });

    return { widgets: hydrated, labels: extraLabels };
  }

  clearCache() {
    this.registry = null;
    this.sharedData = null;
    this.resolver.clearCache();
  }

  reloadRegistry() {
    this.registry = null;
    this.sharedData = null;
    return this._loadRegistry();
  }
}

const singleton = new PageDefinitionService();

export { PageDefinitionService };
export default singleton;
