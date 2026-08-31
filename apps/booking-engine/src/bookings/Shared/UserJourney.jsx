import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button, InputField } from "@packages/trem-ui";
import { fetchData } from "@packages/trem-utils";
import useEnquiryBookings from "./useEnquiryBookings.js";
import BookingEnquiryCenter from "./BookingEnquiryCenter.jsx";

export default function UserJourney({ journeyType = "" }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { enquiries, bookings, view, loading, error, load } = useEnquiryBookings(journeyType);
  const selectedId = searchParams.get("booking") || searchParams.get("enquiry") || "";
  const [enquiryRef, setEnquiryRef] = useState("");
  const [claimState, setClaimState] = useState({ saving: false, message: "", error: false });

  const claim = async (event) => {
    event.preventDefault();
    if (!enquiryRef.trim()) return;
    setClaimState({ saving: true, message: "", error: false });
    try {
      const response = await fetchData("/enquiries/claim", {
        method: "POST",
        body: { enquiryRef: enquiryRef.trim() },
      });
      if (response?.status !== "success") throw new Error(response?.message);
      setClaimState({ saving: false, message: response.message, error: false });
      setEnquiryRef("");
      await load();
    } catch (error) {
      setClaimState({ saving: false, message: error?.message, error: true });
    }
  };

  const selectEnquiry = (item) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", "bookings");
    if (item.recordType === "booking") {
      next.set("booking", item.reference || item.bookingRef || item.id);
      next.delete("enquiry");
    } else {
      next.set("enquiry", item.reference || item.enquiryRef || item.id);
      next.delete("booking");
    }
    setSearchParams(next);
  };

  return (
    <div className="booking-engine-workspace">
      {!selectedId && view.claim ? (
        <form className="booking-engine-workspace__claim" onSubmit={claim}>
          <div>
            <h2>{view.claim.title}</h2>
            <p>{view.claim.description}</p>
          </div>
          <InputField
            label={view.claim.fieldLabel}
            value={enquiryRef}
            placeholder={view.claim.placeholder}
            onChange={setEnquiryRef}
          />
          <Button
            type="submit"
            primaryClassName="booking-engine-workspace__claim-submit"
            text={claimState.saving ? view.claim.submitting : view.claim.submit}
            disabled={claimState.saving || !enquiryRef.trim()}
          />
          {claimState.message ? (
            <p className={claimState.error ? "is-error" : "is-success"} role="status">
              {claimState.message}
            </p>
          ) : null}
        </form>
      ) : null}
      <BookingEnquiryCenter
        title={view.title}
        description={view.description}
        view={view}
        enquiries={enquiries}
        bookings={bookings}
        selectedId={selectedId}
        loading={loading}
        error={error}
        onRetry={load}
        onSelect={selectEnquiry}
      />
    </div>
  );
}
