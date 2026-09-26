import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import useEnquiryBookings from "./useEnquiryBookings.js";
import BookingEnquiryCenter from "./BookingEnquiryCenter.jsx";
import QuoteBuilderRoute from "../../quote-builder/QuoteBuilderRoute.jsx";

function AgentAdminJourneyList({ journeyType }) {
  const { enquiries, bookings, view, loading, error, load } = useEnquiryBookings(journeyType);
  const location = useLocation();
  const navigate = useNavigate();
  const detailMatch = location.pathname.match(/^(.*\/(?:bookings|enquiries))\/([^/]+)\/?$/);
  const selectedId = detailMatch ? decodeURIComponent(detailMatch[2]) : "";
  const bookingBasePath = detailMatch
    ? detailMatch[1]
    : location.pathname.startsWith("/manage/")
      ? "/manage/bookings"
      : location.pathname.replace(/\/$/, "");

  return (
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
      onSelect={(item) =>
        navigate(`${bookingBasePath}/${encodeURIComponent(item.reference || item.id)}`)
      }
      onOpenJourneyPage={(_, enquiryId) =>
        navigate(`${bookingBasePath}/${encodeURIComponent(enquiryId)}/quotebuilder`)
      }
    />
  );
}

export default function AgentAdminJourney({ journeyType = "" }) {
  const location = useLocation();
  const routeMatch = location.pathname.match(/\/(?:bookings|enquiries)\/([^/]+)\/quotebuilder\/?$/);
  if (routeMatch) {
    const enquiryId = decodeURIComponent(routeMatch[1]);
    const basePath = location.pathname.slice(0, location.pathname.lastIndexOf(`/${routeMatch[1]}/quotebuilder`));
    return <QuoteBuilderRoute enquiryId={enquiryId} basePath={basePath} />;
  }
  return <AgentAdminJourneyList journeyType={journeyType} />;
}
