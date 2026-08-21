import React, { useMemo, useState } from "react";
import { BookingTable, Button, InputField, Paragraph, Preloader, SubTitle } from "@packages/trem-ui";
import { fetchData } from "@packages/trem-utils";
import "./BookingsView.scss";

export default function BookingsView({ definition, loading, onViewBooking }) {
  const [enquiryRef, setEnquiryRef] = useState("");
  const [claimMessage, setClaimMessage] = useState("");
  const [claiming, setClaiming] = useState(false);
  const lookup = definition?.props?.enquiryLookup;
  const lookupLabels = definition?.labels || {};
  const claimEnquiry = async (event) => {
    event.preventDefault();
    if (!enquiryRef.trim()) return;
    setClaiming(true); setClaimMessage("");
    try {
      const response = await fetchData("/enquiries/claim", { method: "POST", body: { enquiryRef: enquiryRef.trim() } });
      if (response?.status !== "success") throw new Error(response?.message);
      setClaimMessage(response.message);
      const bookingId = response.componentData?.data?.bookingId;
      if (bookingId) onViewBooking?.({ bookingId });
    } catch (error) {
      setClaimMessage(error?.message || "");
    } finally { setClaiming(false); }
  };
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
          return { ...resolvedColumn, onClick: (row) => row?.isEnquiry ? undefined : onViewBooking(row) };
        }
        return resolvedColumn;
      }),
    };
  }, [definition, onViewBooking]);

  return (
    <div className="dbv">
      {lookup?.enabled ? <div className="dbv__enquiry-section">
        <form id="enquiry-lookup" className="dbv__enquiry-lookup" onSubmit={claimEnquiry}>
          <div>
            <SubTitle text={lookupLabels[lookup.titleRef]} />
            <Paragraph text={lookupLabels[lookup.descriptionRef]} size="small" />
          </div>
          <InputField label={lookupLabels[lookup.fieldLabelRef]} value={enquiryRef} placeholder={lookupLabels[lookup.placeholderRef]} onChange={setEnquiryRef} />
          <Button type="submit" variant="solid" color="primary" text={claiming ? lookupLabels[lookup.submittingLabelRef] : lookupLabels[lookup.actionLabelRef]} disabled={claiming || !enquiryRef.trim()} />
          {claimMessage ? <p role="status">{claimMessage}</p> : null}
        </form>
      </div> : null}
      {loading ? (
        <Preloader variant="cards" count={3} label="Loading booking table" />
      ) : tableDefinition ? (
        <BookingTable
          {...tableDefinition}
          heroBanner={null}
          onRowClick={(row) => row?.isEnquiry ? undefined : onViewBooking(row)}
          className="dbv__booking-table"
        />
      ) : null}
    </div>
  );
}
