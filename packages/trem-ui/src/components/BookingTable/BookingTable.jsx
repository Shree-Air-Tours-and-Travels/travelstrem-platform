import React, { useMemo, useState } from "react";
import PropTypes from "prop-types";
import Button from "../Button/Button.jsx";
import Dropdown from "../Dropdown/Dropdown.jsx";
import InputField from "../InputField/InputField.jsx";
import Icon from "../../icons/Icon/Icon.jsx";
import "./BookingTable.styles.scss";

const STATUS_TONES = {
  upcoming: "blue",
  pending: "olive",
  cancelled: "red",
  canceled: "red",
  completed: "green",
};

function getValue(row, accessor) {
  if (typeof accessor === "function") return accessor(row);
  if (!accessor) return undefined;
  return String(accessor).split(".").reduce((value, key) => value?.[key], row);
}

function normalizeOption(option) {
  if (typeof option === "string") return { label: option, value: option };
  return option;
}

function sortRows(rows, sortState, columns) {
  const column = columns.find((item) => item.id === sortState?.columnId);
  if (!column || !sortState?.direction) return rows;
  const direction = sortState.direction === "desc" ? -1 : 1;
  const accessor = column.sortAccessor || column.accessor || column.id;

  return [...rows].sort((a, b) => {
    const left = getValue(a, accessor);
    const right = getValue(b, accessor);
    if (left == null && right == null) return 0;
    if (left == null) return 1;
    if (right == null) return -1;
    if (typeof left === "number" && typeof right === "number") return (left - right) * direction;
    return String(left).localeCompare(String(right), undefined, { numeric: true, sensitivity: "base" }) * direction;
  });
}

function SearchControl({ value, placeholder, onChange }) {
  return (
    <div className="booking-table__search">
      <Icon name="search" size={20} />
      <InputField value={value} placeholder={placeholder} onChange={onChange} className="booking-table__search-input" />
    </div>
  );
}

function SelectControl({ label, value, options, onChange }) {
  const normalizedOptions = options.map(normalizeOption);
  const selected = normalizedOptions.find((option) => String(option.value) === String(value)) || normalizedOptions[0];

  return (
    <Dropdown
      align="right"
      hoverable={false}
      items={normalizedOptions.map((option) => ({
        id: option.value,
        label: option.label,
        active: String(option.value) === String(value),
        onClick: () => onChange(option.value),
      }))}
      trigger={() => (
        <Button
          variant="outline"
          color="primary"
          text={selected?.label || label}
          iconRight="chevronDown"
          primaryClassName="booking-table__select"
          aria-label={label}
        />
      )}
    />
  );
}

function HeroAction({ action }) {
  const button = (
    <Button
      variant={action.variant || "outline"}
      color={action.color || "primary"}
      text={action.iconOnly ? undefined : action.label}
      iconLeft={action.icon}
      iconRight={action.options?.length ? "chevronDown" : action.iconRight}
      iconSize={action.iconSize || 18}
      isCircular={Boolean(action.iconOnly)}
      primaryClassName={`booking-table__hero-action${action.iconOnly ? " booking-table__hero-action--icon" : ""}`}
      aria-label={action.ariaLabel || action.label}
      disabled={action.disabled}
      onClick={action.options?.length ? undefined : action.onClick}
    />
  );

  if (!action.options?.length) return button;

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
  if (!config || config.enabled === false) return null;
  const hasContent = config.title || config.subtitle || config.description || config.actions?.length;
  if (!hasContent) return null;

  return (
    <header className={`booking-table__hero booking-table__hero--${config.variant || "default"}`} style={{ minHeight: config.minHeight, maxHeight: config.maxHeight }}>
      <div className="booking-table__hero-copy">
        {config.eyebrow ? <span className="booking-table__hero-eyebrow">{config.eyebrow}</span> : null}
        {config.title ? <h2>{config.title}</h2> : null}
        {config.subtitle ? <p>{config.subtitle}</p> : null}
        {config.description ? <small>{config.description}</small> : null}
      </div>
      {config.actions?.length ? (
        <div className="booking-table__hero-actions">
          {config.actions.map((action) => <HeroAction key={action.id || action.label || action.icon} action={action} />)}
        </div>
      ) : null}
    </header>
  );
}

