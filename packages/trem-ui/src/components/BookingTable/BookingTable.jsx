import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import PropTypes from "prop-types";

import Button from "../Button/Button.jsx";
import Dropdown from "../Dropdown/Dropdown.jsx";
import NoDataFound from "../NoDataFound/NoDataFound.jsx";
import SearchBar from "../SearchBar/SearchBar.jsx";
import Spinner from "../Spinner/Spinner.jsx";
import InfoCard from "../InfoCard/InfoCard.jsx";
import Icon from "../../icons/Icon/Icon.jsx";
import TremStatusBadge from "../StatusBadge/StatusBadge.jsx";

import "./BookingTable.styles.scss";

/* ========================================================================== */
/* Constants                                                                  */
/* ========================================================================== */

const STATUS_TONES = {
  draft: "neutral",

  upcoming: "info",
  info: "info",
  submitted: "info",
  under_review: "info",

  pending: "warning",
  payment_pending: "warning",
  partially_paid: "warning",

  completed: "success",
  complete: "success",
  success: "success",
  paid: "success",
  confirmed: "success",
  ticketed: "success",
  travel_ready: "success",
  approved: "success",

  cancelled: "danger",
  canceled: "danger",
  failed: "danger",
  rejected: "danger",

  refunded: "secondary",
};

/* ========================================================================== */
/* Helpers                                                                    */
/* ========================================================================== */

function getValue(row, accessor) {
  if (typeof accessor === "function") {
    return accessor(row);
  }

  if (!accessor) {
    return undefined;
  }

  return String(accessor)
    .split(".")
    .reduce((value, key) => value?.[key], row);
}

function normalizeOption(option) {
  if (typeof option === "string" || typeof option === "number") {
    return {
      label: String(option),
      value: option,
    };
  }

  return option || {};
}

