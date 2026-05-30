import React from "react";
import { useNavigate } from "react-router-dom";
import { BookingTable as TremBookingTable } from "@packages/trem-ui";
import { getLabel, getWidgetProps } from "./_helpers";

export default function DashboardBookingTable({ widget, labels, options, bookingState, bookingQuery, onBookingQueryChange }) {
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
        title: getLabel(labels, props.table?.titleRef, getLabel(labels, props.titleRef, "Booking List")),
        ariaLabel: getLabel(labels, props.table?.ariaLabelRef, "Booking List"),
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
        onChange: (value) => updateQuery({ sort: value || "Recommended" }),
    };
    const viewBooking = (row) => {
        if (row.bookingId) {
            navigate(`/bookings/${row.bookingId}`, { state: { from: { label: "Bookings", path: "/agent/bookings?tab=dashboard", activeNav: "tours" } } });
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
