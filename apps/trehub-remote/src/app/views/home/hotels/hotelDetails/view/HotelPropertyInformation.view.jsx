import React, { useState } from "react";
import { Button, ErrorState, Icon, Spinner } from "@packages/trem-ui";

export default function HotelPropertyInformationView({
  data,
  error,
  labels,
  widgetProps = {},
  onRetry,
}) {
  const [showAllAmenities, setShowAllAmenities] = useState(false);
  const [showAllPolicies, setShowAllPolicies] = useState(false);
  const amenityPreviewCount = widgetProps.amenityPreviewCount || 12;
  const policyPreviewCount = widgetProps.policyPreviewCount || 4;
  const hasRules = Boolean(
    data?.rules?.checkIn ||
    data?.rules?.checkOut ||
    data?.policies?.length ||
    data?.policySections?.length,
  );
  const hasMainDetails = Boolean(
    data?.amenities?.length ||
    data?.services?.length ||
    hasRules ||
    data?.detailSections?.length ||
    data?.reviewCards?.length ||
    data?.contact?.phone,
  );

  return (
    <section className="trehub-hotels__property-information">
      <div className="trehub-hotels__section-heading">
        <div>
          <h2>{labels.morePropertyDetails}</h2>
          {hasMainDetails ? <p>{labels.morePropertyDetailsDescription}</p> : null}
        </div>
      </div>
      {error ? (
        <ErrorState
          title={labels.error}
          description={error.message}
          retry={onRetry}
          retryText={labels.retry}
        />
      ) : null}
      {!data && !error ? (
        <div className="trehub-hotels__widget-loading">
          <Spinner label={labels.loading || ""} />
        </div>
      ) : null}
      {data ? (
        <>
          <div className="trehub-hotels__property-columns">
            {hasMainDetails ? (
              <div className="trehub-hotels__property-main">
                {data.amenities?.length ? (
                  <section className="trehub-hotels__property-block">
                    <h3>{labels.amenities}</h3>
                    <div className="trehub-hotels__amenities">
                      {(showAllAmenities
                        ? data.amenities
                        : data.amenities.slice(0, amenityPreviewCount)
                      ).map((amenity, index) => (
                        <span key={`${amenity.value}-${index}`}>
                          <Icon name={amenity.icon} size={18} aria-hidden="true" />
                          {amenity.value}
                        </span>
                      ))}
                    </div>
                    {data.amenities.length > amenityPreviewCount ? (
                      <Button
                        text={
                          showAllAmenities
                            ? labels.showFewerAmenities
                            : labels.showAllAmenities?.replace("{count}", data.amenities.length)
                        }
                        variant="text"
                        onClick={() => setShowAllAmenities((current) => !current)}
                      />
                    ) : null}
                  </section>
                ) : null}
                {hasRules ? (
                  <section className="trehub-hotels__property-block">
                    <h3>{labels.hotelRules}</h3>
                    {data.rules?.checkIn || data.rules?.checkOut ? (
                      <div className="trehub-hotels__rule-times">
                        {data.rules.checkIn ? (
                          <div>
                            <Icon name="clock" size={20} aria-hidden="true" />
                            <span>
                              <small>{labels.checkInRule}</small>
                              <strong>{data.rules.checkIn}</strong>
                            </span>
                          </div>
                        ) : null}
                        {data.rules.checkOut ? (
                          <div>
                            <Icon name="clock" size={20} aria-hidden="true" />
                            <span>
                              <small>{labels.checkOutRule}</small>
                              <strong>{data.rules.checkOut}</strong>
                            </span>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                    {data.policySections?.length ? (
                      <div className="trehub-hotels__policy-sections">
                        {data.policySections.map((section, index) => (
                          <details key={section.id} open={index === 0 ? true : undefined}>
                            <summary>
                              <strong>{section.title}</strong>
                              <Icon name="chevronDown" size={18} aria-hidden="true" />
                            </summary>
                            <ul>
                              {section.items.map((item, itemIndex) => (
                                <li key={`${section.id}-${itemIndex}`}>{item}</li>
                              ))}
                            </ul>
                          </details>
                        ))}
                      </div>
                    ) : null}
                    {data.policies?.length ? (
                      <ul className="trehub-hotels__rule-list">
                        {(showAllPolicies
                          ? data.policies
                          : data.policies.slice(0, policyPreviewCount)
                        ).map((policy, index) => (
                          <li key={`${policy}-${index}`}>
                            <Icon name="shieldCheck" size={18} aria-hidden="true" />
                            {policy}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {data.policies?.length > policyPreviewCount ? (
                      <Button
                        text={
                          showAllPolicies
                            ? labels.showFewerPolicies
                            : labels.showAllPolicies?.replace("{count}", data.policies.length)
                        }
                        variant="text"
                        onClick={() => setShowAllPolicies((current) => !current)}
                      />
                    ) : null}
                  </section>
                ) : null}
                {data.services?.length ? (
                  <section className="trehub-hotels__property-block">
                    <h3>{labels.services}</h3>
                    <div className="trehub-hotels__amenities">
                      {data.services.map((service, index) => (
                        <span key={`${service.value}-${index}`}>
                          <Icon name={service.icon} size={18} aria-hidden="true" />
                          {service.value}
                        </span>
                      ))}
                    </div>
                  </section>
                ) : null}
                {data.detailSections?.length ? (
                  <section className="trehub-hotels__property-block">
                    <h3>{labels.morePropertyDetails}</h3>
                    <div className="trehub-hotels__provider-sections">
                      {data.detailSections.map((section) => (
                        <details key={section.id} open>
                          <summary>
                            <span>
                              <h4>{section.title}</h4>
                              {section.description ? <p>{section.description}</p> : null}
                            </span>
                            <span className="trehub-hotels__provider-section-count">
                              {labels.detailItemCount?.replace(
                                "{count}",
                                section.items?.length || 0,
                              )}
                              <Icon name="chevronDown" size={18} aria-hidden="true" />
                            </span>
                          </summary>
                          {section.items?.length ? (
                            <dl>
                              {section.items.map((item, index) => (
                                <div key={`${item.id}-${index}`}>
                                  <Icon name={item.icon || "info"} size={18} aria-hidden="true" />
                                  <span>
                                    {item.label ? <dt>{item.label}</dt> : null}
                                    {item.value ? <dd>{item.value}</dd> : null}
                                  </span>
                                </div>
                              ))}
                            </dl>
                          ) : null}
                        </details>
                      ))}
                    </div>
                  </section>
                ) : null}
                {data.reviewCards?.length ? (
                  <section className="trehub-hotels__property-block trehub-hotels__review-section">
                    <h3>{labels.guestReviews}</h3>
                    <div className="trehub-hotels__review-grid">
                      {data.reviewCards.map((review, index) => (
                        <blockquote key={index}>
                          <p>{review.body}</p>
                          {review.author ? <footer>{review.author}</footer> : null}
                        </blockquote>
                      ))}
                    </div>
                  </section>
                ) : null}
                {data.contact?.phone ? (
                  <section className="trehub-hotels__property-block trehub-hotels__contact-card">
                    <h3>{labels.propertyContact}</h3>
                    <p>{data.contact.phone}</p>
                    <Button
                      text={labels.callProperty}
                      variant="outline"
                      href={data.contact.phoneUrl}
                      iconLeft="phoneCall"
                    />
                  </section>
                ) : null}
              </div>
            ) : null}
          </div>
        </>
      ) : null}
    </section>
  );
}
