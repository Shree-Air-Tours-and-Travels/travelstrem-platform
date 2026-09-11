import React from "react";
import {
  Breadcrumbs,
  Button,
  ErrorState,
  FlightCard,
  FlightDetails,
  FloatingActionBar,
  Preloader,
  Spinner,
  InputField,
  SingleSelect,
  StatusBadge,
  TimelineStepper,
} from "@packages/trem-ui";
import { ConfirmOverlay } from "@packages/trem-modals";
import "./FlightDetails.view.scss";

const labelFor = (labels, ref, fallback = "") => labels?.[ref] || fallback || ref;
const template = (value, replacements = {}) =>
  Object.entries(replacements).reduce(
    (text, [key, replacement]) => text.replaceAll(`{${key}}`, String(replacement)),
    value || "",
  );
const money = (amount, currency = "INR") =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(
    Number(amount || 0) / 100,
  );

const requiredPassengerFields = [
  "title",
  "firstName",
  "lastName",
  "gender",
  "dateOfBirth",
  "nationality",
];

export default function FlightDetailsView({
  loading,
  error,
  contract,
  offer,
  seatMap,
  booking,
  step,
  fareId,
  passengers,
  seats,
  revalidation,
  saving,
  enquiryModalOpen,
  onFareChange,
  onPassengerChange,
  onSeatToggle,
  onBack,
  onContinue,
  onCloseEnquiryModal,
  onCreateEnquiry,
  onRevalidate,
  onBook,
  onRetryLoad,
  onBackToSearch,
}) {
  if (loading) return <Preloader variant="stack" label={contract?.labels?.loading || ""} />;
  if (error && !contract) {
    return (
      <ErrorState
        title={contract?.labels?.loadErrorTitle}
        error={error}
        retry={() => window.location.reload()}
      />
    );
  }

  const labels = contract?.labels || {};
  const options = contract?.options || {};
  const widget = (name) => contract?.widgets?.find((item) => item.name === name);
  const journey = widget("bookingJourney")?.props || {};
  const breadcrumbs = widget("breadcrumbs")?.props || {};
  const flightDetailsWidget = widget("flightDetails");
  const fareWidget = widget("fareSelection");
  const travellerWidget = widget("travellerDetails");
  const seatWidget = widget("seatSelection");
  const reviewWidget = widget("priceReview");
  const confirmationWidget = widget("bookingConfirmation");
  const fares = offer?.fares || [];
  const selectedFare = fares.find((fare) => fare.fareId === fareId) || fares[0];
  const passportRequired = Boolean(offer?.requirements?.passportRequired);
  const passengersComplete = passengers.every(
    (passenger) =>
      requiredPassengerFields.every((field) => passenger[field]) &&
      (!passportRequired ||
        (passenger.passport?.number &&
          passenger.passport?.expiryDate &&
          passenger.passport?.issuingCountry)),
  );
  const stepItems = (journey.steps || []).map((ref, index) => ({
    label: labelFor(labels, ref),
    status: index < step ? "completed" : index === step ? "current" : "pending",
  }));
  const price = revalidation?.currentPrice || selectedFare?.pricing || offer?.price || {};
  const cabins = [...new Set(fares.map((fare) => fare.cabin))];
  const activeCabin = selectedFare?.cabin || cabins[0];
  const visibleFares = fares.filter((fare) => fare.cabin === activeCabin);
  const cabinLabel = (value) =>
    String(value || "")
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());

  return (
    <main className="trehub-flight-journey">
      <div className="trehub-flight-journey__breadcrumb trehub-page__breadcrumbs">
        <Breadcrumbs
          items={(breadcrumbs.items || []).map((item) => ({
            label: labelFor(labels, item.labelRef),
            path: item.path,
          }))}
        />
      </div>

      <header className="trehub-flight-journey__hero">
        <span>{labelFor(labels, "journeyEyebrow")}</span>
        <h1>{labelFor(labels, step === 4 ? "bookingComplete" : "journeyTitle")}</h1>
        <p>{labelFor(labels, step === 4 ? "bookingCompleteDescription" : "journeyDescription")}</p>
      </header>

      <div className="trehub-flight-journey__layout">
        <aside className="trehub-flight-journey__steps">
          <TimelineStepper
            steps={stepItems}
            orientation="horizontal"
            markerVariant="number"
            showStepNumbers
            showTime={false}
          />
        </aside>

        <section className="trehub-flight-journey__content">
          {saving ? <Spinner label={labels.saving || ""} /> : null}
          {offer && step !== flightDetailsWidget?.props?.showAtStep ? (
            <FlightCard
              flight={{ ...offer, fare: selectedFare, price: selectedFare?.pricing || offer.price }}
              labels={{
                departureLabel: labelFor(labels, "departure"),
                cabinLabel: labelFor(labels, "cabin"),
                priceLabel: labelFor(labels, "priceFrom"),
                priceSuffix: labelFor(labels, "perTraveller"),
                selectLabel: labelFor(labels, "viewFlight"),
              }}
              hideAction
            />
          ) : null}

          {offer && flightDetailsWidget && step === flightDetailsWidget.props?.showAtStep ? (
            <FlightDetails
              details={offer.details}
              selectedFareId={fareId}
              labels={labels}
              config={flightDetailsWidget.props}
            />
          ) : null}

          {error ? (
            <div className="trehub-flight-journey__notice" role="alert">
              {error}
            </div>
          ) : null}

          {!offer && !booking ? (
            <ErrorState
              className="trehub-flight-journey__recovery"
              title={labels.unavailableTitle}
              description={labels.unavailableDescription}
              actions={
                <>
                  <Button text={labels.backToFlights} onClick={onBackToSearch} />
                  <Button variant="outline" text={labels.retry} onClick={onRetryLoad} />
                </>
              }
            />
          ) : null}

          {offer && fareWidget && step === fareWidget.props?.showAtStep ? (
            <div className="trehub-flight-journey__panel">
              <div className="trehub-flight-journey__panel-heading">
                <div>
                  <span>{fareWidget.props.stepNumber}</span>
                  <h2>{labelFor(labels, fareWidget.props.titleRef)}</h2>
                </div>
                <p>{labelFor(labels, fareWidget.props.descriptionRef)}</p>
              </div>
              {cabins.length > 1 ? (
                <div
                  className="trehub-flight-journey__cabin-tabs"
                  role="tablist"
                  aria-label={labelFor(labels, "cabin")}
                >
                  {cabins.map((cabin) => (
                    <button
                      key={cabin}
                      type="button"
                      role="tab"
                      aria-selected={cabin === activeCabin}
                      className={cabin === activeCabin ? "is-active" : ""}
                      onClick={() =>
                        onFareChange(
                          fares.find((fare) => fare.cabin === cabin && fare.selectable)?.fareId ||
                            fares.find((fare) => fare.cabin === cabin)?.fareId,
                        )
                      }
                    >
                      <span>{cabinLabel(cabin)}</span>
                      <small>
                        {money(
                          fares.find((fare) => fare.cabin === cabin)?.pricing?.perTravellerTotal,
                          fares.find((fare) => fare.cabin === cabin)?.pricing?.currency,
                        )}{" "}
                        {labelFor(labels, "perTraveller")}
                      </small>
                    </button>
                  ))}
                </div>
              ) : null}
              <div className="trehub-flight-journey__fares">
                {visibleFares.map((fare) => {
                  const active = fare.fareId === fareId;
                  return (
                    <button
                      key={fare.fareId}
                      type="button"
                      className={`trehub-flight-journey__fare${active ? " is-selected" : ""}`}
                      onClick={() => fare.selectable && onFareChange(fare.fareId)}
                      disabled={!fare.selectable}
                      aria-pressed={active}
                    >
                      <span className="trehub-flight-journey__fare-brand">{fare.brand}</span>
                      <div className="trehub-flight-journey__fare-price">
                        <strong>
                          {money(fare.pricing?.perTravellerTotal, fare.pricing?.currency)}
                        </strong>
                        <small>{labelFor(labels, "perTraveller")}</small>
                        <span>
                          {template(labelFor(labels, "totalForTravellers"), {
                            count: fare.pricing?.travellerCount || passengers.length,
                          })}{" "}
                          <b>{money(fare.pricing?.total, fare.pricing?.currency)}</b>
                        </span>
                      </div>
                      <ul>
                        <li>
                          {fare.refundable
                            ? labelFor(labels, "refundable")
                            : labelFor(labels, "nonRefundable")}
                        </li>
                        <li>
                          {fare.changeable
                            ? labelFor(labels, "changeable")
                            : labelFor(labels, "changesRestricted")}
                        </li>
                        <li>
                          {fare.mealIncluded
                            ? labelFor(labels, "mealIncluded")
                            : labelFor(labels, "mealsSeparate")}
                        </li>
                        <li>
                          {template(labelFor(labels, "checkedBaggageTemplate"), {
                            weight: fare.baggage?.checked?.weightKg || 0,
                          })}
                        </li>
                      </ul>
                      <StatusBadge
                        value={
                          active ? labelFor(labels, "selectedFare") : fare.availability?.status
                        }
                        tone={active ? "success" : undefined}
                        appearance="accent"
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {offer && travellerWidget && step === travellerWidget.props?.showAtStep ? (
            <div className="trehub-flight-journey__panel">
              <div className="trehub-flight-journey__panel-heading">
                <div>
                  <span>{travellerWidget.props.stepNumber}</span>
                  <h2>{labelFor(labels, travellerWidget.props.titleRef)}</h2>
                </div>
              </div>
              <div className="trehub-flight-journey__passengers">
                {passengers.map((passenger, index) => (
                  <fieldset key={`${passenger.type}-${index}`}>
                    <legend>
                      {labelFor(labels, passenger.type.toLowerCase(), passenger.type)} {index + 1}
                    </legend>
                    <div className="trehub-flight-journey__form-grid">
                      <SingleSelect
                        label={labelFor(labels, "title")}
                        value={passenger.title}
                        options={options.passengerTitles || []}
                        onChange={(value) => onPassengerChange(index, "title", value)}
                        required
                      />
                      <InputField
                        label={labelFor(labels, "firstName")}
                        value={passenger.firstName}
                        onChange={(value) => onPassengerChange(index, "firstName", value)}
                        required
                      />
                      <InputField
                        label={labelFor(labels, "lastName")}
                        value={passenger.lastName}
                        onChange={(value) => onPassengerChange(index, "lastName", value)}
                        required
                      />
                      <SingleSelect
                        label={labelFor(labels, "gender")}
                        value={passenger.gender}
                        options={options.passengerGenders || []}
                        onChange={(value) => onPassengerChange(index, "gender", value)}
                        required
                      />
                      <InputField
                        variant="date"
                        label={labelFor(labels, "dateOfBirth")}
                        value={passenger.dateOfBirth}
                        onChange={(value) => onPassengerChange(index, "dateOfBirth", value)}
                        required
                      />
                      <InputField
                        label={labelFor(labels, "nationality")}
                        value={passenger.nationality}
                        maxLength={2}
                        onChange={(value) =>
                          onPassengerChange(index, "nationality", value.toUpperCase())
                        }
                        required
                      />
                    </div>
                    {passportRequired ? (
                      <div className="trehub-flight-journey__passport">
                        <h3>{labelFor(labels, "passportDetails")}</h3>
                        <div className="trehub-flight-journey__form-grid">
                          <InputField
                            label={labelFor(labels, "passportNumber")}
                            value={passenger.passport?.number}
                            onChange={(value) =>
                              onPassengerChange(index, "passport.number", value.toUpperCase())
                            }
                            required
                          />
                          <InputField
                            variant="date"
                            label={labelFor(labels, "passportExpiry")}
                            value={passenger.passport?.expiryDate}
                            onChange={(value) =>
                              onPassengerChange(index, "passport.expiryDate", value)
                            }
                            required
                          />
                          <InputField
                            label={labelFor(labels, "passportIssuingCountry")}
                            value={passenger.passport?.issuingCountry}
                            maxLength={2}
                            onChange={(value) =>
                              onPassengerChange(
                                index,
                                "passport.issuingCountry",
                                value.toUpperCase(),
                              )
                            }
                            required
                          />
                        </div>
                      </div>
                    ) : null}
                  </fieldset>
                ))}
              </div>
            </div>
          ) : null}

          {offer && seatWidget && step === seatWidget.props?.showAtStep ? (
            <div className="trehub-flight-journey__panel">
              <div className="trehub-flight-journey__panel-heading">
                <div>
                  <span>{seatWidget.props.stepNumber}</span>
                  <h2>{labelFor(labels, seatWidget.props.titleRef)}</h2>
                </div>
                <p>{labelFor(labels, seatWidget.props.descriptionRef)}</p>
              </div>
              <div className="trehub-flight-journey__seat-legend">
                <span className="is-available">{labelFor(labels, "available")}</span>
                <span className="is-selected">{labelFor(labels, "selected")}</span>
                <span className="is-unavailable">{labelFor(labels, "occupied")}</span>
              </div>
              {(seatMap?.segments || []).map((segment) => (
                <section className="trehub-flight-journey__seat-section" key={segment.segmentId}>
                  <h3>
                    {segment.origin} → {segment.destination}
                  </h3>
                  <div
                    className="trehub-flight-journey__seat-map"
                    style={{ "--seat-columns": segment.layout?.columns?.length || 6 }}
                  >
                    {segment.seats.map((seat) => {
                      const selected = seats.some(
                        (item) =>
                          item.segmentId === segment.segmentId &&
                          item.seatNumber === seat.seatNumber,
                      );
                      const disabled = seat.status !== "AVAILABLE";
                      return (
                        <button
                          key={seat.seatNumber}
                          type="button"
                          className={selected ? "is-selected" : ""}
                          disabled={disabled}
                          title={`${seat.type} · ${money(seat.price?.total, seat.price?.currency)}`}
                          onClick={() =>
                            onSeatToggle({
                              segmentId: segment.segmentId,
                              seatNumber: seat.seatNumber,
                            })
                          }
                        >
                          {seat.seatNumber}
                        </button>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          ) : null}

          {offer && reviewWidget && step === reviewWidget.props?.showAtStep ? (
            <div className="trehub-flight-journey__panel">
              <div className="trehub-flight-journey__panel-heading">
                <div>
                  <span>{reviewWidget.props.stepNumber}</span>
                  <h2>{labelFor(labels, reviewWidget.props.titleRef)}</h2>
                </div>
                <p>{labelFor(labels, reviewWidget.props.descriptionRef)}</p>
              </div>
              <dl className="trehub-flight-journey__price">
                <div>
                  <dt>{labelFor(labels, "baseFare")}</dt>
                  <dd>{money(price.baseFare, price.currency)}</dd>
                </div>
                <div>
                  <dt>{labelFor(labels, "taxes")}</dt>
                  <dd>{money(price.taxes, price.currency)}</dd>
                </div>
                <div>
                  <dt>{labelFor(labels, "providerFees")}</dt>
                  <dd>{money(price.providerFees, price.currency)}</dd>
                </div>
                <div>
                  <dt>{labelFor(labels, "convenienceFee")}</dt>
                  <dd>{money(price.convenienceFee, price.currency)}</dd>
                </div>
                {price.seatFees ? (
                  <div>
                    <dt>{labelFor(labels, "seatFees")}</dt>
                    <dd>{money(price.seatFees, price.currency)}</dd>
                  </div>
                ) : null}
                <div className="is-total">
                  <dt>{labelFor(labels, "total")}</dt>
                  <dd>{money(price.total, price.currency)}</dd>
                </div>
              </dl>
              {revalidation?.status ? (
                <div className="trehub-flight-journey__revalidation">
                  <StatusBadge value={revalidation.status} appearance="accent" />
                  {revalidation.status === "PRICE_CHANGED" ? (
                    <p>{labelFor(labels, "priceChanged")}</p>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}

          {confirmationWidget && step === confirmationWidget.props?.showAtStep && booking ? (
            <div className="trehub-flight-journey__confirmation">
              <div className="trehub-flight-journey__confirmation-icon">✓</div>
              <StatusBadge value={booking.status} appearance="accent" />
              <h2>{booking.bookingId}</h2>
              <p>
                {labelFor(labels, "pnr")} <strong>{booking.pnr}</strong>
              </p>
              <div>
                <span>
                  {labelFor(labels, "payment")}{" "}
                  <StatusBadge value={booking.paymentStatus} size="sm" />
                </span>
                <span>
                  {labelFor(labels, "ticketing")}{" "}
                  <StatusBadge value={booking.ticketingStatus} size="sm" />
                </span>
              </div>
              <Button
                href={contract.urls.myBookings}
                text={labelFor(labels, "viewBookings")}
                iconRight="arrowUpRight"
              />
            </div>
          ) : null}

          {offer && step < 4 ? (
            <FloatingActionBar
              align="left-right"
              error={error}
              actions={[
                ...(step === 0
                  ? [
                      {
                        label: labelFor(labels, "backToFlights"),
                        variant: "outline",
                        align: "left",
                        iconLeft: "chevronLeft",
                        onClick: onBackToSearch,
                        disabled: saving,
                      },
                    ]
                  : []),
                ...(step > 0
                  ? [
                      {
                        label: labelFor(labels, "back"),
                        variant: "outline",
                        align: "left",
                        iconLeft: "chevronLeft",
                        onClick: onBack,
                        disabled: saving,
                      },
                    ]
                  : []),
                ...(step < 3
                  ? [
                      {
                        label:
                          step === 2 && !seats.length
                            ? labelFor(labels, "skipSeats")
                            : labelFor(labels, "continue"),
                        variant: "primary",
                        align: "right",
                        iconRight: "chevronRight",
                        onClick: onContinue,
                        disabled:
                          saving || (step === 0 && !fareId) || (step === 1 && !passengersComplete),
                      },
                    ]
                  : []),
                ...(step === 3 && !revalidation
                  ? [
                      {
                        label: labelFor(labels, "revalidate"),
                        variant: "primary",
                        align: "right",
                        onClick: onRevalidate,
                        disabled: saving,
                      },
                    ]
                  : []),
                ...(step === 3 && revalidation?.status === "CONFIRMED"
                  ? [
                      {
                        label: labelFor(labels, "bookNow"),
                        variant: "primary",
                        align: "right",
                        onClick: onBook,
                        disabled: saving,
                      },
                    ]
                  : []),
                ...(step === 3 && revalidation?.status === "PRICE_CHANGED"
                  ? [
                      {
                        label: labelFor(labels, "acceptPrice"),
                        variant: "primary",
                        align: "right",
                        onClick: onBook,
                        disabled: saving,
                      },
                    ]
                  : []),
              ]}
            />
          ) : null}
        </section>
      </div>
      <ConfirmOverlay
        open={enquiryModalOpen}
        title={labelFor(labels, "createEnquiryTitle")}
        note={labelFor(labels, "createEnquiryDescription")}
        icon="plane"
        cancelLabel={labelFor(labels, "cancel")}
        confirmLabel={labelFor(labels, "createEnquiryConfirm")}
        confirmDisabled={saving}
        onClose={onCloseEnquiryModal}
        onConfirm={onCreateEnquiry}
      />
    </main>
  );
}
