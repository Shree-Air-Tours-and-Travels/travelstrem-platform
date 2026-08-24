import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchData } from "@packages/trem-utils";
import { showRealtimeToast } from "@packages/trem-events";
import {
  Button,
  Breadcrumbs,
  Dropdown,
  EmptyState,
  InputField,
  SubTitle,
  TourCard,
} from "@packages/trem-ui";
import {
  deleteAgentTour,
  deleteAllAgentTours,
  fetchAgentTours,
} from "../../../../services/agentService";
import { TourCardSkeleton, WidgetError } from "../../../../shared/Skeleton";
import { useAgentPortalConfig } from "../../../../app/providers/AgentPortalProvider";
import { AGENT_ROLE, ADMIN_ROLE } from "../tours.constants";
import "./ToursListPage.styles.scss";

const PAGE_KEY = "agent-shell/services/tours-management";
const MANAGEMENT_STATUS_OPTIONS = [
  { id: "", label: "All statuses" },
  { id: "draft", label: "Draft" },
  { id: "pending_approval", label: "Pending approval" },
  { id: "published", label: "Published" },
  { id: "unpublished", label: "Unpublished" },
  { id: "cancelled", label: "Cancelled" },
];

const labelFor = (labels, ref) => (ref && labels?.[ref]) || "";

const resolveBufferedId = (value) => {
  const buffer = value?.buffer;
  if (!buffer || typeof buffer !== "object") return "";
  const bytes = Array.isArray(buffer)
    ? buffer
    : Object.keys(buffer)
        .filter((key) => /^\d+$/.test(key))
        .sort((a, b) => Number(a) - Number(b))
        .map((key) => buffer[key]);
  if (
    bytes.length !== 12 ||
    bytes.some((byte) => !Number.isInteger(byte) || byte < 0 || byte > 255)
  )
    return "";
  return bytes.map((byte) => byte.toString(16).padStart(2, "0")).join("");
};

const resolveEntityId = (value) => {
  if (value == null) return "";
  if (["string", "number"].includes(typeof value)) return String(value);
  if (typeof value === "object") {
    if (typeof value.toHexString === "function") return value.toHexString();
    return (
      resolveEntityId(value._id) ||
      resolveEntityId(value.id) ||
      resolveEntityId(value.$oid) ||
      resolveEntityId(value.value) ||
      resolveBufferedId(value)
    );
  }
  return "";
};

const resolveTourId = (tour) => resolveEntityId(tour?._id) || resolveEntityId(tour?.id);