function normalizeStatus(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function getStatusTone(value, tone) {
  if (tone) {
    return tone;
  }

  return STATUS_TONES[normalizeStatus(value)] || "neutral";
}

function sortRows(rows, sortState, columns) {
  const column = columns.find((item) => item.id === sortState?.columnId);

  if (!column || !sortState?.direction) {
    return rows;
  }

  const direction = sortState.direction === "desc" ? -1 : 1;

  const accessor = column.sortAccessor || column.accessor || column.id;

  return [...rows].sort((leftRow, rightRow) => {
    const left = getValue(leftRow, accessor);

    const right = getValue(rightRow, accessor);

    if (left == null && right == null) {
      return 0;
    }

    if (left == null) {
      return 1;
    }

    if (right == null) {
      return -1;
    }

    if (typeof left === "number" && typeof right === "number") {
      return (left - right) * direction;
    }

    return (
      String(left).localeCompare(String(right), undefined, {
        numeric: true,
        sensitivity: "base",
      }) * direction
    );
  });
}

/* ========================================================================== */
/* SelectControl                                                              */
/* ========================================================================== */

function SelectControl({ label, value, options = [], onChange }) {
  const normalizedOptions = useMemo(
    () => (Array.isArray(options) ? options : []).map(normalizeOption),
    [options],
  );

  const selected =
    normalizedOptions.find((option) => String(option.value) === String(value)) ||
    normalizedOptions[0];

  return (
    <Dropdown
      variant="select"
      className="booking-table__select-control"
      align="right"
      hoverable={false}
      portalZIndex={1610}
      label={label}
      value={selected?.value}
      items={normalizedOptions.map((option) => ({
        id: option.id ?? option.value,

        value: option.value,

        label: option.label,

        active: String(option.value) === String(value),

        disabled: option.disabled,

        onClick: () => onChange?.(option.value),
      }))}
    />
  );
}

/* ========================================================================== */
/* Hero                                                                       */
/* ========================================================================== */

function HeroAction({ action }) {
  if (!action) {
    return null;
  }

  const button = (
    <Button
      type="button"
      variant={action.variant || "outline"}
      color={action.color || "primary"}
      text={action.iconOnly ? undefined : action.label}
      iconLeft={action.icon}
      iconRight={action.options?.length ? "chevronDown" : action.iconRight}
      iconSize={action.iconSize || 17}
      isCircular={Boolean(action.iconOnly)}
      primaryClassName={[
        "booking-table__hero-action",

        action.iconOnly ? "booking-table__hero-action--icon" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label={action.ariaLabel || action.label}
      disabled={action.disabled}
      onClick={action.options?.length ? undefined : action.onClick}
    />
  );

  if (!action.options?.length) {
    return button;
  }

  return (
    <Dropdown
      align={action.align || "right"}
      hoverable={false}
      items={action.options.map((option) => ({
        id: option.id || option.value || option.label,

        label: option.label,

        disabled: option.disabled,

        onClick: () => option.onClick?.(option),
      }))}
      trigger={() => button}
    />
  );
}

function HeroBanner({ config = {} }) {
  if (!config || config.enabled === false) {
    return null;
  }

  const hasContent =
    config.title || config.subtitle || config.description || config.actions?.length;

  if (!hasContent) {
    return null;
  }

  return (
    <header
      className={[
        "booking-table__hero",

        `booking-table__hero--${config.variant || "default"}`,
      ].join(" ")}
      style={{
        minHeight: config.minHeight,

        maxHeight: config.maxHeight,
      }}
    >
      <div className="booking-table__hero-copy">
        {config.eyebrow ? (
          <span className="booking-table__hero-eyebrow">{config.eyebrow}</span>
        ) : null}

        {config.title ? <h2>{config.title}</h2> : null}

        {config.subtitle ? <p>{config.subtitle}</p> : null}

        {config.description ? <small>{config.description}</small> : null}
      </div>

      {config.actions?.length ? (
        <div className="booking-table__hero-actions">
          {config.actions.map((action) => (
            <HeroAction key={action.id || action.label || action.icon} action={action} />
          ))}
        </div>
      ) : null}
    </header>
  );
}

/* ========================================================================== */
/* Status                                                                     */
/* ========================================================================== */

function BookingTableStatus({ value, tone, secondary = "" }) {
  return (
    <TremStatusBadge
      value={value}
      tone={getStatusTone(value, tone)}
      subtitle={secondary || undefined}
      showDot
      size="sm"
    />
  );
}

/* ========================================================================== */
/* Cell rendering                                                             */
/* ========================================================================== */

function wrapClickableCell(content, column, row) {
  if (!column.clickable) {
    return content;
  }

  return (
    <Button
      type="button"
      variant="text"
      text={
        typeof content === "string" || typeof content === "number" ? String(content) : undefined
      }
      primaryClassName={[
        "booking-table__cell-action",

        column.emphasis ? `booking-table__cell-action--${column.emphasis}` : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label={column.actionLabel || column.label}
      onClick={(event) => {
        event.stopPropagation();

        column.onClick?.(row);
      }}
    >
      {typeof content === "string" || typeof content === "number" ? undefined : content}
    </Button>
  );
}

function renderCell(column, row) {
  if (typeof column.render === "function") {
    return wrapClickableCell(column.render(row, column), column, row);
  }

  const value = getValue(row, column.accessor || column.id);

  /* ------------------------------------------------------------------------ */
  /* Media + text                                                             */
  /* ------------------------------------------------------------------------ */

  if (column.type === "mediaText") {
    const media = column.mediaAccessor ? getValue(row, column.mediaAccessor) : row.image;

    const title = column.titleAccessor
      ? getValue(row, column.titleAccessor)
      : value?.title || value;

    const subtitle = column.subtitleAccessor
      ? getValue(row, column.subtitleAccessor)
      : value?.subtitle;

    return wrapClickableCell(
      <div className="booking-table__media-cell">
        <span className="booking-table__media">
          {media ? (
            <img src={media} alt="" loading="lazy" />
          ) : (
            <span className="booking-table__media-fallback">
              {String(title || "?")
                .trim()
                .charAt(0)
                .toUpperCase()}
            </span>
          )}
        </span>

        <span className="booking-table__media-copy">
          <strong title={title ? String(title) : undefined}>{title}</strong>

          {subtitle ? <small title={String(subtitle)}>{subtitle}</small> : null}
        </span>
      </div>,
      column,
      row,
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Status                                                                   */
  /* ------------------------------------------------------------------------ */

  if (column.type === "status") {
    const tone = column.toneAccessor ? getValue(row, column.toneAccessor) : row.statusTone;

    const secondary = column.secondaryAccessor ? getValue(row, column.secondaryAccessor) : "";

    return wrapClickableCell(
      <BookingTableStatus value={value} tone={tone} secondary={secondary} />,
      column,
      row,
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Badge                                                                    */
  /* ------------------------------------------------------------------------ */

  if (column.type === "badge") {
    const tone = column.toneAccessor
      ? getValue(row, column.toneAccessor)
      : column.tone || "neutral";

    return wrapClickableCell(
      <span className={["booking-table__badge", `booking-table__badge--${tone}`].join(" ")}>
        {value}
      </span>,
      column,
      row,
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Actions                                                                  */
  /* ------------------------------------------------------------------------ */

  if (column.type === "actions") {
    const rowActions =
      typeof column.actions === "function"
        ? column.actions(row)
        : column.actions || row.actions || [];

    return (
      <div className="booking-table__row-actions" onClick={(event) => event.stopPropagation()}>
        {rowActions.map((action) => (
          <Button
            key={action.id || action.label || action.icon}
            type="button"
            variant="text"
            iconLeft={action.icon || "eye"}
            iconSize={action.iconSize || 17}
            isCircular
            primaryClassName={[
              "booking-table__action-button",

              action.tone ? `booking-table__action-button--${action.tone}` : "",
            ]
              .filter(Boolean)
              .join(" ")}
            title={action.label}
            aria-label={action.ariaLabel || action.label}
            disabled={action.disabled || !action.clickable}
            onClick={() => {
              if (action.clickable) action.onClick?.(row);
            }}
          />
        ))}
      </div>
    );
  }

  if (value == null) {
    return <span className="booking-table__empty-value">—</span>;
  }

  return wrapClickableCell(`${value}${column.suffix || ""}`, column, row);
}

/* ========================================================================== */
/* BookingTable                                                               */
/* ========================================================================== */

export default function BookingTable({
  pageHeader = null,
  heroBanner = null,
  table = {},
  columns = [],
  rows = [],
  actions = {},
  sortingHeader = {},
  pagination = {},
  className = "",
  onRowClick,
}) {
  const tableRef = useRef(null);
  const rowClickable = Boolean(table.rowClickable && onRowClick);

  const mobileScrollMode = table.mobileScrollMode === "page" ? "page" : "contained";

  const isServerSide = Boolean(table.serverSide || actions.serverSide || pagination.serverSide);

  const filterDefinitions = actions.filters || [];

  /* ======================================================================== */
  /* State                                                                    */
  /* ======================================================================== */

  const [internalQuery, setInternalQuery] = useState(actions.search?.value || "");

  const [filters, setFilters] = useState(() =>
    filterDefinitions.reduce(
      (result, filter) => ({
        ...result,

        [filter.id]: filter.value ?? filter.defaultValue ?? "all",
      }),
      {},
    ),
  );

  const [internalSortValue, setInternalSortValue] = useState(
    sortingHeader.value ?? sortingHeader.defaultValue ?? "",
  );

  const [internalPage, setInternalPage] = useState(pagination.currentPage || 1);

  const [internalPageSize, setInternalPageSize] = useState(
    pagination.pageSize || pagination.pageSizeOptions?.[0] || rows.length || 10,
  );

  const [columnSort, setColumnSort] = useState(sortingHeader.columnSort || null);

  const [mobileControlsOpen, setMobileControlsOpen] = useState(false);

  /* ======================================================================== */
  /* Mobile sheet scroll locking                                              */
  /* ======================================================================== */

  useEffect(() => {
    if (!mobileControlsOpen || !tableRef.current) {
      return undefined;
    }

    const locked = [];

    let node = tableRef.current.parentElement;

    while (node && node !== document.body) {
      const overflowY = window.getComputedStyle(node).overflowY;

      if (/(auto|scroll)/.test(overflowY)) {
        locked.push([node, node.style.overflowY, node.style.overscrollBehaviorY]);

        node.style.overflowY = "hidden";

        node.style.overscrollBehaviorY = "contain";
      }

      node = node.parentElement;
    }

    const previousBodyOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      locked.forEach(([element, overflowY, overscrollBehaviorY]) => {
        element.style.overflowY = overflowY;

        element.style.overscrollBehaviorY = overscrollBehaviorY;
      });

      document.body.style.overflow = previousBodyOverflow;
    };
  }, [mobileControlsOpen]);

  /* ======================================================================== */
  /* Controlled / uncontrolled values                                         */
  /* ======================================================================== */

  const query = actions.search?.value ?? internalQuery;

  const sortValue = sortingHeader.value ?? internalSortValue;

  const pageIsControlled =
    pagination.currentPage != null && typeof pagination.onPageChange === "function";

  const pageSizeIsControlled =
    pagination.pageSize != null && typeof pagination.onPageSizeChange === "function";

  const page = pageIsControlled ? pagination.currentPage : internalPage;

  const rawPageSize = pageSizeIsControlled ? pagination.pageSize : internalPageSize;

  const pageSize = Math.max(1, Number(rawPageSize) || 10);

  /* ======================================================================== */
  /* Search / sort config                                                     */
  /* ======================================================================== */

  const searchableKeys = useMemo(
    () =>
      (actions.search?.keys || columns.map((column) => column.accessor || column.id)).filter(
        Boolean,
      ),
    [actions.search?.keys, columns],
  );

  const sortOption = useMemo(
    () =>
      (sortingHeader.options || [])
        .map(normalizeOption)
        .find((option) => String(option.value) === String(sortValue)),
    [sortingHeader.options, sortValue],
  );

  const effectiveSort = sortOption?.sort || columnSort;

  /* ======================================================================== */
  /* Component sizing                                                         */
  /* ======================================================================== */

  const componentStyle = {
    "--booking-table-control-height": table.controlHeight,

    "--booking-table-viewport-min-height": table.viewportMinHeight,

    "--booking-table-mobile-viewport-height": table.mobileViewportHeight,

    width: table.width,

    maxWidth: table.maxWidth,

    minWidth: table.containerMinWidth,

    height: table.height,

    minHeight: table.minHeight,

    maxHeight: table.maxHeight,
  };

  /* ======================================================================== */
  /* Filtering                                                                */
  /* ======================================================================== */

  const filteredRows = useMemo(() => {
    if (isServerSide) {
      return rows;
    }

    const normalizedQuery = String(query || "")
      .trim()
      .toLowerCase();

    return rows.filter((row) => {
      const matchesQuery =
        !normalizedQuery ||
        searchableKeys.some((key) =>
          String(getValue(row, key) ?? "")
            .toLowerCase()
            .includes(normalizedQuery),
        );

      const matchesFilters = filterDefinitions.every((filter) => {
        const selectedValue = filter.value ?? filters[filter.id];

        if (selectedValue == null || selectedValue === "" || selectedValue === "all") {
          return true;
        }

        const rowValue = getValue(row, filter.accessor || filter.id);

        return String(rowValue).toLowerCase() === String(selectedValue).toLowerCase();
      });

      return matchesQuery && matchesFilters;
    });
  }, [filterDefinitions, filters, isServerSide, query, rows, searchableKeys]);

  /* ======================================================================== */
  /* Sorting                                                                  */
  /* ======================================================================== */

  const sortedRows = useMemo(
    () => (isServerSide ? filteredRows : sortRows(filteredRows, effectiveSort, columns)),
    [columns, effectiveSort, filteredRows, isServerSide],
  );

  /* ======================================================================== */
  /* Pagination                                                               */
  /* ======================================================================== */

  const totalItems = Math.max(0, Number(pagination.total ?? sortedRows.length) || 0);

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const currentPage = Math.min(Math.max(Number(page) || 1, 1), totalPages);

  const visibleRows =
    pagination.enabled === false || isServerSide
      ? sortedRows
      : sortedRows.slice(
          (currentPage - 1) * pageSize,

          currentPage * pageSize,
        );

  const firstVisibleItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;

  const lastVisibleItem = totalItems === 0 ? 0 : Math.min(currentPage * pageSize, totalItems);

  const visiblePages = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from(
        {
          length: totalPages,
        },
        (_, index) => index + 1,
      );
    }

    const pageSet = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);

    const ordered = [...pageSet]
      .filter((item) => item >= 1 && item <= totalPages)
      .sort((a, b) => a - b);

    return ordered.reduce((result, item, index) => {
      if (index && item - ordered[index - 1] > 1) {
        result.push(`ellipsis-${item}`);
      }

      result.push(item);

      return result;
    }, []);
  }, [currentPage, totalPages]);

  /* ======================================================================== */
  /* Mobile card configuration                                                */
  /* ======================================================================== */

  const mobileCard = table.mobileCard || {};

  const mobileFieldIds =
    mobileCard.fieldIds ||
    columns
      .filter((column) => !["mediaText", "status", "actions"].includes(column.type))
      .map((column) => column.id);

  /* ======================================================================== */
  /* Actions                                                                  */
  /* ======================================================================== */

  const goToPage = useCallback(
    (nextPage) => {
      const safePage = Math.max(1, Math.min(totalPages, Number(nextPage) || 1));

      setInternalPage(safePage);

      pagination.onPageChange?.(safePage);
    },
    [pagination, totalPages],
  );

  const resetPage = useCallback(() => {
    setInternalPage(1);

    pagination.onPageChange?.(1);
  }, [pagination]);

  const updateSearch = useCallback(
    (nextValue) => {
      setInternalQuery(nextValue);

      actions.search?.onChange?.(nextValue);

      resetPage();
    },
    [actions.search, resetPage],
  );

  const handleColumnSort = useCallback(
    (column) => {
      if (!column.sortable) {
        return;
      }

      setColumnSort((current) => {
        if (current?.columnId !== column.id) {
          return {
            columnId: column.id,

            direction: "asc",
          };
        }

        if (current.direction === "asc") {
          return {
            columnId: column.id,

            direction: "desc",
          };
        }

        return null;
      });

      setInternalSortValue("");

      sortingHeader.onChange?.("");
    },
    [sortingHeader],
  );

  const clearFilters = useCallback(() => {
    const resetFilters = filterDefinitions.reduce(
      (result, filter) => ({
        ...result,

        [filter.id]: filter.defaultValue ?? "all",
      }),
      {},
    );

    setFilters(resetFilters);

    filterDefinitions.forEach((filter) => filter.onChange?.(resetFilters[filter.id]));

    setInternalQuery("");

    actions.search?.onChange?.("");

    resetPage();
  }, [actions.search, filterDefinitions, resetPage]);

  /* ======================================================================== */
  /* Render                                                                   */
  /* ======================================================================== */

  return (
    <section
      ref={tableRef}
      className={["booking-table", `booking-table--mobile-scroll-${mobileScrollMode}`, className]
        .filter(Boolean)
        .join(" ")}
      aria-label={table.ariaLabel || table.title || "Booking table"}
      style={componentStyle}
    >
      {/* ================================================================== */}
      {/* Page header                                                        */}
      {/* ================================================================== */}

      {pageHeader?.title || pageHeader?.description ? (
        <header className="booking-table__page-header">
          {pageHeader.title ? <h1>{pageHeader.title}</h1> : null}

          {pageHeader.description ? <p>{pageHeader.description}</p> : null}
        </header>
      ) : null}

      {/* ================================================================== */}
      {/* Hero                                                               */}
      {/* ================================================================== */}

      <HeroBanner config={heroBanner || table.heroBanner || table.hero} />

      {/* ================================================================== */}
      {/* Main panel                                                         */}
      {/* ================================================================== */}

      <div className="booking-table__panel">
        {(table.title ||
          table.description ||
          actions.search ||
          filterDefinitions.length ||
          sortingHeader.options?.length ||
          (pagination.enabled !== false && pagination.showPageSize !== false)) && (
          <div
            className={["booking-table__toolbar", mobileControlsOpen ? "is-sheet-open" : ""]
              .filter(Boolean)
              .join(" ")}
          >
            {/* ============================================================ */}
            {/* Toolbar title                                                */}
            {/* ============================================================ */}

            <div className="booking-table__toolbar-heading">
              {table.title || table.description ? (
                <div className="booking-table__heading">
                  {table.title ? (
                    <div className="booking-table__heading-row">
                      <h2>{table.title}</h2>

                      {table.showCount !== false ? (
                        <span className="booking-table__count">{totalItems}</span>
                      ) : null}
                    </div>
                  ) : null}

                  {table.description ? <p>{table.description}</p> : null}
                </div>
              ) : (
                <span />
              )}

              <button
                className="booking-table__mobile-toggle"
                type="button"
                aria-expanded={mobileControlsOpen}
                aria-controls="booking-table-mobile-controls"
                onClick={(event) => {
                  event.currentTarget.blur();

                  setMobileControlsOpen((current) => !current);
                }}
              >
                <Icon name="filter" size={17} aria-hidden="true" />

                <span>
                  {mobileControlsOpen
                    ? table.collapseFiltersLabel || "Hide filters"
                    : table.expandFiltersLabel || "Filters"}
                </span>

                <Icon
                  name={mobileControlsOpen ? "chevronDown" : "chevronRight"}
                  size={15}
                  aria-hidden="true"
                />
              </button>
            </div>

            {/* ============================================================ */}
            {/* Controls                                                     */}
            {/* ============================================================ */}

            <div
              id="booking-table-mobile-controls"
              className={["booking-table__controls", mobileControlsOpen ? "is-mobile-open" : ""]
                .filter(Boolean)
                .join(" ")}
              role={mobileControlsOpen ? "dialog" : undefined}
              aria-modal={mobileControlsOpen ? "true" : undefined}
              aria-label={
                mobileControlsOpen ? table.filtersSheetTitle || "Filter records" : undefined
              }
            >
              {mobileControlsOpen ? (
                <div className="booking-table__sheet-header">
                  <div>
                    <span>{table.filtersSheetEyebrow || "Refine results"}</span>

                    <strong>{table.filtersSheetTitle || "Filters and sorting"}</strong>
                  </div>

                  <button
                    type="button"
                    className="booking-table__sheet-close"
                    aria-label={table.closeFiltersLabel || "Close filters"}
                    onClick={() => setMobileControlsOpen(false)}
                  >
                    <Icon name="x" size={18} aria-hidden="true" />
                  </button>
                </div>
              ) : null}

              {actions.search ? (
                <SearchBar
                  value={query}
                  placeholder={actions.search.placeholder || "Search bookings"}
                  ariaLabel={actions.search.ariaLabel}
                  shortcut={actions.search.shortcut}
                  onChange={updateSearch}
                  className="booking-table__search"
                />
              ) : null}

              {filterDefinitions.map((filter) => (
                <SelectControl
                  key={filter.id}
                  label={filter.label}
                  value={filter.value ?? filters[filter.id] ?? "all"}
                  options={filter.options || []}
                  onChange={(nextValue) => {
                    setFilters((current) => ({
                      ...current,

                      [filter.id]: nextValue,
                    }));

                    filter.onChange?.(nextValue);

                    resetPage();
                  }}
                />
              ))}

              {pagination.enabled !== false && pagination.showPageSize !== false ? (
                <div className="booking-table__page-size">
                  <SelectControl
                    label={pagination.pageSizeLabel || "Rows"}
                    value={String(pageSize)}
                    options={(pagination.pageSizeOptions || [10, 25, 50]).map((size) => ({
                      label: String(size),

                      value: String(size),
                    }))}
                    onChange={(nextValue) => {
                      const nextPageSize = Math.max(1, Number(nextValue) || 10);

                      setInternalPageSize(nextPageSize);

                      pagination.onPageSizeChange?.(nextPageSize);

                      resetPage();
                    }}
                  />
                </div>
              ) : null}

              {sortingHeader.options?.length ? (
                <div className="booking-table__sort">
                  <SelectControl
                    label={sortingHeader.label || "Sort"}
                    value={sortValue}
                    options={sortingHeader.options}
                    onChange={(nextValue) => {
                      setInternalSortValue(nextValue);

                      sortingHeader.onChange?.(nextValue);

                      resetPage();
                    }}
                  />
                </div>
              ) : null}

              {mobileControlsOpen ? (
                <div className="booking-table__sheet-actions">
                  <Button
                    type="button"
                    variant="outline"
                    color="secondary"
                    text={table.clearFiltersLabel || "Clear"}
                    onClick={clearFilters}
                  />

                  <Button
                    type="button"
                    color="primary"
                    text={table.applyFiltersLabel || `Show ${totalItems} results`}
                    onClick={() => setMobileControlsOpen(false)}
                  />
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* Mobile backdrop                                                    */}
        {/* ================================================================== */}

        {mobileControlsOpen ? (
          <button
            type="button"
            className="booking-table__sheet-backdrop"
            aria-label={table.closeFiltersLabel || "Close filters"}
            onClick={() => setMobileControlsOpen(false)}
          />
        ) : null}

        {/* ================================================================== */}
        {/* Desktop table                                                      */}
        {/* ================================================================== */}

        <div className="booking-table__scroll" tabIndex={0}>
          <table
            style={{
              minWidth: table.contentMinWidth || table.tableMinWidth || table.minWidth,
            }}
          >
            <thead>
              <tr>
                {columns.map((column) => {
                  const activeSort = columnSort?.columnId === column.id;

                  const headerClasses = [
                    column.align ? `is-${column.align}` : "",

                    column.sortable ? "is-sortable" : "",

                    `booking-table__col--${column.type || "text"}`,

                    column.sticky ? "is-sticky-column" : "",
                  ]
                    .filter(Boolean)
                    .join(" ");

                  return (
                    <th
                      key={column.id}
                      scope="col"
                      className={headerClasses}
                      aria-sort={
                        column.sortable
                          ? activeSort
                            ? columnSort.direction === "desc"
                              ? "descending"
                              : "ascending"
                            : "none"
                          : undefined
                      }
                      style={{
                        width: column.width,

                        minWidth: column.minWidth,
                      }}
                    >
                      <button
                        className="booking-table__header-button"
                        type="button"
                        onClick={() => handleColumnSort(column)}
                        disabled={!column.sortable}
                      >
                        <span>{column.label}</span>

                        {column.sortable ? (
                          <span
                            className={["booking-table__sort-icon", activeSort ? "is-active" : ""]
                              .filter(Boolean)
                              .join(" ")}
                          >
                            <Icon
                              name={
                                activeSort
                                  ? columnSort.direction === "desc"
                                    ? "chevronDown"
                                    : "chevronUp"
                                  : "chevronRight"
                              }
                              size={13}
                            />
                          </span>
                        ) : null}
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody>
              {table.loading ? (
                <tr>
                  <td colSpan={Math.max(1, columns.length)} className="booking-table__state">
                    <Spinner size="lg" label={table.loadingLabel || "Loading bookings"} />
                  </td>
                </tr>
              ) : null}

              {!table.loading && table.error ? (
                <tr>
                  <td
                    colSpan={Math.max(1, columns.length)}
                    className="booking-table__state is-error"
                  >
                    <div className="booking-table__error-state">
                      <Icon name="alertTriangle" size={20} />

                      <span>{table.error}</span>
                    </div>
                  </td>
                </tr>
              ) : null}

              {!table.loading &&
                !table.error &&
                visibleRows.map((row, rowIndex) => (
                  <tr
                    key={row.id || row.bookingId || rowIndex}
                    className={[
                      rowClickable ? "booking-table__row--clickable" : "",

                      row.className || "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={rowClickable ? () => onRowClick(row) : undefined}
                  >
                    {columns.map((column) => (
                      <td
                        key={column.id}
                        className={[
                          column.align ? `is-${column.align}` : "",

                          column.emphasis ? `booking-table__cell--${column.emphasis}` : "",

                          `booking-table__col--${column.type || "text"}`,

                          column.sticky ? "is-sticky-column" : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        style={{
                          width: column.width,

                          minWidth: column.minWidth,
                        }}
                      >
                        {renderCell(column, row)}
                      </td>
                    ))}
                  </tr>
                ))}

              {!table.loading && !table.error && visibleRows.length === 0 ? (
                <tr>
                  <td colSpan={Math.max(1, columns.length)} className="booking-table__state">
                    {table.emptyState ? <NoDataFound {...table.emptyState} /> : "No records found"}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {/* ================================================================== */}
        {/* Mobile cards                                                       */}
        {/* ================================================================== */}

        {table.mobileCard ? (
          <div className="booking-table__mobile">
            {table.loading ? (
              <div className="booking-table__mobile-state">
                <Spinner size="lg" label={table.loadingLabel || "Loading bookings"} />
              </div>
            ) : null}

            {!table.loading && table.error ? (
              <div className="booking-table__mobile-error">
                <Icon name="alertTriangle" size={18} />

                <span>{table.error}</span>
              </div>
            ) : null}

            {!table.loading &&
              !table.error &&
              visibleRows.map((row, rowIndex) => {
                const badgeValue = getValue(row, mobileCard.badgeAccessor || "status");

                const explicitTone = mobileCard.badgeToneAccessor
                  ? getValue(row, mobileCard.badgeToneAccessor)
                  : undefined;

                return (
                  <InfoCard
                    key={row.id || row.bookingId || rowIndex}
                    title={getValue(row, mobileCard.titleAccessor || "tour") || "Booking"}
                    subtitle={getValue(row, mobileCard.subtitleAccessor || "tremId") || ""}
                    image={getValue(row, mobileCard.imageAccessor || "image") || ""}
                    badge={{
                      value: badgeValue,

                      tone: getStatusTone(badgeValue, explicitTone),
                    }}
                    fields={mobileFieldIds.map((fieldId) => {
                      const column = columns.find(
                        (item) => item.id === fieldId || item.accessor === fieldId,
                      );

                      return {
                        id: fieldId,

                        label: column?.label || fieldId,

                        value: getValue(row, column?.accessor || fieldId),
                      };
                    })}
                    actionLabel={mobileCard.actionLabel || ""}
                    actionIcon={mobileCard.actionIcon || "eye"}
                    className="booking-table__mobile-card"
                    onClick={rowClickable ? () => onRowClick(row) : undefined}
                    onSubtitleClick={
                      mobileCard.subtitleClickable && onRowClick
                        ? () => onRowClick(row)
                        : undefined
                    }
                    onActionClick={
                      mobileCard.actionClickable && onRowClick ? () => onRowClick(row) : undefined
                    }
                  />
                );
              })}

            {!table.loading && !table.error && visibleRows.length === 0 ? (
              <div className="booking-table__mobile-state">
                {table.emptyState ? (
                  <NoDataFound {...table.emptyState} compact />
                ) : (
                  <span>No records found</span>
                )}
              </div>
            ) : null}
          </div>
        ) : null}

        {/* ================================================================== */}
        {/* Pagination                                                         */}
        {/* ================================================================== */}

        {pagination.enabled !== false ? (
          <div className="booking-table__pagination">
            {pagination.showSummary !== false ? (
              <div className="booking-table__pagination-summary">
                {typeof pagination.summary === "function" ? (
                  pagination.summary({
                    from: firstVisibleItem,

                    to: lastVisibleItem,

                    total: totalItems,

                    page: currentPage,

                    totalPages,
                  })
                ) : (
                  <>
                    <span>Showing</span>

                    <strong>
                      {firstVisibleItem}–{lastVisibleItem}
                    </strong>

                    <span>of</span>

                    <strong>{totalItems}</strong>
                  </>
                )}
              </div>
            ) : (
              <span />
            )}

            <div
              className="booking-table__pages booking-table__pages--desktop"
              aria-label={pagination.ariaLabel || "Pagination"}
            >
              <Button
                type="button"
                variant="text"
                iconLeft="chevronLeft"
                iconSize={17}
                isCircular
                aria-label="Previous page"
                disabled={currentPage <= 1}
                primaryClassName="booking-table__page-nav"
                onClick={() => goToPage(currentPage - 1)}
              />

              {visiblePages.map((pageNumber) =>
                typeof pageNumber === "string" ? (
                  <span
                    key={pageNumber}
                    className="booking-table__page-ellipsis"
                    aria-hidden="true"
                  >
                    …
                  </span>
                ) : (
                  <Button
                    key={pageNumber}
                    type="button"
                    variant={pageNumber === currentPage ? "solid" : "text"}
                    color="primary"
                    text={String(pageNumber)}
                    isCircular
                    aria-label={`Page ${pageNumber}`}
                    aria-current={pageNumber === currentPage ? "page" : undefined}
                    primaryClassName={[
                      "booking-table__page-number",

                      pageNumber === currentPage ? "is-active" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => goToPage(pageNumber)}
                  />
                ),
              )}

              <Button
                type="button"
                variant="text"
                iconLeft="chevronRight"
                iconSize={17}
                isCircular
                aria-label="Next page"
                disabled={currentPage >= totalPages}
                primaryClassName="booking-table__page-nav"
                onClick={() => goToPage(currentPage + 1)}
              />
            </div>

            <div
              className="booking-table__pages booking-table__pages--mobile"
              aria-label={pagination.ariaLabel || "Pagination"}
            >
              <Button
                type="button"
                variant="text"
                iconLeft="chevronLeft"
                iconSize={16}
                isCircular
                aria-label="Previous page"
                disabled={currentPage <= 1}
                primaryClassName="booking-table__page-nav"
                onClick={() => goToPage(currentPage - 1)}
              />

              <span className="booking-table__mobile-page-status">
                <strong>{currentPage}</strong>

                <span>/</span>

                {totalPages}
              </span>

              <Button
                type="button"
                variant="text"
                iconLeft="chevronRight"
                iconSize={16}
                isCircular
                aria-label="Next page"
                disabled={currentPage >= totalPages}
                primaryClassName="booking-table__page-nav"
                onClick={() => goToPage(currentPage + 1)}
              />
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

/* ========================================================================== */
/* PropTypes                                                                  */
/* ========================================================================== */

const optionShape = PropTypes.oneOfType([
  PropTypes.string,
  PropTypes.number,

  PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),

    label: PropTypes.string.isRequired,

    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,

    disabled: PropTypes.bool,
  }),
]);

BookingTable.propTypes = {
  pageHeader: PropTypes.shape({
    title: PropTypes.string,

    description: PropTypes.string,
  }),

  heroBanner: PropTypes.object,

  table: PropTypes.object,

  columns: PropTypes.arrayOf(PropTypes.object),

  rows: PropTypes.arrayOf(PropTypes.object),

  actions: PropTypes.shape({
    search: PropTypes.object,

    filters: PropTypes.arrayOf(PropTypes.object),
  }),

  sortingHeader: PropTypes.shape({
    label: PropTypes.string,

    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),

    defaultValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),

    options: PropTypes.arrayOf(optionShape),
  }),

  pagination: PropTypes.object,

  className: PropTypes.string,

  onRowClick: PropTypes.func,
};
