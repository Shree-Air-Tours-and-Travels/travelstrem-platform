import React from "react";
import {
  BottomSheet,
  Breadcrumbs,
  Button,
  ConfigurableForm,
  ErrorState,
  FloatingActionBar,
  GlobalSearchCard,
  HotelCard,
  Icon,
  Pagination,
  Preloader,
  Spinner,
} from "@packages/trem-ui";
import { resolveForm } from "../../hotel.utils.js";
import "../../Hotels.scss";

export default function HotelFiltersView({
  contract,
  data,
  values,
  filters,
  error,
  loading,
  mobilePanel,
  onSearch,
  onFilterChange,
  onApplyFilters,
  onResetFilters,
  onPageChange,
  onOpenMobilePanel,
  onRetry,
  onViewHotel,
}) {
  const labels = contract?.elements?.labels || {};
  const options = contract?.dataScope?.options || {};
  const widgets = contract?.structure?.widgets || [];
  const breadcrumbs = widgets.find((widget) => widget.type === "HotelBreadcrumbs");
  const searchProps = widgets.find((widget) => widget.type === "HotelSearch")?.props || {};
  const resultProps = widgets.find((widget) => widget.type === "HotelResults") || {};

  const renderSearch = (placement) => (
    <GlobalSearchCard
      key={`${placement}-${JSON.stringify(values)}`}
      labels={labels}
      urls={contract.elements.urls}
      variant={searchProps.variant}
      activeService={searchProps.activeService}
      modes={options[searchProps.modesOptionsRef]}
      fieldsByMode={options[searchProps.fieldsOptionsRef]}
      choiceGroupsByMode={options[searchProps.choiceGroupsOptionsRef]}
      ariaLabelRef={searchProps.ariaLabelRef}
      submitLabelRef={searchProps.submitLabelRef}
      initialValues={{ hotel: values }}
      initialChoices={{ hotel: values.choice }}
      onSearch={onSearch}
      errorMessage={error?.message}
      fieldErrors={error?.details || {}}
    />
  );
  const renderFilters = () => (
    <>
      <ConfigurableForm
        config={resolveForm(options.filterForm, labels)}
        values={filters}
        onChange={onFilterChange}
      />
      <div className="trehub-hotels__actions">
        <Button text={labels.apply} onClick={() => onApplyFilters(filters)} disabled={loading} />
        <Button text={labels.reset} variant="outline" onClick={onResetFilters} disabled={loading} />
      </div>
    </>
  );

  return (
    <div className="trehub-page">
      <div className="trehub-page__breadcrumbs">
        <Breadcrumbs
          items={(breadcrumbs?.searchItems || []).map((item) => ({
            label: labels[item.labelRef],
            path: item.path,
          }))}
        />
      </div>
      <main className="trehub-hotels" aria-busy={loading}>
        <header className="trehub-hotels__header">
          <div className="trehub-hotels__heading">
            <span className="trehub-eyebrow">{labels.eyebrow}</span>
            <h1>{labels.title}</h1>
            <p>{labels.description}</p>
          </div>
        </header>
        {loading && !data ? <Preloader variant="stack" label={labels.loading || ""} /> : null}
        {loading && data ? <Spinner label={labels.loading || ""} /> : null}
        {error ? (
          <ErrorState
            title={labels.error}
            description={error.message}
            retry={onRetry}
            retryText={labels.retry}
          />
        ) : null}
        {data?.provider === "mock" ? (
          <p role="note" className="trehub-hotels__notice">
            <Icon name="info" size={18} aria-hidden="true" />
            {labels.mock}
          </p>
        ) : null}
        {contract ? (
          <section className="trehub-hotels__search">{renderSearch("page")}</section>
        ) : null}
        {data ? <section className="trehub-hotels__filters">{renderFilters()}</section> : null}
        {data ? (
          <section className="trehub-hotels__results">
            <h2>{data.summary}</h2>
            {!data.cards.length ? <p>{labels.emptyDescription}</p> : null}
            <div className="trehub-hotels__grid">
              {data.cards.map((card) => (
                <HotelCard
                  key={card.id}
                  hotel={card}
                  labels={labels}
                  {...resultProps.cardProps}
                  disabled={card.disabled}
                  hidden={card.hidden}
                  popular={card.popular}
                  onView={onViewHotel}
                  onViewRooms={onViewHotel}
                />
              ))}
            </div>
            <Pagination
              className="trehub-hotels__pagination"
              currentPage={data.pagination.page}
              totalPages={data.pagination.totalPages}
              onPageChange={onPageChange}
              previousLabel={labels[resultProps.paginationProps.previousLabelRef]}
              nextLabel={labels[resultProps.paginationProps.nextLabelRef]}
              ariaLabel={labels[resultProps.paginationProps.ariaLabelRef]}
              disabled={loading}
              showSinglePage={data.pagination.total > 0}
            />
          </section>
        ) : null}
        {contract && !mobilePanel ? (
          <FloatingActionBar
            hideOnDesktop
            actions={[
              {
                id: "search-hotels",
                label: labels.editSearch,
                variant: "outline",
                align: "left",
                iconLeft: "search",
                onClick: () => onOpenMobilePanel("search"),
              },
              {
                id: "filter-hotels",
                label: labels.filters,
                variant: "solid",
                align: "right",
                iconLeft: "filter",
                disabled: !data || loading,
                onClick: () => onOpenMobilePanel("filters"),
              },
            ]}
          />
        ) : null}
        <BottomSheet
          open={Boolean(mobilePanel)}
          onClose={() => onOpenMobilePanel(null)}
          title={mobilePanel === "filters" ? labels.filters : labels.editSearch}
          closeLabel={labels.close}
          className="trehub-hotels__sheet"
        >
          {mobilePanel === "search"
            ? renderSearch("sheet")
            : mobilePanel === "filters"
              ? renderFilters()
              : null}
        </BottomSheet>
      </main>
    </div>
  );
}
