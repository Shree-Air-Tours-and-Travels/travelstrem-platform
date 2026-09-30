import React, { useState } from "react";

import { Title, Icon, HotelCard, FormInput, FormSelect, FormTextArea } from "../../../../index.js";

import { OptionsModal } from "@packages/trem-modals";

import { getDisplayText } from "../../helper";

import "./IncludedStays.styles.scss";

const PRICING_LABELS = {
  PER_PERSON: "perPerson",

  PER_BOOKING: "perBooking",

  PER_ROOM: "perRoom",

  PER_NIGHT: "perNight",

  PER_ROOM_PER_NIGHT: "perRoomNight",

  PER_PERSON_PER_NIGHT: "perPersonNight",
};

const asArray = (value) => (Array.isArray(value) ? value.filter(Boolean) : []);

const firstNonEmptyArray = (...values) =>
  values.find((value) => Array.isArray(value) && value.filter(Boolean).length) || [];

const toPhotoSrc = (photo) => {
  if (!photo) return "";
  if (typeof photo === "string") return photo;
  return photo.url || photo.src || photo.image || photo.value || "";
};

const toAmenity = (amenity) => {
  if (!amenity) return null;
  if (typeof amenity === "string") return amenity;

  const value = getDisplayText(amenity.value || amenity.name || amenity.label || amenity.title);

  if (!value) return null;

  return {
    ...amenity,
    value,
  };
};

const getOptionKey = (option) =>
  String(option?.value || option?.hotelOptionKey || option?._id || option?.id || "");

const getRoomKey = (room) =>
  String(room?.value || room?.roomOptionKey || room?._id || room?.id || room?.name || "");

const getStayKey = (stay, index = 0) =>
  String(stay?.stayKey || stay?._id || stay?.id || `stay-${index}`);

