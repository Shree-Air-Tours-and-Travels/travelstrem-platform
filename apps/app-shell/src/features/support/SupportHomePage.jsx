import { useSupportNavigate } from "./SupportLayout";
import React, { useEffect, useState } from "react";
import {
  Button,
  DashboardPanel,
  EmptyState,
  SearchBar,
  SupportCategoryCard,
  SupportContactMethod,
  SupportTopicRow,
} from "@packages/trem-ui";

import { SUPPORT_ANALYTICS_EVENT } from "@packages/trem-support-contracts";
import { useEnquiryRealtime, useRealtimeEvent, REALTIME_EVENTS } from "@packages/trem-events";
import { supportApi } from "./support.api";
import { useSupportResource } from "./support.hooks";
import { ResourceBoundary, SupportLayout, SupportSection } from "./SupportLayout";
import { executeSupportAction, trackSupport } from "./support.utils";

export default function SupportHomePage({ isAuthenticated = false, onRequireAuthentication }) {
  const navigate = useSupportNavigate();
  const resource = useSupportResource((signal) => supportApi.home(signal), []);
  const personal = useSupportResource(async (signal) => {
    if (!isAuthenticated) return null;
    const [context, requests] = await Promise.all([supportApi.categories(signal), supportApi.tickets("", signal)]);
    return { contexts: context.contexts || [], tickets: requests.tickets || [] };
  }, [isAuthenticated]);
  useEnquiryRealtime(() => { if (isAuthenticated) personal.reload(); });
  useRealtimeEvent(REALTIME_EVENTS.SUPPORT_TICKET_CREATED, () => { if (isAuthenticated) personal.reload(); });
  useRealtimeEvent(REALTIME_EVENTS.SUPPORT_CONVERSATION_UPDATED, () => { if (isAuthenticated) personal.reload(); });
  const [query, setQuery] = useState("");
  const [visibleJourneyCount, setVisibleJourneyCount] = useState(5);
  const [search, setSearch] = useState({ loading: false, results: [], error: "" });
  const data = resource.data;

  useEffect(() => {
    trackSupport(SUPPORT_ANALYTICS_EVENT.HELP_CENTER_VIEWED);
  }, []);
  useEffect(() => {
    if (query.trim().length < 2) {
      setSearch({ loading: false, results: [], error: "" });
      return undefined;
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      setSearch((current) => ({ ...current, loading: true, error: "" }));
      supportApi
        .search(query.trim(), controller.signal)
        .then((result) => setSearch({ loading: false, results: result.results || [], error: "" }))
        .catch((error) => setSearch({ loading: false, results: [], error: error.message }));
    }, 250);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  const requireAuthentication = (target = "/help") =>
    onRequireAuthentication?.({
      returnTo: new URL(target, window.location.origin).toString(),
    });
  const openAction = (action) => {
    const requiresAuth = Boolean(action?.requiresAuth || action?.action?.requiresAuth);
    const target = action?.action?.target || action?.target || "/help";
    if (!isAuthenticated && requiresAuth) {
      requireAuthentication(target);
      return;
    }
    executeSupportAction(action, navigate);
  };
  const categories = data?.categories || [];
  const contacts = data?.contactOptions || [];

  return (
    <SupportLayout
      title={data?.ui?.header?.title}
      subtitle={data?.ui?.header?.subtitle}
      actions={
        isAuthenticated && data?.ui?.actions?.requests ? (
          <Button
            size="small"
            variant="outline"
            iconLeft="ticket"
            text={data.ui.actions.requests}
            onClick={() => navigate("/help/requests")}
          />
        ) : null
      }
    >
      <ResourceBoundary {...resource}>
        <div className="support-home">
          <div className="support-search">
            <SearchBar
              value={query}
              onChange={setQuery}
              placeholder={data?.ui?.header?.searchPlaceholder}
              ariaLabel={data?.ui?.header?.searchPlaceholder}
            />
            {query.trim().length >= 2 ? (
              <div className="support-search__results" aria-live="polite">
                {search.loading ? (
                  <p>{data?.ui?.header?.searchingLabel}</p>
                ) : search.error ? (
                  <p role="alert">{search.error}</p>
                ) : search.results.length ? (
                  search.results.map((result) => (
                    <SupportTopicRow
                      key={`${result.type}-${result.id}`}
                      topic={result}
                      onSelect={() => openAction(result)}
                    />
                  ))
                ) : (
                  <EmptyState {...data?.ui?.emptyStates?.search} />
                )}
              </div>
            ) : null}
          </div>

          {isAuthenticated ? (
            <ResourceBoundary {...personal}>
              <DashboardPanel
                title="Your bookings and enquiries"
                description="Choose a journey to get help. Its details will be attached to your request."
                emptyTitle="Your bookings and enquiries will appear here"
                items={(personal.data?.contexts || []).slice(0, visibleJourneyCount).map(item => ({
                  id: item.id, label: item.title, description: item.reference, status: item.status,
                  target: `/help/new-request?contextId=${encodeURIComponent(item.id)}`,
                }))}
                onItemClick={navigate}
              />
              {(personal.data?.contexts?.length || 0) > visibleJourneyCount ? (
                <Button
                  text="Show more"
                  variant="outline"
                  onClick={() => setVisibleJourneyCount(count => count + 5)}
                />
              ) : null}
              <DashboardPanel
                title="Your support requests"
                emptyTitle="You have no support requests yet"
                items={(personal.data?.tickets || []).slice(0, 5).map(ticket => ({
                  id: ticket.id, label: ticket.subject, description: ticket.reference, status: ticket.status,
                  target: `/help/requests/${encodeURIComponent(ticket.id)}`,
                }))}
                onItemClick={navigate}
                action={{ label: "View all requests", onClick: () => navigate("/help/requests") }}
              />
            </ResourceBoundary>
          ) : null}
          <SupportSection title={data?.ui?.sections?.options?.title}>
            {categories.length ? (
              <div className="support-card-grid">
                {categories.map((category) => (
                  <SupportCategoryCard
                    key={category.id}
                    item={category}
                    onSelect={() => {
                      const target = `/help/new-request?category=${encodeURIComponent(category.id)}`;
                      if (isAuthenticated) navigate(target);
                      else requireAuthentication(target);
                    }}
                  />
                ))}
              </div>
            ) : (
              <EmptyState {...data?.ui?.emptyStates?.categories} />
            )}
          </SupportSection>

          {contacts.length ? (
            <SupportSection title={data?.ui?.sections?.contact?.title}>
              <div className="support-list">
                {contacts.map((option) => (
                  <SupportContactMethod
                    key={option.id}
                    option={option}
                    onSelect={() => {
                      trackSupport(SUPPORT_ANALYTICS_EVENT.CONTACT_SELECTED, {
                        contactType: option.type,
                      });
                      openAction(option);
                    }}
                  />
                ))}
              </div>
            </SupportSection>
          ) : null}
        </div>
      </ResourceBoundary>
    </SupportLayout>
  );
}
