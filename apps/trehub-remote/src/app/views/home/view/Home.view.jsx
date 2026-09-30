import React from "react";
import {
  BenefitCard,
  ClientShowcase,
  ErrorState,
  Breadcrumbs,
  GlobalSearchCard,
  Paragraph,
  PopularLocations,
  SubTitle,
} from "@packages/trem-ui";
import TrehubPreloader from "../TrehubPreloader.jsx";

const labelFor = (labels = {}, ref, fallback = "") =>
  ref ? labels[ref] || fallback || ref : fallback;

const getByPath = (source = {}, path = "") =>
  path
    .split(".")
    .filter(Boolean)
    .reduce((value, key) => value?.[key], source);

const formatLabel = (value = "", replacements = {}) =>
  Object.entries(replacements).reduce(
    (result, [key, replacement]) => result.replaceAll(`{${key}}`, String(replacement ?? "")),
    value,
  );

function WhyTrehub({ widget = {}, labels = {} }) {
  const props = widget.props || {};
  const items = Array.isArray(props.items) ? props.items : [];

  return (
    <section className="trehub-why">
      <div className="trehub-why__head">
        {props.eyebrowRef ? (
          <span className="trehub-eyebrow">{labelFor(labels, props.eyebrowRef)}</span>
        ) : null}
        {props.titleRef ? (
          <SubTitle
            primaryClassname="trehub-why__title"
            text={labelFor(labels, props.titleRef)}
            variant="primary"
            size="large"
          />
        ) : null}
        {props.descriptionRef ? (
          <Paragraph
            primaryClassname="trehub-why__description"
            text={labelFor(labels, props.descriptionRef)}
            variant="body"
            size="medium"
          />
        ) : null}
      </div>
      <div className="trehub-why__grid">
        {items.map((item, index) => (
          <BenefitCard
            key={item.id || item.titleRef}
            className="trehub-why__card"
            icon={item.icon || "sparkles"}
            title={labelFor(labels, item.titleRef, item.title)}
            description={labelFor(labels, item.descriptionRef, item.description)}
            variant={index === 0 ? "highlighted" : "default"}
          />
        ))}
      </div>
    </section>
  );
}

export default function HomeView({ loading, error, pageModel, onSearch }) {
  if (loading) return <TrehubPreloader variant="home" label={pageModel?.labels?.loading} />;

  if (error || !pageModel) {
    return (
      <ErrorState
        title={pageModel?.labels?.loadErrorTitle}
        description={pageModel?.labels?.loadErrorDescription}
        error={error}
        retry={() => window.location.reload()}
        retryText={pageModel?.labels?.retry}
      />
    );
  }

  const labels = pageModel.labels || {};
  const urls = pageModel.urls || {};
  const options = pageModel.options || {};
  const data = pageModel.data || {};
  const widgets = pageModel.widgets || [];

  return (
    <main className="trehub-home">
      <div className="trehub-page__breadcrumbs">
        <Breadcrumbs
          items={(widgets.find((widget) => widget.name === "breadcrumbs")?.props?.items || []).map(
            (item) => ({ label: labels[item.labelRef], path: item.path }),
          )}
        />
      </div>
      <div className="trehub-home__shell">
        {widgets.map((widget) => {
          const props = widget.props || {};
          if (widget.type === "GlobalSearchCard" || widget.name === "searchCard") {
            return (
              <GlobalSearchCard
                key={widget.name || widget.type}
                labels={labels}
                urls={urls}
                variant={props.variant}
                activeService={props.activeService}
                eyebrowRef={props.eyebrowRef}
                titleRef={props.titleRef}
                titleAccentRef={props.titleAccentRef}
                descriptionRef={props.descriptionRef}
                backgroundUrlRef={props.backgroundUrlRef}
                ariaLabelRef={props.ariaLabelRef}
                modes={options[props.modesOptionsRef] || props.modes}
                fieldsByMode={options[props.fieldsOptionsRef] || props.fieldsByMode}
                choiceGroupsByMode={
                  options[props.choiceGroupsOptionsRef] || props.choiceGroupsByMode
                }
                submitLabelRef={props.submitLabelRef}
                trustItems={props.trustItems}
                overlap={props.overlap}
                onSearch={onSearch}
              />
            );
          }
          if (widget.type === "WhyTrehub" || widget.name === "whyTrehub") {
            return <WhyTrehub key={widget.name || widget.type} widget={widget} labels={labels} />;
          }
          if (widget.type === "PopularLocations" || widget.name === "popularLocations") {
            const locations = getByPath(data, props.locationsDataPath) || [];
            return (
              <PopularLocations
                key={widget.name || widget.type}
                eyebrow={labelFor(labels, props.eyebrowRef)}
                title={labelFor(labels, props.titleRef)}
                description={labelFor(labels, props.descriptionRef)}
                columns={props.columns}
                cardVariant={props.cardVariant}
                emptyTitle={labelFor(labels, props.emptyTitleRef)}
                emptyDescription={labelFor(labels, props.emptyDescriptionRef)}
                locations={locations.map((location) => ({
                  id: location.id,
                  title: labelFor(labels, location.titleRef),
                  description: labelFor(labels, location.descriptionRef),
                  location: labelFor(labels, location.locationRef),
                  image: {
                    src: urls[location.imageUrlRef] || "",
                    alt: labelFor(labels, location.imageAltRef),
                  },
                }))}
              />
            );
          }
          if (widget.type === "ClientShowcase" || widget.name === "clientShowcase") {
            const count = Number(getByPath(data, props.templateValues?.count) || 0);
            const templateValues = Object.fromEntries(
              Object.entries(props.templateValues || {}).map(([key, path]) => [
                key,
                getByPath(data, path),
              ]),
            );
            return (
              <ClientShowcase
                key={widget.name || widget.type}
                eyebrow={labelFor(labels, props.eyebrowRef)}
                title={formatLabel(
                  labelFor(labels, count > 0 ? props.titleRef : props.emptyTitleRef),
                  templateValues,
                )}
                description={labelFor(labels, props.descriptionRef)}
                clients={getByPath(data, props.clientsDataPath) || []}
              />
            );
          }
          return null;
        })}
      </div>
    </main>
  );
}
