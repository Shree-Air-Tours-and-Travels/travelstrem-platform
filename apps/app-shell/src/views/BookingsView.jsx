import React, { useMemo } from "react";
import { BookingTable, Preloader } from "@packages/trem-ui";
import "./BookingsView.scss";

export default function BookingsView({ definition, loading, onViewBooking }) {
  const tableDefinition = useMemo(() => {
    if (!definition) return null;
    const props = definition.props || {};
    const labels = definition.labels || {};
    const options = definition.options || {};
    const getLabel = (ref, fallback = "") => labels[ref] || fallback;
    const getOptions = (key, fallback = []) => options[key] || fallback;

    return {
      ...props,
      pageHeader: {
        title: getLabel(props.pageHeader?.titleRef, "Bookings"),
        description: getLabel(props.pageHeader?.descriptionRef, ""),
      },
      table: {
        ...(props.table || {}),
        title: getLabel(props.table?.titleRef, getLabel(props.titleRef, "My Journeys")),
        description: getLabel(props.table?.descriptionRef, ""),
        ariaLabel: getLabel(props.table?.ariaLabelRef, "My Journeys"),
        emptyState: props.table?.emptyState ? {
          ...props.table.emptyState,
          title: getLabel(props.table.emptyState.titleRef, "No bookings found"),
          description: getLabel(
            props.table.emptyState.descriptionRef,
            "No bookings match the selected filters.",
          ),
        } : undefined,
        mobileCard: props.table?.mobileCard ? {
          ...props.table.mobileCard,
          actionLabel: getLabel(props.table.mobileCard.actionLabelRef, "View booking"),
        } : undefined,
      },
      actions: {
        ...(props.actions || {}),
        search: props.actions?.search ? {
          ...props.actions.search,
          placeholder: getLabel(props.actions.search.placeholderRef, "Search bookings"),
          ariaLabel: getLabel(props.actions.search.ariaLabelRef, "Search bookings"),
        } : undefined,
        filters: (props.actions?.filters || []).map((filter) => ({
          ...filter,
          label: getLabel(filter.labelRef, filter.id),
          options: getOptions(filter.optionsKey, filter.options || []),
        })),
      },
      sortingHeader: {
        ...(props.sortingHeader || {}),
        label: getLabel(props.sortingHeader?.labelRef, "Sort by"),
        selectLabel: getLabel(props.sortingHeader?.selectLabelRef, "Sort by"),
        options: getOptions(props.sortingHeader?.optionsKey, props.sortingHeader?.options || []),
      },
      columns: (props.columns || []).map((column) => {
        const resolvedColumn = {
          ...column,
          label: getLabel(column.labelRef, column.label || ""),
          actionLabel: getLabel(column.actionLabelRef, column.actionLabel || column.label || ""),
        };
        if (column.type === "actions") {
          return {
            ...resolvedColumn,
            actions: (column.actions || []).map((action) => ({
              ...action,
              label: getLabel(action.labelRef, action.label || "View booking"),
              onClick: onViewBooking,
            })),
          };
        }
        if (column.action === "viewBooking") {
          return { ...resolvedColumn, onClick: onViewBooking };
        }
        return resolvedColumn;
      }),
    };
  }, [definition, onViewBooking]);

  return (
    <div className="dbv">
      {loading ? (
        <Preloader variant="cards" count={3} label="Loading booking table" />
      ) : tableDefinition ? (
        <BookingTable
          {...tableDefinition}
          heroBanner={null}
          onRowClick={onViewBooking}
          className="dbv__booking-table"
        />
      ) : null}
    </div>
  );
}