export default function IncludedStaysView({
  labels = {},

  stays = [],

  hotelOptions = [],

  selectedPackageName = "",
  packages = [],
  activePackageKey = "",
  onSelectPackage,

  hotelSelections = {},

  onSelectHotel,

  onCustomize,

  onRequestHotel,
}) {
  const [modalOpen, setModalOpen] = useState(false);

  const [inspection, setInspection] = useState({ stayKey: "", hotel: "", room: "", location: "" });

  const [expanded, setExpanded] = useState(false);

  const [requestOpen, setRequestOpen] = useState(false);

  const [requestError, setRequestError] = useState("");

  const [hotelRequest, setHotelRequest] = useState({
    stayKey: "",

    propertyClass: "",

    roomType: "",

    budgetPerNight: "",

    requirements: "",
  });

  const title = labels.title || "Hotels & stays";
  const nightsLabel = labels.nightsLabel || "nights";
  const safeStays = asArray(stays);
  const safeHotelOptions = asArray(hotelOptions);
  const hasOptions = safeHotelOptions.length > 0;
  const selectable = typeof onSelectHotel === "function";
  const canRequestHotel = typeof onRequestHotel === "function";
  const canBrowse = safeStays.length > 3;

  const requestedStay =
    safeStays.find(
      (stay, index) => getStayKey(stay, index) === String(hotelRequest.stayKey || ""),
    ) ||
    safeStays[0] ||
    null;

  const formatPrice = (pricing) => {
    if (!pricing) return "";

    const amountMinor = Number(pricing.amountMinor);
    if (!Number.isFinite(amountMinor)) {
      return getDisplayText(pricing.displayValue || pricing.value || pricing.label);
    }

    if (amountMinor === 0) {
      return labels.includedPrice || "Included";
    }

    const amount = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: pricing.currency || "INR",
      maximumFractionDigits: 0,
    }).format(amountMinor / 100);

    const unitRef = PRICING_LABELS[pricing.unit];
    return `${amount}${unitRef && labels[unitRef] ? ` ${labels[unitRef]}` : ""}`;
  };

  const openOptions = (stay = null) => {
    const target = stay || safeStays[0] || null;
    const targetIndex = target ? safeStays.indexOf(target) : 0;
    const stayKey = target ? getStayKey(target, targetIndex) : "";

    setInspection({
      stayKey,
      hotel: String(target?.hotelOptionKey || ""),
      room: String(target?.roomOptionKey || ""),
      location: getDisplayText(target?.location),
    });

    setModalOpen(true);
  };

  const activeSelection = hotelSelections?.[inspection.stayKey] || null;

  const scopedOptions = safeHotelOptions.filter((option) => {
    if (inspection.stayKey) {
      return String(option?.stayKey || "") === inspection.stayKey;
    }

    return (
      String(option?.location || "").toLowerCase() ===
      String(inspection.location || "").toLowerCase()
    );
  });

  const updateRequest = (key, value) => {
    setHotelRequest((current) => ({ ...current, [key]: value }));

    setRequestError("");
  };

  const submitHotelRequest = (event) => {
    event.preventDefault();

    const stay = requestedStay;

    if (!stay)
      return setRequestError(
        labels.requestStayError || "Choose the destination stay you want to change.",
      );

    if (
      ![hotelRequest.propertyClass, hotelRequest.roomType, hotelRequest.requirements].some(
        (value) => String(value || "").trim(),
      )
    ) {
      return setRequestError(
        labels.requestDetailsError ||
          "Add a hotel category, room type, or a short note for the agent.",
      );
    }

    onRequestHotel?.({
      stayKey: getStayKey(stay, safeStays.indexOf(stay)),

      location: getDisplayText(stay?.location),

      nights: Number(stay.nights || 0),

      propertyClass: String(hotelRequest.propertyClass || "").trim(),

      roomType: String(hotelRequest.roomType || "").trim(),

      budgetPerNight: String(hotelRequest.budgetPerNight || "").trim(),

      requirements: String(hotelRequest.requirements || "").trim(),
    });
  };

  return (
    <section className="td-ist" aria-label={title}>
      <header className="td-ist__header">
        <span className="td-ist__icon">
          <Icon name="hotel" size={19} />
        </span>

        <div className="td-ist__heading-copy">
          <Title text={title} primaryClassname="td-ist__title" />

          <p>{labels.subtitle || "Your package accommodation, organised by destination."}</p>
        </div>

        <div className="td-ist__header-meta">
          {selectedPackageName ? (
            <span className="td-ist__package">
              {labels.forPackage || "Included with"} {selectedPackageName}
            </span>
          ) : null}

          <span className="td-ist__count">
            {safeStays.length}{" "}
            {safeStays.length === 1 ? labels.stay || "stay" : labels.stays || "stays"}
          </span>
        </div>
      </header>

      {packages.length > 1 && (
        <nav className="td-ist__package-tabs" aria-label={labels.packageTabs || "Hotels by package"}>
          {packages.map((item) => (
            <button
              key={item.packageKey}
              type="button"
              aria-pressed={item.packageKey === activePackageKey}
              onClick={() => onSelectPackage?.(item.packageKey)}
            >
              {item.name}
            </button>
          ))}
        </nav>
      )}
      {!safeStays.length && <p>{labels.packageEmpty || "No hotels are linked to this package."}</p>}

      <div className="td-ist__list">
        {(expanded ? safeStays : safeStays.slice(0, 3)).map((stay, index) => {
          const stayKey = getStayKey(stay, index);
          const staySelection = hotelSelections?.[stayKey] || null;

          const selectedOption = staySelection
            ? safeHotelOptions.find(
                (option) =>
                  String(option?.stayKey || "") === stayKey &&
                  getOptionKey(option) === String(staySelection.hotelOptionKey || ""),
              )
            : null;

          const rooms = asArray(selectedOption?.rooms);
          const selectedRoomOption = staySelection
            ? rooms.find((room) => getRoomKey(room) === String(staySelection.roomOptionKey || ""))
            : null;

          const propertyName = getDisplayText(
            selectedRoomOption?.propertyName ||
              selectedOption?.propertyName ||
              stay?.propertyName ||
              stay?.hotelName ||
              stay?.title,
            labels.hotelOnRequest || "Hotel confirmed with your quote",
          );

          const propertyClass = getDisplayText(
            selectedRoomOption?.propertyClass ||
              selectedOption?.propertyClass ||
              stay?.propertyClass,
          );

          const roomType = getDisplayText(
            selectedRoomOption?.name || selectedRoomOption?.roomType || stay?.roomType,
          );

          const location = getDisplayText(
            selectedOption?.location || stay?.location,
            labels.locationOnRequest || "Location on request",
          );

          const pricing =
            selectedRoomOption?.pricing || selectedOption?.pricing || stay?.pricing || null;

          const price = formatPrice(pricing);

          const displayPhotos = firstNonEmptyArray(
            selectedRoomOption?.photos,
            selectedOption?.photos,
            stay?.photos,
          );
          const image = toPhotoSrc(displayPhotos[0]);

          const displayAmenities = firstNonEmptyArray(
            selectedRoomOption?.amenities,
            selectedOption?.amenities,
            stay?.amenities,
          )
            .map(toAmenity)
            .filter(Boolean);

          const displayMeals = firstNonEmptyArray(
            selectedRoomOption?.meals,
            selectedOption?.meals,
            stay?.meals,
          )
            .map((meal) =>
              getDisplayText(
                typeof meal === "object" ? meal.value || meal.name || meal.label : meal,
              ),
            )
            .filter(Boolean);

          const description = getDisplayText(
            selectedRoomOption?.description || selectedOption?.description || stay?.description,
          );

          const nights = Number(stay?.nights);
          const staySummary =
            Number.isFinite(nights) && nights > 0
              ? `${nights} ${nights === 1 ? labels.night || "night" : nightsLabel}`
              : "";

          const statusLabel = staySelection
            ? labels.customizedStay || "Your selected stay"
            : labels.included || "Included in your package";

          return (
            <HotelCard
              key={stayKey}
              variant="included"
              hideAction={!hasOptions}
              onView={() => openOptions(stay)}
              labels={{
                ...labels,
                hotelPrice: labels.hotelPrice || "Hotel / room price",
                stay: labels.stay || "Stay",
                room: labels.room || "Room",
                meals: labels.meals || "Meals",
                viewRooms: labels.viewRooms || "View rooms and package options",
                stayStatus: statusLabel,
                priceIncludesFees: "",
              }}
              hotel={{
                title: propertyName,
                image,
                imageAlt: propertyName,
                imageCountLabel:
                  displayPhotos.length > 1
                    ? `${displayPhotos.length} ${labels.photos || "photos"}`
                    : "",
                location: { value: location },
                badge: propertyClass ? { value: propertyClass } : undefined,
                description,
                amenities: displayAmenities,
                facts: [
                  ...(price ? [{ id: "price", labelRef: "hotelPrice", value: price }] : []),
                  ...(staySummary ? [{ id: "stay", labelRef: "stay", value: staySummary }] : []),
                  ...(roomType
                    ? [
                        {
                          id: "room",
                          icon: "hotel",
                          labelRef: "room",
                          value: roomType,
                        },
                      ]
                    : []),
                  ...(displayMeals.length
                    ? [
                        {
                          id: "meals",
                          icon: "food",
                          labelRef: "meals",
                          value: displayMeals.join(", "),
                        },
                      ]
                    : []),
                ],
                price: {
                  labelRef: "stayStatus",
                  value: price || labels.includedPrice || "Included",
                },
                staySummary,
                actionLabelRef: "viewRooms",
              }}
            />
          );
        })}
      </div>

      {canBrowse ? (
        <div className="td-ist__browser">
          <button
            type="button"

            className="td-ist__view-all"

            aria-expanded={expanded}

            onClick={() => setExpanded((value) => !value)}
          >
            {expanded
              ? labels.showLess || "Show less"
              : labels.showAll || labels.viewAll || `Show all ${safeStays.length} stays`}

            <Icon name={expanded ? "chevronDown" : "plus"} size={15} />
          </button>
        </div>
      ) : null}

      {hasOptions ? (
        <>
          {canRequestHotel ? (
            <>
              <div className="td-ist__actions">
                <div>
                  <strong>{labels.requestTitle || "Need a hotel that is not listed?"}</strong>

                  <span>
                    {labels.requestDescription ||
                      "Tell the agent what you need for a specific destination and receive suitable choices in your quote."}
                  </span>
                </div>

                <button
                  type="button"

                  className="td-ist__link"

                  aria-expanded={requestOpen}

                  onClick={() => {
                    setHotelRequest((current) => ({
                      ...current,

                      stayKey: current.stayKey || (safeStays[0] ? getStayKey(safeStays[0], 0) : ""),
                    }));

                    setRequestOpen((value) => !value);
                  }}
                >
                  {requestOpen
                    ? labels.closeRequest || "Close request"
                    : labels.requestHotel || "Start hotel customization request"}

                  <Icon name={requestOpen ? "chevronDown" : "chevronRight"} size={16} />
                </button>
              </div>

              {requestOpen ? (
                <form className="td-ist__request" onSubmit={submitHotelRequest}>
                  <header>
                    <div>
                      <strong>{labels.requestFormTitle || "Hotel request"}</strong>

                      <span>
                        {labels.requestFormDescription ||
                          "Your agent will check availability and price these preferences in the quote."}
                      </span>
                    </div>

                    <span className="td-ist__request-status">
                      {labels.agentPriced || "Priced by agent"}
                    </span>
                  </header>

                  <div className="td-ist__request-grid">
                    <label>
                      <span>{labels.requestDestination || "Destination stay"}</span>

                      <FormSelect
                        value={
                          requestedStay
                            ? getStayKey(requestedStay, safeStays.indexOf(requestedStay))
                            : ""
                        }

                        options={safeStays.map((stay, index) => {
                          const nights = Number(stay?.nights);
                          const location = getDisplayText(
                            stay?.location,
                            labels.locationOnRequest || "Location on request",
                          );

                          return {
                            value: getStayKey(stay, index),
                            label: [
                              location,
                              Number.isFinite(nights) && nights > 0
                                ? `${nights} ${
                                    nights === 1 ? labels.night || "night" : nightsLabel
                                  }`
                                : "",
                            ]
                              .filter(Boolean)
                              .join(" · "),
                          };
                        })}

                        onChange={(event) => updateRequest("stayKey", event.target.value)}
                      />
                    </label>

                    <label>
                      <span>{labels.requestCategory || "Hotel category"}</span>

                      <FormSelect
                        value={hotelRequest.propertyClass}

                        options={[
                          { value: "", label: labels.anyCategory || "Any suitable category" },

                          { value: "3-star", label: "3-star" },

                          { value: "4-star", label: "4-star" },

                          { value: "5-star", label: "5-star" },

                          { value: "boutique", label: labels.boutique || "Boutique" },

                          { value: "luxury", label: labels.luxury || "Luxury" },
                        ]}

                        onChange={(event) => updateRequest("propertyClass", event.target.value)}
                      />
                    </label>

                    <label>
                      <span>{labels.requestRoom || "Preferred room"}</span>

                      <FormInput
                        value={hotelRequest.roomType}

                        placeholder={labels.requestRoomPlaceholder || "For example, deluxe room"}

                        onChange={(event) => updateRequest("roomType", event.target.value)}
                      />
                    </label>

                    <label>
                      <span>{labels.requestBudget || "Budget per room / night"}</span>

                      <FormInput
                        type="number"

                        min="0"

                        value={hotelRequest.budgetPerNight}

                        placeholder={labels.requestBudgetPlaceholder || "Optional budget"}

                        onChange={(event) => updateRequest("budgetPerNight", event.target.value)}
                      />
                    </label>

                    <label className="td-ist__request-notes">
                      <span>{labels.requestRequirements || "Hotel requirements"}</span>

                      <FormTextArea
                        rows={3}

                        maxLength={600}

                        value={hotelRequest.requirements}

                        placeholder={
                          labels.requestRequirementsPlaceholder ||
                          "Area, amenities, accessibility, bedding, or another preference"
                        }

                        onChange={(event) => updateRequest("requirements", event.target.value)}
                      />
                    </label>
                  </div>

                  {requestError ? (
                    <p className="td-ist__request-error" role="alert">
                      {requestError}
                    </p>
                  ) : null}

                  <footer>
                    <span>
                      {labels.requestPricingNote ||
                        "No price is accepted from this form. Your agent will price confirmed options."}
                    </span>

                    <button type="submit" className="td-ist__request-submit">
                      {labels.continueRequest || "Continue to enquiry"}

                      <Icon name="chevronRight" size={16} />
                    </button>
                  </footer>
                </form>
              ) : null}
            </>
          ) : null}

          <OptionsModal
            open={modalOpen}

            onClose={() => setModalOpen(false)}

            title={[labels.optionsTitle || "Hotel options", inspection.location]

              .filter(Boolean)

              .join(" · ")}

            subtitle={labels.optionsSubtitle}

            icon="hotel"

            emptyTitle={labels.optionsEmptyTitle}

            emptyDescription={labels.optionsEmptyDescription}

            recommendedLabel={labels.recommended || "Recommended"}

            pricePendingLabel={labels.pricePending || "Price on request"}

            includedInLabel={labels.includedIn || "Included in"}

            includedForSelectedLabel={labels.includedForSelected || "Included in selected package"}

            includedPriceLabel={labels.includedPrice || "Included"}

            availableRoomsLabel={labels.availableRooms || "Available rooms"}

            options={scopedOptions}

            selectedValue={activeSelection?.hotelOptionKey || inspection.hotel}

            selectedRoomValue={activeSelection?.roomOptionKey || inspection.room}

            selectedLabel={labels.selected || "Selected"}

            confirmLabel={labels.applyHotel || "Apply hotel"}

            cancelLabel={labels.cancel || "Cancel"}

            closeLabel={labels.close || "Close"}

            customizeLabel={labels.customize || "Customise this tour"}

            onCustomize={
              typeof onCustomize === "function"
                ? (option, room) => {
                    onCustomize(inspection.stayKey, option, room);

                    setModalOpen(false);
                  }
                : undefined
            }

            onConfirm={
              selectable
                ? (option, room) => {
                    onSelectHotel(
                      inspection.stayKey,

                      getOptionKey(option) || option?.title || "",

                      getRoomKey(room),

                      option,

                      room,
                    );

                    setModalOpen(false);
                  }
                : undefined
            }
          />
        </>
      ) : null}
    </section>
  );
}
