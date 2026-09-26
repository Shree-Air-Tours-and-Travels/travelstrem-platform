import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Breadcrumbs } from "@packages/trem-ui";
import QuoteBuilder from "./QuoteBuilder.jsx";

export default function QuoteBuilderRoute({ enquiryId, basePath }) {
  const navigate = useNavigate();
  const [enquiryRef, setEnquiryRef] = useState("Enquiry");
  return (
    <section className="booking-engine-journey-page">
      <Breadcrumbs items={[
        { label: "Bookings & enquiries", onClick: () => navigate(basePath) },
        { label: enquiryRef },
        { label: "Quote builder" },
      ]} />
      <QuoteBuilder
        enquiryId={enquiryId}
        onLoadedMeta={({ enquiryRef: reference }) => setEnquiryRef(reference)}
        onExit={() => navigate(basePath)}
      />
    </section>
  );
}
