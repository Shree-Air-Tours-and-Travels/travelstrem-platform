import React, { useState } from "react";
import { Icon, BookingSummaryCard, GlobalLoader, FloatingActionBar, Breadcrumbs } from "@packages/trem-ui";
import { ConfirmOverlay } from "@packages/trem-modals";
import BookingTripStep from "../widgets/BookingTripStep/BookingTripStep";
import BookingTravelerStep from "../widgets/BookingTravelerStep/BookingTravelerStep";
import BookingReviewStep from "../widgets/BookingReviewStep/BookingReviewStep";
import "../Booking.scss";

export default function BookingPageView({
  loading,
  error,
  pageLabels,
  options,
  maxGuests,
  step,
  tour,
  startDate,
  endDate,
  guests,
  adults,
  children,
  infants,
  travelers,
  contactEmail,
  contactPhone,
  fieldErrors,
  pricePreview,
  submitting,
  breadcrumbItems,
  onStartDateChange,
  onEndDateChange,
  onGuestsChange,
  onContactEmailChange,
  onContactPhoneChange,
  onTravelerChange,
  onClearError,
  onNext,
  onBack,
  onSubmit,
  onGoBack,
}) {
  const [showConfirm, setShowConfirm] = useState(false);
  if (loading) {
    return <GlobalLoader visible text="Loading booking page..." />;
  }

  if (error) {
    return (
      <main className="booking-page">
        <div className="booking-page__shell">
          <section className="booking-page__empty">
            <h1>Booking could not load</h1>
            <p>{error}</p>
            <button className="booking-page__btn booking-page__btn--primary" type="button" onClick={onGoBack}>
              Back to tours
            </button>
          </section>
        </div>
      </main>
    );
  }

  if (!tour) {
    return (
      <main className="booking-page">
        <div className="booking-page__shell">
          <section className="booking-page__empty">
            <h1>Tour not found</h1>
            <p>The tour could not be loaded for booking. It may have been removed or is unavailable.</p>
            <button className="booking-page__btn booking-page__btn--primary" type="button" onClick={onGoBack}>
              Back to tours
            </button>
          </section>
        </div>
      </main>
    );
  }

  const stepLabels = {
    1: pageLabels.step1Title || "Trip Details",
    2: pageLabels.step2Title || "Traveler Info",
    3: pageLabels.step3Title || "Review & Submit",
  };

  return (
    <main className="booking-page" aria-label={pageLabels.pageTitle || "Book your tour"}>
      <div className="booking-page__shell">
        <Breadcrumbs items={breadcrumbItems} className="booking-page__breadcrumbs" />

        <div className="booking-page__header">
          <h1>{pageLabels.pageTitle || "Book Your Tour"}</h1>
          <div className="booking-page__steps" aria-label="Booking steps">
            {[1, 2, 3].map((s) => (
              <React.Fragment key={s}>
                <span className={`booking-page__step${step === s ? " is-active" : ""}${step > s ? " is-done" : ""}`}>{s}</span>
                {s < 3 && <span className={`booking-page__step-line${step > s ? " is-done" : ""}`} />}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="booking-page__body">
          <div className="booking-page__main">
            <div className="booking-page__card">
              <div className="booking-page__card-header">
                <h2>{stepLabels[step]}</h2>
                <span>{step === 1 ? "Dates & guests" : step === 2 ? `${travelers.length} traveler${travelers.length > 1 ? "s" : ""}` : "Confirm & pay"}</span>
              </div>
              <div className="booking-page__card-scroll">
                {step === 1 && (
                  <BookingTripStep
                    labels={pageLabels}
                    startDate={startDate}
                    endDate={endDate}
                    guests={guests}
                    adults={adults}
                    children={children}
                    infants={infants}
                    maxGuests={maxGuests}
                    fieldErrors={fieldErrors}
                    tour={tour}
                    onStartDateChange={onStartDateChange}
                    onEndDateChange={onEndDateChange}
                    onGuestsChange={onGuestsChange}
                    onClearError={onClearError}
                  />
                )}
                {step === 2 && (
                  <BookingTravelerStep
                    labels={pageLabels}
                    options={options}
                    travelers={travelers}
                    guests={guests}
                    maxGuests={maxGuests}
                    contactEmail={contactEmail}
                    contactPhone={contactPhone}
                    fieldErrors={fieldErrors}
                    onContactEmailChange={onContactEmailChange}
                    onContactPhoneChange={onContactPhoneChange}
                    onTravelerChange={onTravelerChange}
                    onGuestsChange={onGuestsChange}
                    onClearError={onClearError}
                  />
                )}
                {step === 3 && (
                  <BookingReviewStep
                    labels={pageLabels}
                    tour={tour}
                    startDate={startDate}
                    endDate={endDate}
                    guests={guests}
                    contactEmail={contactEmail}
                    contactPhone={contactPhone}
                    travelers={travelers}
                    pricePreview={pricePreview}
                    loading={submitting}
                    onSubmit={onSubmit}
                    onBack={onBack}
                  />
                )}
              </div>
            </div>
          </div>

          <aside className="booking-page__sidebar">
            <BookingSummaryCard
              tour={tour}
              startDate={startDate}
              endDate={endDate}
              guests={guests}
              priceSnapshot={pricePreview || tour?.price || tour?.priceInfo || {}}
            />
            <div className="booking-page__help-card">
              <strong>{pageLabels.needHelp || "Need help?"}</strong>
              <span>{(pageLabels.contactSupport || "Contact support at")} <a href="tel:+919057635580">{pageLabels.supportPhone || "+91 9057635580"}</a></span>
              <span>{pageLabels.cancellationNote || "Free cancellation within 24 hours of booking"}</span>
            </div>
          </aside>
        </div>
      </div>

      <FloatingActionBar
        variant="floating"
        align="left"
        showBg
        error={fieldErrors && Object.keys(fieldErrors).some(k => k !== '_general') ? "Please fix the highlighted fields." : undefined}
        actions={[
          ...(step > 1 ? [{ label: pageLabels.back || "Back", iconLeft: "chevronLeft", variant: "ghost", onClick: onBack }] : []),
          ...(step < 3
            ? [{ label: pageLabels.next || "Next Step", iconRight: "chevronRight", variant: "primary", onClick: onNext }]
            : [{ label: submitting ? (pageLabels.submitting || "Submitting...") : (pageLabels.submit || "Submit Quote Request"), variant: "primary", disabled: submitting, onClick: () => setShowConfirm(true) }]
          ),
        ]}
      />

      <ConfirmOverlay
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={() => { setShowConfirm(false); onSubmit(); }}
        title={pageLabels.submitConfirmTitle || "Confirm Your Booking"}
        note={pageLabels.submitConfirmNote || "Please review all traveler details carefully before proceeding."}
        icon="alertTriangle"
        confirmLabel={pageLabels.submitConfirmProceed || "Yes, Proceed"}
        cancelLabel={pageLabels.submitConfirmCancel || "Cancel"}
        confirmDisabled={submitting}
      />
      {submitting && <GlobalLoader visible text="Submitting your request..." />}
    </main>
  );
}