function StatusBadge({ value, tone }) {
  const resolvedTone = tone || STATUS_TONES[String(value).toLowerCase()] || "neutral";

  return (
    <span className={`booking-table__status booking-table__status--${resolvedTone}`}>
      <span aria-hidden="true" />
      {value}
    </span>
  );
}

function wrapClickableCell(content, column, row) {
  if (!column.clickable && !column.onClick) return content;

  return (
    <Button
      variant="text"
      text={typeof content === "string" || typeof content === "number" ? String(content) : undefined}
      primaryClassName={`booking-table__cell-action${column.emphasis ? ` booking-table__cell-action--${column.emphasis}` : ""}`}
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
  if (typeof column.render === "function") return wrapClickableCell(column.render(row, column), column, row);
  const value = getValue(row, column.accessor || column.id);

  if (column.type === "mediaText") {
    const media = column.mediaAccessor ? getValue(row, column.mediaAccessor) : row.image;
    const title = column.titleAccessor ? getValue(row, column.titleAccessor) : value?.title || value;
    const subtitle = column.subtitleAccessor ? getValue(row, column.subtitleAccessor) : value?.subtitle;

    return wrapClickableCell((
      <div className="booking-table__media-cell">
        {media ? <img src={media} alt="" /> : <span className="booking-table__media-fallback">{String(title || "").charAt(0)}</span>}
        <span>
          <strong>{title}</strong>
          {subtitle ? <small>{subtitle}</small> : null}
        </span>
      </div>
    ), column, row);
  }

  if (column.type === "status") {
    const tone = column.toneAccessor ? getValue(row, column.toneAccessor) : row.statusTone;
    return wrapClickableCell(<StatusBadge value={value} tone={tone} />, column, row);
  }

  if (column.type === "actions") {
    const actions = column.actions || row.actions || [];
    return (
      <div className="booking-table__row-actions">
        {actions.map((action) => (
          <Button
            key={action.id || action.label || action.icon}
            variant="text"
            iconLeft={action.icon || "eye"}
            iconSize={18}
            isCircular
            primaryClassName="booking-table__action-button"
            title={action.label}
            aria-label={action.label}
            disabled={action.disabled}
            onClick={() => action.onClick?.(row)}
          />
        ))}
      </div>
    );
  }

  if (value == null) return "";
  return wrapClickableCell(`${value}${column.suffix || ""}`, column, row);
}

export default function BookingTable({
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
  const isServerSide = Boolean(table.serverSide || actions.serverSide || pagination.serverSide);
  const [internalQuery, setInternalQuery] = useState(actions.search?.value || "");
  const [filters, setFilters] = useState(() =>
    (actions.filters || []).reduce((acc, filter) => ({ ...acc, [filter.id]: filter.value || filter.defaultValue || "all" }), {})
  );
  const [internalSortValue, setInternalSortValue] = useState(sortingHeader.value || sortingHeader.defaultValue || "");
  const [internalPage, setInternalPage] = useState(pagination.currentPage || 1);
  const [internalPageSize, setInternalPageSize] = useState(pagination.pageSize || pagination.pageSizeOptions?.[0] || rows.length || 10);
  const [columnSort, setColumnSort] = useState(sortingHeader.columnSort || null);

  const query = actions.search?.value ?? internalQuery;
  const sortValue = sortingHeader.value ?? internalSortValue;
  const page = pagination.currentPage ?? internalPage;
  const pageSize = pagination.pageSize ?? internalPageSize;
  const searchableKeys = actions.search?.keys || columns.map((column) => column.accessor || column.id);
  const sortOption = (sortingHeader.options || []).map(normalizeOption).find((option) => option.value === sortValue);
  const effectiveSort = sortOption?.sort || columnSort;
  const componentStyle = {
    "--booking-table-control-height": table.controlHeight,
    width: table.width,
    maxWidth: table.maxWidth,
    minWidth: table.containerMinWidth,
    height: table.height,
    minHeight: table.minHeight,
    maxHeight: table.maxHeight,
  };

  const filteredRows = useMemo(() => {
    if (isServerSide) return rows;
    const normalizedQuery = query.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesQuery = !normalizedQuery || searchableKeys.some((key) => String(getValue(row, key) || "").toLowerCase().includes(normalizedQuery));
      const matchesFilters = (actions.filters || []).every((filter) => {
        const value = filter.value ?? filters[filter.id];
        if (!value || value === "all") return true;
        const rowValue = getValue(row, filter.accessor || filter.id);
        return String(rowValue).toLowerCase() === String(value).toLowerCase();
      });
      return matchesQuery && matchesFilters;
    });
  }, [rows, query, searchableKeys, actions.filters, filters, isServerSide]);

  const sortedRows = useMemo(() => (isServerSide ? filteredRows : sortRows(filteredRows, effectiveSort, columns)), [filteredRows, effectiveSort, columns, isServerSide]);
  const totalItems = Number(pagination.total ?? sortedRows.length);
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleRows = pagination.enabled === false || isServerSide ? sortedRows : sortedRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function resetPage() {
    setInternalPage(1);
    pagination.onPageChange?.(1);
  }

  function updateSearch(value) {
    setInternalQuery(value);
    actions.search?.onChange?.(value);
    resetPage();
  }

  function handleColumnSort(column) {
    if (!column.sortable) return;
    setColumnSort((current) => {
      if (current?.columnId !== column.id) return { columnId: column.id, direction: "asc" };
      if (current.direction === "asc") return { columnId: column.id, direction: "desc" };
      return null;
    });
    setInternalSortValue("");
    sortingHeader.onChange?.("");
  }

  return (
    <section className={`booking-table ${className}`.trim()} aria-label={table.ariaLabel || table.title || "Booking table"} style={componentStyle}>
      <HeroBanner config={heroBanner || table.heroBanner || table.hero} />

      <div className="booking-table__panel">
        {(table.title || actions.search || actions.filters?.length || sortingHeader.options?.length) && (
          <div className="booking-table__toolbar">
            {table.title ? <h2>{table.title}</h2> : <span />}
            <div className="booking-table__controls">
              {actions.search ? <SearchControl value={query} placeholder={actions.search.placeholder || "Search"} onChange={updateSearch} /> : null}
              {(actions.filters || []).map((filter) => (
                <SelectControl
                  key={filter.id}
                  label={filter.label}
                  value={filter.value ?? filters[filter.id] ?? "all"}
                  options={filter.options || []}
                  onChange={(value) => {
                    setFilters((current) => ({ ...current, [filter.id]: value }));
                    filter.onChange?.(value);
                    resetPage();
                  }}
                />
              ))}
              {sortingHeader.options?.length ? (
                <div className="booking-table__sort">
                  <span>{sortingHeader.label || "Sort By :"}</span>
                  <SelectControl
                    label={sortingHeader.selectLabel || "Sort"}
                    value={sortValue}
                    options={sortingHeader.options}
                    onChange={(value) => {
                      setInternalSortValue(value);
                      sortingHeader.onChange?.(value);
                      resetPage();
                    }}
                  />
                </div>
              ) : null}
            </div>
          </div>
        )}

        <div className="booking-table__scroll" tabIndex={0}>
          <table style={{ minWidth: table.contentMinWidth || table.tableMinWidth || table.minWidth }}>
            <thead>
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.id}
                    scope="col"
                    className={`${column.align ? `is-${column.align}` : ""} ${column.sortable ? "is-sortable" : ""}`.trim()}
                    style={{ width: column.width, minWidth: column.minWidth }}
                  >
                    <button className="booking-table__header-button" type="button" onClick={() => handleColumnSort(column)} disabled={!column.sortable}>
                      {column.label}
                      {column.sortable ? <Icon name={columnSort?.columnId === column.id && columnSort.direction === "desc" ? "chevronDown" : "chevronRight"} size={14} /> : null}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.loading ? (
                <tr>
                  <td colSpan={Math.max(1, columns.length)} className="booking-table__state">
                    {table.loadingLabel || "Loading bookings..."}
                  </td>
                </tr>
              ) : null}
              {!table.loading && table.error ? (
                <tr>
                  <td colSpan={Math.max(1, columns.length)} className="booking-table__state is-error">
                    {table.error}
                  </td>
                </tr>
              ) : null}
              {!table.loading && !table.error && visibleRows.map((row, rowIndex) => (
                <tr key={row.id || row.bookingId || rowIndex} onClick={() => onRowClick?.(row)}>
                  {columns.map((column) => (
                    <td
                      key={column.id}
                      className={`${column.align ? `is-${column.align}` : ""} ${column.emphasis ? `booking-table__cell--${column.emphasis}` : ""}`.trim()}
                      style={{ width: column.width, minWidth: column.minWidth }}
                    >
                      {renderCell(column, row)}
                    </td>
                  ))}
                </tr>
              ))}
              {!table.loading && !table.error && visibleRows.length === 0 ? (
                <tr>
                  <td colSpan={Math.max(1, columns.length)} className="booking-table__state">
                    {table.emptyState ? (
                      <span>
                        <strong>{table.emptyState.title}</strong>
                        {table.emptyState.description ? <small>{table.emptyState.description}</small> : null}
                      </span>
                    ) : (
                      "No records found"
                    )}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {pagination.enabled !== false ? (
        <div className="booking-table__pagination">
          <div className="booking-table__page-size">
            <span>{pagination.pageSizeLabel || "Show"}</span>
            <SelectControl
              label={pagination.pageSizeSelectLabel || "Entries per page"}
              value={String(pageSize)}
              options={(pagination.pageSizeOptions || [10, 25, 50]).map((size) => ({ label: String(size), value: String(size) }))}
              onChange={(value) => {
                const nextPageSize = Number(value);
                setInternalPageSize(nextPageSize);
                pagination.onPageSizeChange?.(nextPageSize);
                resetPage();
              }}
            />
            <span>{pagination.entriesLabel || "entries"}</span>
          </div>
          <div className="booking-table__pages" aria-label={pagination.ariaLabel || "Pagination"}>
            <Button
              variant="text"
              iconLeft="chevronLeft"
              iconSize={20}
              isCircular
              aria-label="Previous page"
              disabled={currentPage <= 1}
              primaryClassName="booking-table__page-nav"
              onClick={() => {
                const nextPage = Math.max(1, currentPage - 1);
                setInternalPage(nextPage);
                pagination.onPageChange?.(nextPage);
              }}
            />
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
              <Button
                key={pageNumber}
                variant={pageNumber === currentPage ? "solid" : "outline"}
                color="primary"
                text={String(pageNumber)}
                isCircular
                primaryClassName={`booking-table__page-number${pageNumber === currentPage ? " is-active" : ""}`}
                onClick={() => {
                  setInternalPage(pageNumber);
                  pagination.onPageChange?.(pageNumber);
                }}
              />
            ))}
            <Button
              variant="text"
              iconLeft="chevronRight"
              iconSize={20}
              isCircular
              aria-label="Next page"
              disabled={currentPage >= totalPages}
              primaryClassName="booking-table__page-nav"
              onClick={() => {
                const nextPage = Math.min(totalPages, currentPage + 1);
                setInternalPage(nextPage);
                pagination.onPageChange?.(nextPage);
              }}
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}

const optionShape = PropTypes.oneOfType([
  PropTypes.string,
  PropTypes.shape({
    label: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  }),
]);

BookingTable.propTypes = {
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
    value: PropTypes.string,
    defaultValue: PropTypes.string,
    options: PropTypes.arrayOf(optionShape),
  }),
  pagination: PropTypes.object,
  className: PropTypes.string,
  onRowClick: PropTypes.func,
};
