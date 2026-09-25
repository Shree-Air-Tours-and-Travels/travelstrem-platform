import React, { useEffect, useState } from "react";
import {
  Button,
  EmptyState,
  SearchBar,
  SupportCategoryCard,
  SupportContactMethod,
  SupportTopicRow,
} from "@packages/trem-ui";
import { useNavigate } from "react-router-dom";
import { SUPPORT_ANALYTICS_EVENT } from "@packages/trem-support-contracts";
import { supportApi } from "./support.api";
import { useSupportResource } from "./support.hooks";
import { ResourceBoundary, SupportLayout, SupportSection } from "./SupportLayout";
import { executeSupportAction, trackSupport } from "./support.utils";

export default function SupportHomePage({ isAuthenticated = false, onRequireAuthentication }) {
  const navigate = useNavigate();
  const resource = useSupportResource((signal) => supportApi.home(signal), []);
  const [query, setQuery] = useState("");
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