export default function ToursListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAgentPortalConfig();
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [statusOpen, setStatusOpen] = useState(false);
  const listingRequestRef = useRef({ sequence: 0, controller: null });

  /* Backend-driven page definition and widget metadata. Tour records are
     loaded separately from the authenticated /tours.json endpoint below. */
  const [pageStructure, setPageStructure] = useState(null);
  const [pageLabels, setPageLabels] = useState({});
  const [filterWidget, setFilterWidget] = useState(null);
  const [listingWidget, setListingWidget] = useState(null);
  const [configError, setConfigError] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const pageResponse = await fetchData("/tours-management-page.json");
        const widgets = pageResponse?.component?.structure?.widgets || [];
        const filterRef =
          widgets.find((w) => w.type === "tourManagementFilters")?.widgetRef || null;
        const listingRef =
          widgets.find((w) => w.type === "tourManagementListing")?.widgetRef || null;
        const [filterResponse, listingResponse] = await Promise.all([
          filterRef
            ? fetchData(`/${filterRef.split("/").pop()}`, {
                params: { pageKey: PAGE_KEY, metadataOnly: true },
              })
            : null,
          listingRef
            ? fetchData(`/${listingRef.split("/").pop()}`, {
                params: { pageKey: PAGE_KEY, metadataOnly: true },
              })
            : null,
        ]);
        if (!active) return;
        if (pageResponse?.status !== "success") {
          throw new Error(pageResponse?.message || "Page configuration could not be loaded");
        }
        if (filterResponse && filterResponse.status !== "success") {
          throw new Error(filterResponse.message || "Tour filters could not be loaded");
        }
        if (listingResponse && listingResponse.status !== "success") {
          throw new Error(listingResponse.message || "Tour listing could not be loaded");
        }
        setPageStructure(pageResponse?.component?.structure || null);
        setPageLabels(pageResponse?.component?.elements?.labels || {});
        setFilterWidget(filterResponse?.component || null);
        setListingWidget(listingResponse?.component || null);
      } catch (e) {
        if (active) setConfigError(e.message || "Page configuration could not be loaded");
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  /* Tour data always comes from the authenticated management endpoint. The
     explicit `scope=mine` contract keeps partner admins and regular agents on
     their own inventory while search/sort are applied by MongoDB. */
  const loadListing = useCallback(
    async ({ silent = false } = {}) => {
      const sequence = listingRequestRef.current.sequence + 1;
      listingRequestRef.current.controller?.abort();
      const controller = new AbortController();
      listingRequestRef.current = { sequence, controller };
      if (!silent) setLoading(true);
      setError(null);
      try {
        const nextTours = await fetchAgentTours({
          signal: controller.signal,
          scope: "mine",
          query: searchQuery,
          sort: "newest",
          status: statusFilter,
        });
        if (listingRequestRef.current.sequence !== sequence) return;
        setTours(Array.isArray(nextTours) ? nextTours : []);
      } catch (e) {
        if (controller.signal.aborted || listingRequestRef.current.sequence !== sequence) return;
        setError(e.message || "Failed to load tours");
      } finally {
        if (listingRequestRef.current.sequence === sequence) setLoading(false);
      }
    },
    [searchQuery, statusFilter],
  );

  const previousQuery = useRef(searchQuery);
  useEffect(() => {
    const queryChanged = previousQuery.current !== searchQuery;
    previousQuery.current = searchQuery;
    const timer = window.setTimeout(() => loadListing(), queryChanged ? 400 : 0);
    return () => window.clearTimeout(timer);
  }, [loadListing, searchQuery, statusFilter]);

  useEffect(
    () => () => {
      listingRequestRef.current.controller?.abort();
    },
    [],
  );

  const filterLabels = useMemo(
    () => filterWidget?.elements?.labels || {},
    [filterWidget?.elements?.labels],
  );
  const listingLabels = useMemo(
    () => listingWidget?.elements?.labels || {},
    [listingWidget?.elements?.labels],
  );
  const filterActions = filterWidget?.structure?.actions || [];
  const filterConfig = filterWidget?.structure?.config || {};
  const listingConfig = listingWidget?.structure?.config || {};

  const statusOptions = useMemo(() => {
    const configured = (filterConfig.status?.options || []).map((opt) => ({
      id: opt.id,
      label: labelFor(filterLabels, opt.labelRef),
    }));
    return (configured.length ? configured : MANAGEMENT_STATUS_OPTIONS).map((opt) => ({
      id: opt.id,
      label: opt.label,
      active: statusFilter === opt.id,
      onClick: () => {
        setStatusFilter(opt.id);
        setStatusOpen(false);
      },
    }));
  }, [filterConfig.status?.options, filterLabels, statusFilter]);

  const searchPlaceholder = useMemo(
    () => labelFor(filterLabels, filterConfig.search?.placeholderRef),
    [filterConfig.search?.placeholderRef, filterLabels],
  );

  const breadcrumbs = pageStructure?.config?.breadcrumbs || [];
  const emptyState = {
    icon: listingConfig.emptyState?.icon || "map",
    title: labelFor(listingLabels, listingConfig.emptyState?.titleRef),
    description: labelFor(listingLabels, listingConfig.emptyState?.descriptionRef),
  };
  const cardConfig = {
    isAdmin: Boolean(listingConfig.card?.isAdmin),
    showOwner: listingConfig.card?.showOwner !== false,
    ownershipMode: listingConfig.card?.ownershipMode || "agent",
    ownershipLabel:
      labelFor(listingLabels, listingConfig.card?.ownershipLabelRef) || "Added by agent",
    size: listingConfig.card?.size || "dense",
  };
  const pageTitle =
    labelFor(filterLabels, filterWidget?.structure?.header?.titleRef) ||
    pageLabels.pageTitle ||
    "Tours Management";
  const pageSubtitle =
    labelFor(pageLabels, pageStructure?.header?.subtitleRef) ||
    pageLabels.pageSubtitle ||
    "Manage tour inventory, publishing state, pricing and traveller-facing content.";
  const tourStats = useMemo(() => {
    const items = Array.isArray(tours) ? tours : [];
    return [
      {
        id: "total",
        label: pageLabels.totalTours || "Total tours",
        value: items.length,
      },
      {
        id: "published",
        label: pageLabels.publishedTours || "Published",
        value: items.filter(
          (tour) => String(tour.status || "published").toLowerCase() === "published",
        ).length,
      },
      {
        id: "featured",
        label: pageLabels.featuredTours || "Featured",
        value: items.filter((tour) => tour.featured).length,
      },
      {
        id: "draft",
        label: pageLabels.draftTours || "Drafts",
        value: items.filter(
          (tour) =>
            String(tour.status || "").toLowerCase() === "draft" || tour.isPublished === false,
        ).length,
      },
    ];
  }, [pageLabels, tours]);

  const role = session?.user?.role;
  const isAgent = role === AGENT_ROLE;
  const isAdmin = role === ADMIN_ROLE;
  const userId =
    resolveEntityId(session?.user?._id) ||
    resolveEntityId(session?.user?.sub) ||
    resolveEntityId(session?.user?.id);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("create") === "true") {
      navigate("/agent/services/tours/builder", { replace: true });
      return undefined;
    }

    return undefined;
  }, [location.search, navigate]);

  const canDeleteTour = useCallback(
    (tour) => {
      const ownerId = resolveEntityId(tour.ownerAgent);
      return !!(isAdmin || (isAgent && userId && ownerId && String(ownerId) === String(userId)));
    },
    [isAdmin, isAgent, userId],
  );

  const handleView = useCallback(
    (tour) => {
      const id = resolveTourId(tour);
      if (id) {
        navigate(`/agent/services/tours/${encodeURIComponent(id)}/view`);
        return;
      }
      showRealtimeToast({ title: "This tour has no valid identifier.", status: "error" });
    },
    [navigate],
  );

  const handleEdit = useCallback(
    (tour) => {
      const id = resolveTourId(tour);
      if (id) {
        navigate(`/agent/services/tours/${encodeURIComponent(id)}/edit`);
        return;
      }
      showRealtimeToast({ title: "This tour has no valid identifier.", status: "error" });
    },
    [navigate],
  );

  const handleCreate = useCallback(() => {
    navigate("builder");
  }, [navigate]);

  const handleDelete = useCallback(
    (tour) => {
      const id = resolveTourId(tour);
      if (!id) return;
      const name = tour.title || tour.name || id;
      const template =
        labelFor(listingLabels, "confirmDeleteSingle") ||
        'Delete "{{name}}"? This cannot be undone.';
      if (window.confirm(template.replace("{{name}}", name))) {
        deleteAgentTour(id)
          .then(() => {
            showRealtimeToast({ title: "Tour deleted", status: "success" });
            return loadListing();
          })
          .catch((e) => {
            setError(e.message);
            showRealtimeToast({ title: e.message || "Delete failed", status: "error" });
          });
      }
    },
    [loadListing, listingLabels],
  );

  const handleDeleteAll = useCallback(() => {
    const template = labelFor(listingLabels, "confirmDeleteAll");
    if (window.confirm(template)) {
      deleteAllAgentTours()
        .then(() => {
          showRealtimeToast({ title: "Tours deleted", status: "success" });
          return loadListing();
        })
        .catch((e) => {
          setError(e.message);
          showRealtimeToast({ title: e.message || "Delete failed", status: "error" });
        });
    }
  }, [loadListing, listingLabels]);

  const actionHandlers = useMemo(
    () => ({
      create: handleCreate,
      deleteAll: handleDeleteAll,
      refresh: () => loadListing(),
    }),
    [handleCreate, handleDeleteAll, loadListing],
  );

  return (
    <section className="services-tours-page">
      <Breadcrumbs items={breadcrumbs} className="services-tours-page__breadcrumbs" />
      <header className="services-tours-page__hero">
        <div className="services-tours-page__hero-copy">
          <span className="services-tours-page__eyebrow">Agent workspace</span>
          <SubTitle text={pageTitle} />
          <p>{pageSubtitle}</p>
        </div>
        <div className="services-tours-page__actions">
          {filterActions
            .filter((action) => !action.requiresAdmin || isAdmin)
            .map((action) => (
              <Button
                key={action.name}
                variant={action.variant}
                color={action.color}
                iconLeft={action.iconLeft}
                onClick={actionHandlers[action.name]}
                text={labelFor(filterLabels, action.labelRef)}
              />
            ))}
        </div>
      </header>

      <div className="services-tours-page__stats" aria-label="Tour management summary">
        {tourStats.map((stat) => (
          <article className="services-tours-page__stat" key={stat.id}>
            <span>{stat.value}</span>
            <small>{stat.label}</small>
          </article>
        ))}
      </div>

      <div className="services-tours-page__control-card">
        <div className="services-tours-page__filters">
          <InputField
            value={searchQuery}
            onChange={(val) => setSearchQuery(val)}
            placeholder={searchPlaceholder}
          />
          <div className="services-tours-page__sort">
            <Dropdown
              align="right"
              variant="default"
              isActive={statusOpen}
              onToggle={setStatusOpen}
              trigger={
                <Button
                  variant="outline"
                  color="primary"
                  iconRight="chevronDown"
                  text={`${statusOptions.find((o) => o.active)?.label || "All statuses"}`}
                />
              }
              items={statusOptions}
            />
          </div>
        </div>
        <div className="services-tours-page__list-meta">
          <strong>{tours.length}</strong>
          <span>{tours.length === 1 ? "tour" : "tours"} in this view</span>
        </div>
      </div>

      {(configError || error) && <WidgetError message={configError || error} />}
      <div className="services-tours-page__list">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <TourCardSkeleton key={i} />)
        ) : tours.length === 0 ? (
          <EmptyState
            className="services-tours-page__empty"
            icon={emptyState.icon}
            title={emptyState.title}
            description={emptyState.description}
          />
        ) : (
          tours.map((t) => (
            <TourCard
              key={resolveTourId(t)}
              tour={t}
              variant="management"
              isAdmin={cardConfig.isAdmin}
              managementActions
              size={cardConfig.size}
              showOwner={cardConfig.showOwner}
              ownershipMode={cardConfig.ownershipMode}
              ownershipLabels={{ agent: cardConfig.ownershipLabel }}
              ownerAgentName={t.ownerAgentName || ""}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={canDeleteTour(t) ? handleDelete : undefined}
            />
          ))
        )}
      </div>
    </section>
  );
}
