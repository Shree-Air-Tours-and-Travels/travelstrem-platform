import React, { useEffect, useMemo, useState } from "react";
import { Button, EmptyState, SearchBar, SupportBookingCard, SupportCategoryCard, SupportContactMethod, SupportTopicRow } from "@packages/trem-ui";
import { useNavigate } from "react-router-dom";
import { SUPPORT_ANALYTICS_EVENT } from "@packages/trem-support-contracts";
import { supportApi } from "./support.api";
import { useSupportResource } from "./support.hooks";
import { ResourceBoundary, SupportLayout, SupportSection } from "./SupportLayout";
import { executeSupportAction, trackSupport, withBookingLabels } from "./support.utils";

export default function SupportHomePage() {
  const navigate = useNavigate();
  const resource = useSupportResource((signal) => supportApi.home(signal), []);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState({ loading: false, results: [], error: "" });
  const data = resource.data;

  useEffect(() => { trackSupport(SUPPORT_ANALYTICS_EVENT.HELP_CENTER_VIEWED); }, []);
  useEffect(() => {
    if (query.trim().length < 2) { setSearch({ loading: false, results: [], error: "" }); return undefined; }
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      setSearch((current) => ({ ...current, loading: true, error: "" }));
      supportApi.search(query.trim(), controller.signal)
        .then((result) => setSearch({ loading: false, results: result.results || [], error: "" }))
        .catch((error) => setSearch({ loading: false, results: [], error: error.message }));
    }, 250);
    return () => { clearTimeout(timeout); controller.abort(); };
  }, [query]);

  const bookings = useMemo(() => (data?.bookings || []).map(withBookingLabels), [data?.bookings]);
  const openAction = (action) => executeSupportAction(action, navigate);

  return (
    <SupportLayout title={data?.ui?.header?.title || "Help & Support"} subtitle={data?.ui?.header?.subtitle} actions={<Button size="small" variant="outline" iconLeft="ticket" text="My requests" onClick={() => navigate("/help/requests")} />}>
      <ResourceBoundary {...resource}>
        <div className="support-home">
          <div className="support-search">
            <SearchBar value={query} onChange={setQuery} placeholder={data?.ui?.header?.searchPlaceholder} ariaLabel={data?.ui?.header?.searchPlaceholder} />
            {query.trim().length >= 2 ? <div className="support-search__results" aria-live="polite">{search.loading ? <p>Searching…</p> : search.error ? <p role="alert">{search.error}</p> : search.results.length ? search.results.map((result) => <SupportTopicRow key={`${result.type}-${result.id}`} topic={result} onSelect={() => openAction(result)} />) : <EmptyState {...data?.ui?.emptyStates?.search} />}</div> : null}
          </div>

          <SupportSection title={data?.ui?.sections?.bookings?.title} action={<Button variant="text" text="View all" onClick={() => navigate("/help/bookings")} />}>
            {bookings.length ? <div className="support-booking-list">{bookings.map((booking) => <SupportBookingCard key={booking.id} booking={booking} onSelect={() => { trackSupport(SUPPORT_ANALYTICS_EVENT.BOOKING_SELECTED, { bookingId: booking.id, serviceId: booking.service?.id }); navigate(`/help/booking/${booking.id}`); }} onAction={(action) => openAction(action)} />)}</div> : <EmptyState className="support-bookings-empty" {...data?.ui?.emptyStates?.bookings} />}
          </SupportSection>

          <SupportSection title={data?.ui?.sections?.services?.title}>
            <div className="support-service-grid">{(data?.services || []).map((service) => <SupportCategoryCard key={service.id} className={`support-service-card support-service-card--${service.tone || "neutral"}`} item={{ ...service, label: service.name }} onSelect={() => navigate(`/help/service/${service.id}`)} />)}</div>
          </SupportSection>

          <SupportSection title={data?.ui?.sections?.topics?.title}>
            <div className="support-list">{(data?.topics || []).map((topic) => <SupportTopicRow key={topic.id} topic={topic} onSelect={() => { trackSupport(SUPPORT_ANALYTICS_EVENT.TOPIC_OPENED, { topicId: topic.id }); openAction(topic); }} />)}</div>
          </SupportSection>

          <SupportSection title={data?.ui?.sections?.contact?.title}>
            <div className="support-list">{(data?.contactOptions || []).map((option) => <SupportContactMethod key={option.id} option={option} onSelect={() => { trackSupport(SUPPORT_ANALYTICS_EVENT.CONTACT_SELECTED, { contactType: option.type }); openAction(option); }} />)}</div>
          </SupportSection>
        </div>
      </ResourceBoundary>
    </SupportLayout>
  );
}
