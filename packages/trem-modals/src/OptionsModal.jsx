import React, { useEffect, useState } from "react";
import { Button, Icon, BottomSheet } from "@packages/trem-ui";
import ModalShell from "./ModalShell.jsx";
import "./OptionsModal.styles.scss";

const MOBILE_BP = 768;

function isMobile() {
  return typeof window !== "undefined" && window.innerWidth <= MOBILE_BP;
}

export default function OptionsModal({
  open,
  onClose,
  title = "Options",
  subtitle,
  icon = "hotel",
  options = [],
  emptyTitle = "No options available",
  emptyDescription = "There are no choices available for this selection yet.",
  recommendedLabel = "Recommended",
  selectedLabel = "Selected",
  pricePendingLabel = "Price on request",
  includedInLabel = "Included in",
  includedForSelectedLabel = "Included in selected package",
  includedPriceLabel = "Included",
  availableRoomsLabel = "Available rooms",
  confirmLabel = "Apply selection",
  cancelLabel = "Cancel",
  closeLabel = "Close",
  selectedValue = "",
  selectedRoomValue = "",
  onConfirm,
  customizeLabel = "Customise this tour",
  onCustomize,
  className = "",
  closeOnOutsideClick = false,
}) {
  const [mobile, setMobile] = useState(false);
  const [draftValue, setDraftValue] = useState(selectedValue);
  const [draftRoomValue, setDraftRoomValue] = useState(selectedRoomValue);
  const selectable = typeof onConfirm === "function";
  const hasOptions = Array.isArray(options) && options.length > 0;

  useEffect(() => {
    if (open) {
      setDraftValue(selectedValue);
      setDraftRoomValue(selectedRoomValue);
    }
  }, [open, selectedRoomValue, selectedValue]);

  useEffect(() => {
    setMobile(isMobile());
    const onResize = () => setMobile(isMobile());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  if (!open) return null;

  const list = hasOptions ? (
    <div className="trem-options__list">
      {options.map((option, i) => {
        const optionValue = option.value || option.title || String(i);
        const selected = selectable && draftValue === optionValue;
        const rooms = Array.isArray(option.rooms) ? option.rooms : [];
        const selectedRoom = rooms.find(
          (room, roomIndex) => (room.value || room.name || String(roomIndex)) === draftRoomValue,
        );
        const formatPrice = (pricing) => {
          if (!pricing || !Number.isFinite(Number(pricing.amountMinor))) return "";
          const amount = new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: pricing.currency || "INR",
            maximumFractionDigits: 0,
          }).format(Number(pricing.amountMinor) / 100);
          const unit =
            {
              PER_PERSON: "per person",
              PER_BOOKING: "per booking",
              PER_ROOM: "per room",
              PER_NIGHT: "per night",
              PER_ROOM_PER_NIGHT: "per room / night",
              PER_PERSON_PER_NIGHT: "per person / night",
            }[pricing.unit] || "";
          return `${amount}${unit ? ` ${unit}` : ""}`;
        };
        return (
          <div
            key={option.id || optionValue}
            className={`trem-options__item${selected ? " is-selected" : ""}`}
          >
            {option.photos?.[0] ? (
              <img
                className="trem-options__cover"
                src={option.photos[0]}
                alt={option.propertyName || option.title || "Hotel"}
              />
            ) : null}
            <button
              type="button"
              className="trem-options__option-button"
              disabled={!selectable}
              onClick={() => {
                if (!selectable) return;
                if (draftValue !== optionValue) setDraftRoomValue("");
                setDraftValue(optionValue);
              }}
              aria-pressed={selected}
            >
              <div className="trem-options__item-top">
                <span className="trem-options__badge">
                  <Icon
                    name={option.icon || (option.recommended ? "badgeCheck" : "hotel")}
                    size={16}
                  />
                </span>
                <strong className="trem-options__item-title">{option.title}</strong>
                {option.recommended && (
                  <span className="trem-options__pill">{recommendedLabel}</span>
                )}
                {selected && (
                  <span className="trem-options__pill trem-options__pill--selected">
                    {selectedLabel}
                  </span>
                )}
              </div>
              {(option.propertyName || option.propertyClass || option.location) && (
                <p className="trem-options__property">
                  {[option.propertyName, option.propertyClass, option.location]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
              {option.description && (
                <p className="trem-options__item-desc">{option.description}</p>
              )}
              {option.packageNames?.length ? (
                <div className="trem-options__included-in">
                  {includedInLabel} {option.packageNames.join(", ")}
                </div>
              ) : null}
              {option.amenities?.length ? (
                <div className="trem-options__chips">
                  {option.amenities.slice(0, 8).map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
              ) : null}
              {!rooms.length && (option.cost || option.pricing || option.pricePending) && (
                <div className="trem-options__cost">
                  <span className="trem-options__cost-label">
                    {option.costLabel || "Upgrade cost"}
                  </span>
                  <span className="trem-options__cost-value">
                    {option.pricePending
                      ? pricePendingLabel
                      : option.cost || formatPrice(option.pricing)}
                  </span>
                </div>
              )}
            </button>
            {rooms.length ? (
              <div className="trem-options__rooms" aria-label={availableRoomsLabel}>
                <strong className="trem-options__rooms-title">{availableRoomsLabel}</strong>
                {rooms.map((room, roomIndex) => {
                  const roomValue = room.value || room.name || String(roomIndex);
                  const roomSelected = selected && draftRoomValue === roomValue;
                  return (
                    <button
                      type="button"
                      className={`trem-options__room${roomSelected ? " is-selected" : ""}${room.includedInSelectedPackage ? " is-included" : ""}`}
                      key={room.id || roomValue}
                      disabled={!selectable}
                      onClick={() => {
                        setDraftValue(optionValue);
                        setDraftRoomValue(roomValue);
                      }}
                      aria-pressed={roomSelected}
                    >
                      {room.photos?.[0] ? <img src={room.photos[0]} alt="" /> : null}
                      <span className="trem-options__room-copy">
                        <strong>{room.name}</strong>
                        {room.includedInSelectedPackage ? (
                          <em>{includedForSelectedLabel}</em>
                        ) : null}
                        <small>
                          {[
                            room.bedType,
                            `Up to ${room.maxAdults || 2} adults`,
                            ...(room.meals || []),
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </small>
                        {room.amenities?.length ? (
                          <small>{room.amenities.slice(0, 5).join(" · ")}</small>
                        ) : null}
                        {room.packageNames?.length ? (
                          <small className="trem-options__room-packages">
                            {includedInLabel}: {room.packageNames.join(" · ")}
                          </small>
                        ) : null}
                      </span>
                      <strong className="trem-options__room-price">
                        {room.includedInSelectedPackage
                          ? includedPriceLabel
                          : room.pricePending
                            ? pricePendingLabel
                            : formatPrice(room.pricing)}
                      </strong>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  ) : (
    <div className="trem-options__empty" role="status">
      <span className="trem-options__empty-icon" aria-hidden="true">
        <Icon name={icon} size={28} />
      </span>
      <strong>{emptyTitle}</strong>
      <p>{emptyDescription}</p>
    </div>
  );

  const selectionActions = selectable ? (
    <div className="trem-options__actions">
      <Button variant="text" color="primary" text={cancelLabel} onClick={onClose} />
      {hasOptions ? (
        <Button
          variant="solid"
          color="primary"
          text={confirmLabel}
          disabled={
            !draftValue ||
            Boolean(
              (
                options.find(
                  (option, index) =>
                    (option.value || option.title || String(index)) === draftValue,
                )?.rooms || []
              ).length && !draftRoomValue,
            )
          }
          onClick={() =>
            onConfirm(
              options.find(
                (option, index) => (option.value || option.title || String(index)) === draftValue,
              ),
              options
                .find(
                  (option, index) =>
                    (option.value || option.title || String(index)) === draftValue,
                )
                ?.rooms?.find(
                  (room, index) => (room.value || room.name || String(index)) === draftRoomValue,
                ) || null,
            )
          }
        />
      ) : null}
      {hasOptions && typeof onCustomize === "function" ? (
        <Button
          variant="outline"
          color="primary"
          text={customizeLabel}
          disabled={!draftValue}
          onClick={() =>
            onCustomize(
              options.find(
                (option, index) => (option.value || option.title || String(index)) === draftValue,
              ),
              options
                .find(
                  (option, index) => (option.value || option.title || String(index)) === draftValue,
                )
                ?.rooms?.find(
                  (room, index) => (room.value || room.name || String(index)) === draftRoomValue,
                ) || null,
            )
          }
        />
      ) : null}
    </div>
  ) : null;

  const content = (
    <div className={`trem-options ${className}`.trim()}>
      <div className="trem-options__scroll">
        {subtitle && hasOptions ? <p className="trem-options__subtitle">{subtitle}</p> : null}
        {list}
      </div>
      {selectionActions}
    </div>
  );

  if (mobile) {
    return (
      <BottomSheet
        open={open}
        onClose={onClose}
        title={title}
        className="trem-options-sheet"
        closeOnOutsideClick={closeOnOutsideClick}
      >
        {content}
      </BottomSheet>
    );
  }

  return (
    <ModalShell
      open={open}
      className={className}
      dialogClassName="trem-options-overlay__dialog"
      label={title}
      closeOnOutsideClick={closeOnOutsideClick}
      onClose={onClose}
    >
      <Button
        variant="text"
        isCircular
        iconLeft="x"
        onClick={onClose}
        aria-label={closeLabel}
        primaryClassName="trem-options-overlay__close"
      />
      <div className="trem-options-overlay__header">
        <span className="trem-options-overlay__icon">
          <Icon name={icon} size={22} />
        </span>
        <h3>{title}</h3>
      </div>
      {content}
    </ModalShell>
  );
}
