import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchData } from "@packages/trem-utils";
import {
  Button,
  Breadcrumbs,
  Dropdown,
  EmptyState,
  InputField,
  SubTitle,
  TourCard,
} from "@packages/trem-ui";
import { deleteAgentTour, deleteAllAgentTours } from "../../../../services/agentService";
import { TourCardSkeleton, WidgetError } from "../../../../shared/Skeleton";
import { useAgentPortalConfig } from "../../../../app/providers/AgentPortalProvider";
import { AGENT_ROLE, ADMIN_ROLE } from "../tours.constants";
import "./ToursListPage.styles.scss";

const PAGE_KEY = "agent-shell/services/tours-management";

const labelFor = (labels, ref) => (ref && labels?.[ref]) || "";

export default function ToursListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAgentPortalConfig();
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [sortOpen, setSortOpen] = useState(false);

  /* Backend-driven page definition + widget metadata (labels live on the
     server; this view only resolves refs and renders). The listing widget is
     intentionally excluded here — it is fetched WITH its data in a single
     call below, so no separate metadata round trip is made. */
  const [pageStructure, setPageStructure] = useState(null);
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
        const filterResponse = filterRef
          ? await fetchData(`/${filterRef.split("/").pop()}?pageKey=${PAGE_KEY}&metadataOnly=true`)
          : null;
        if (!active) return;
        setPageStructure(pageResponse?.component?.structure || null);
        setFilterWidget(filterResponse?.component || null);
      } catch (e) {
        if (active) setConfigError(e.message || "Page configuration could not be loaded");
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  /* Single data-bearing call: the listing widget returns labels + config +
     the agent-scoped tours in one response. Re-run on search/sort changes
     (debounced while typing) so filtering never needs a second endpoint. */
  const loadListing = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          pageKey: PAGE_KEY,
          query: searchQuery,
          sort: sortBy,
        });
        const response = await fetchData(`/tour-management-listing.json?${params}`);
        setTours(response?.component?.data?.tours || []);
        setListingWidget(response?.component || null);
      } catch (e) {
        setError(e.message || "Failed to load tours");
      } finally {
        setLoading(false);
      }
    },
    [searchQuery, sortBy],
  );

  const previousQuery = useRef(searchQuery);
  useEffect(() => {
    const queryChanged = previousQuery.current !== searchQuery;
    previousQuery.current = searchQuery;
    const timer = window.setTimeout(() => loadListing(), queryChanged ? 400 : 0);
    return () => window.clearTimeout(timer);
  }, [loadListing, searchQuery, sortBy]);

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

  const sortOptions = useMemo(
    () =>
      (filterConfig.sort?.options || []).map((opt) => ({
        id: opt.id,
        label: labelFor(filterLabels, opt.labelRef),
        active: sortBy === opt.id,
        onClick: () => {
          setSortBy(opt.id);
          setSortOpen(false);
        },
      })),
    [filterConfig.sort?.options, filterLabels, sortBy],
  );

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
  };

  const role = session?.user?.role;
  const isAgent = role === AGENT_ROLE;
  const isAdmin = role === ADMIN_ROLE;
  const userId = session?.user?.sub || session?.user?.id;

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
      const ownerId = tour.ownerAgent?._id || tour.ownerAgent;
      return !!(isAdmin || (isAgent && userId && ownerId && String(ownerId) === String(userId)));
    },
    [isAdmin, isAgent, userId],
  );

  const handleView = useCallback(
    (tour) => {
      const id = tour?._id || tour?.id;
      if (id) navigate(`/agent/services/tours/${encodeURIComponent(id)}/view`);
    },
    [navigate],
  );

  const handleEdit = useCallback(
    (tour) => {
      const id = tour?._id || tour?.id;
      if (id) navigate(`/agent/services/tours/${encodeURIComponent(id)}/edit`);
    },
    [navigate],
  );

  const handleCreate = useCallback(() => {
    navigate("builder");
  }, [navigate]);

  const handleDelete = useCallback(
    (tour) => {
      const id = tour._id || tour.id;
      const name = tour.title || tour.name || id;
      const template =
        labelFor(listingLabels, "confirmDeleteSingle") ||
        'Delete "{{name}}"? This cannot be undone.';
      if (window.confirm(template.replace("{{name}}", name))) {
        deleteAgentTour(id)
          .then(() => loadListing())
          .catch((e) => setError(e.message));
      }
    },
    [loadListing, listingLabels],
  );

  const handleDeleteAll = useCallback(() => {
    const template = labelFor(listingLabels, "confirmDeleteAll");
    if (window.confirm(template)) {
      deleteAllAgentTours()
        .then(() => loadListing())
        .catch((e) => setError(e.message));
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
      <header className="services-tours-page__toolbar">
        <SubTitle text={labelFor(filterLabels, filterWidget?.structure?.header?.titleRef)} />
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
            isActive={sortOpen}
            onToggle={setSortOpen}
            trigger={
              <Button
                variant="outline"
                color="primary"
                iconRight="chevronDown"
                text={`${sortOptions.find((o) => o.active)?.label}`}
              />
            }
            items={sortOptions}
          />
        </div>
      </div>
      {(configError || error) && <WidgetError message={configError || error} />}
      <div className="services-tours-page__list">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <TourCardSkeleton key={i} />)
        ) : tours.length === 0 ? (
          <EmptyState
            icon={emptyState.icon}
            title={emptyState.title}
            description={emptyState.description}
          />
        ) : (
          tours.map((t) => (
            <TourCard
              key={t._id || t.id}
              tour={t}
              variant="management"
              isAdmin={cardConfig.isAdmin}
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
