import React, { useEffect, useRef, useState } from "react";
import { Title, Icon, FormInput, FormSelect, FormTextArea } from "../../../../index.js";
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

export default function IncludedStaysView({
  labels = {},
  stays = [],
  hotelOptions = [],
  selectedPackageName = "",
  hotelSelections = {},
  onSelectHotel,
  onCustomize,
  onRequestHotel,
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [inspection, setInspection] = useState({ stayKey: "", hotel: "", room: "", location: "" });
  const [expanded, setExpanded] = useState(false);
  const [carousel, setCarousel] = useState({ current: 1, total: 1 });
  const [requestOpen, setRequestOpen] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [hotelRequest, setHotelRequest] = useState({
    stayKey: "",
    propertyClass: "",
    roomType: "",
    budgetPerNight: "",
    requirements: "",
  });
  const listRef = useRef(null);
  const title = labels.title || "Included stays";
  const nightsLabel = labels.nightsLabel || "nights";
  const hasOptions = Array.isArray(hotelOptions) && hotelOptions.length > 0;
  const selectable = typeof onSelectHotel === "function";
  const canRequestHotel = typeof onRequestHotel === "function";
  const canBrowse = stays.length > 3;
  const requestedStay =
    stays.find((stay) => String(stay.stayKey || "") === String(hotelRequest.stayKey || "")) ||
    stays[0] ||
    null;
  const formatPrice = (pricing) => {
    if (!pricing || !Number.isFinite(Number(pricing.amountMinor))) return "";
    const amount = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: pricing.currency || "INR",
      maximumFractionDigits: 0,
    }).format(Number(pricing.amountMinor) / 100);
    const unitRef = PRICING_LABELS[pricing.unit];
    return `${amount}${unitRef && labels[unitRef] ? ` ${labels[unitRef]}` : ""}`;
  };

  useEffect(() => {
    const node = listRef.current;
    if (!node || expanded || !canBrowse) {
      setCarousel({ current: 1, total: 1 });
      return undefined;
    }
    const update = () => {
      const pageWidth = Math.max(1, node.clientWidth);
      const total = Math.max(1, Math.ceil(node.scrollWidth / pageWidth));
      const maxScroll = Math.max(0, node.scrollWidth - pageWidth);
      const current =
        maxScroll > 0 ? Math.round((node.scrollLeft / maxScroll) * (total - 1)) + 1 : 1;
      setCarousel({ current, total });
    };
    update();
    node.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      node.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [canBrowse, expanded, stays.length]);

  const slide = (direction) => {
    const node = listRef.current;
    if (!node) return;
    node.scrollBy({ left: direction * node.clientWidth, behavior: "smooth" });
  };

  const openOptions = (stay = null) => {
    const target = stay || stays[0] || null;
    const stayKey = String(target?.stayKey || "");
    setInspection({
      stayKey,
      hotel: String(target?.hotelOptionKey || ""),
      room: String(target?.roomOptionKey || ""),
      location: String(target?.location || ""),
    });
    setModalOpen(true);
  };
  const activeSelection = hotelSelections?.[inspection.stayKey] || null;
  const scopedOptions = hotelOptions.filter((option) =>
    inspection.stayKey
      ? String(option.stayKey || "") === inspection.stayKey
      : String(option.location || "").toLowerCase() === inspection.location.toLowerCase(),
  );

  const updateRequest = (key, value) => {
    setHotelRequest((current) => ({ ...current, [key]: value }));
    setRequestError("");
  };
  const submitHotelRequest = (event) => {
    event.preventDefault();
    const stay = requestedStay;
    if (!stay?.stayKey)
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
      stayKey: String(stay.stayKey),
      location: String(stay.location || ""),
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
            {stays.length} {stays.length === 1 ? labels.stay || "stay" : labels.stays || "stays"}
          </span>
        </div>
      </header>

      <div
        ref={listRef}
        className={`td-ist__list${canBrowse ? " is-carousel" : ""}${expanded ? " is-expanded" : ""}`}
      >
        {stays.map((stay, index) => {
          const staySelection = hotelSelections?.[stay.stayKey];
          const selectedOption = staySelection
            ? hotelOptions.find(
                (option) =>
                  String(option.stayKey || "") === String(stay.stayKey || "") &&
                  String(option.value || "") === String(staySelection.hotelOptionKey || ""),
              )
            : null;
          const selectedRoomOption = selectedOption?.rooms?.find(
            (room) => String(room.value || "") === String(staySelection?.roomOptionKey || ""),
          );
          const propertyName = getDisplayText(
            selectedOption?.propertyName || stay.propertyName,
            labels.hotelOnRequest || "Hotel confirmed with your quote",
          );
          const propertyClass = getDisplayText(selectedOption?.propertyClass || stay.propertyClass);
          const roomType = getDisplayText(selectedRoomOption?.name || stay.roomType);
          const location = getDisplayText(
            stay.location,
            labels.locationOnRequest || "Location on request",
          );
          const price = formatPrice(selectedRoomOption?.pricing || stay.pricing);
          const displayPhotos = selectedRoomOption?.photos?.length
            ? selectedRoomOption.photos
            : selectedOption?.photos?.length
              ? selectedOption.photos
              : stay.photos;
          const displayAmenities = selectedRoomOption?.amenities?.length
            ? selectedRoomOption.amenities
            : selectedOption?.amenities?.length
              ? selectedOption.amenities
              : stay.amenities;
          return (
            <article
              key={stay._id || `${location}-${index}`}
              className={`td-ist__stay${hasOptions ? " is-interactive" : ""}`}
              role={hasOptions ? "button" : undefined}
              tabIndex={hasOptions ? 0 : undefined}
              onClick={hasOptions ? () => openOptions(stay) : undefined}
              onKeyDown={
                hasOptions
                  ? (event) => {
                      if (["Enter", " "].includes(event.key)) {
                        event.preventDefault();
                        openOptions(stay);
                      }
                    }
                  : undefined
              }
            >
              <div className="td-ist__visual">
                {displayPhotos?.[0] ? (
                  <img className="td-ist__stay-photo" src={displayPhotos[0]} alt={propertyName} />
                ) : (
                  <div className="td-ist__placeholder" aria-hidden="true">
                    <Icon name="hotel" size={36} />
                  </div>
                )}
                <span className="td-ist__night-pill">
                  <Icon name="moon" size={14} />
                  {stay.nights} {nightsLabel}
                </span>
                {propertyClass ? <span className="td-ist__class-pill">{propertyClass}</span> : null}
              </div>
              <div className="td-ist__stay-body">
                <span className="td-ist__location">
                  <Icon name="mapPin" size={14} />
                  {location}
                </span>
                <h3>{propertyName}</h3>
                {stay.description ? (
                  <p className="td-ist__description">{getDisplayText(stay.description)}</p>
                ) : null}
                <div className="td-ist__details">
                  {roomType ? (
                    <span>
                      <Icon name="hotel" size={15} />
                      <small>{labels.room || "Room"}</small>
                      <strong>{roomType}</strong>
                    </span>
                  ) : null}
                  {stay.meals?.length ? (
                    <span>
                      <Icon name="food" size={15} />
                      <small>{labels.meals || "Meals"}</small>
                      <strong>
                        {stay.meals
                          .map((meal) => getDisplayText(meal))
                          .filter(Boolean)
                          .join(", ")}
                      </strong>
                    </span>
                  ) : null}
                </div>
                {displayAmenities?.length ? (
                  <div className="td-ist__amenities">
                    {displayAmenities.slice(0, 6).map((item) => (
                      <span key={item}>{item}</span>
                    ))}
                  </div>
                ) : null}
                <footer className="td-ist__stay-footer">
                  <span>
                    <Icon name="check" size={15} />
                    {staySelection
                      ? labels.customizedStay || "Your selected stay"
                      : labels.included || "Included in your package"}
                  </span>
                  {price ? <strong>{price}</strong> : null}
                </footer>
                {hasOptions ? (
                  <span className="td-ist__inspect">
                    {labels.viewRooms || "View rooms and package options"}
                    <Icon name="chevronRight" size={14} />
                  </span>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>

      {canBrowse ? (
        <div className="td-ist__browser">
          {!expanded ? (
            <div
              className="td-ist__carousel-controls"
              aria-label={labels.navigation || "Stay navigation"}
            >
              <button
                type="button"
                aria-label={labels.previous || "Previous stays"}
                disabled={carousel.current <= 1}
                onClick={() => slide(-1)}
              >
                <Icon name="chevronLeft" size={17} />
              </button>
              <span>
                {carousel.current} / {carousel.total}
              </span>
              <button
                type="button"
                aria-label={labels.next || "Next stays"}
                disabled={carousel.current >= carousel.total}
                onClick={() => slide(1)}
              >
                <Icon name="chevronRight" size={17} />
              </button>
            </div>
          ) : (
            <span />
          )}
          <button
            type="button"
            className="td-ist__view-all"
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded
              ? labels.showLess || "Show less"
              : labels.viewAll || `View all ${stays.length} stays`}
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
                      stayKey: current.stayKey || String(stays[0]?.stayKey || ""),
                    }));
                    setRequestOpen((value) => !value);
                  }}
                >
                  {requestOpen
                    ? labels.closeRequest || "Close request"
                    : labels.requestHotel || "Request another hotel"}
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
                        value={String(requestedStay?.stayKey || "")}
                        options={stays.map((stay) => ({
                          value: String(stay.stayKey || ""),
                          label: `${stay.location} · ${stay.nights} ${nightsLabel}`,
                        }))}
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
                      option?.value || option?.title || "",
                      room?.value || room?.name || "",
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
