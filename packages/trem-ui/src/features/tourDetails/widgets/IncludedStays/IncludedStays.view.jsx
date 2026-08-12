import React, { useState } from "react";
import { Title, Icon } from "../../../../index.js";
import { OptionsModal } from "@packages/trem-modals";
import { getDisplayText } from "../../helper";
import "./IncludedStays.styles.scss";

export default function IncludedStaysView({ labels = {}, stays = [], hotelOptions = [], selectedHotel = "", onSelectHotel }) {
  const [modalOpen, setModalOpen] = useState(false);
  const title = labels.title || "Included stays";
  const nightsLabel = labels.nightsLabel || "nights";
  const hasOptions = Array.isArray(hotelOptions) && hotelOptions.length > 0;
  const selectable = typeof onSelectHotel === "function";

  return (
    <section className="td-ist" aria-label={title}>
      <header className="td-ist__header">
        <span className="td-ist__icon">
          <Icon name="hotel" size={18} />
        </span>
        <Title text={title} primaryClassname="td-ist__title" />
      </header>

      <div className="td-ist__list">
        {stays.map((stay, i) => {
          const details = [
            getDisplayText(stay.propertyClass),
            getDisplayText(stay.propertyName),
            getDisplayText(stay.roomType),
            ...(Array.isArray(stay.meals) && stay.meals.length
              ? [`${stay.meals.map((meal) => getDisplayText(meal)).filter(Boolean).join(", ")} included`]
              : []),
          ]
            .filter(Boolean)
            .join(" · ");

          return (
            <div key={i} className="td-ist__stay">
              <span className="td-ist__stay-badge">
                <Icon name="moon" size={15} />
              </span>
              <div className="td-ist__stay-body">
                <p className="td-ist__stay-line1">
                  {stay.nights} {nightsLabel} · {getDisplayText(stay.location, "Location on request")}
                </p>
                {details && <p className="td-ist__stay-line2">{details}</p>}
              </div>
            </div>
          );
        })}
      </div>

      {hasOptions && (
        <>
          <button type="button" className="td-ist__link" onClick={() => setModalOpen(true)}>
            {selectable ? (labels.updateHotel || "Update hotel") : (labels.viewOptions || "View hotel options")}
            <Icon name="arrowUpRight" size={15} />
          </button>

          <OptionsModal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            title={labels.optionsTitle || "Hotel options"}
            subtitle={labels.optionsSubtitle}
            icon="hotel"
            recommendedLabel={labels.recommended || "Recommended"}
            options={hotelOptions}
            selectedValue={selectedHotel}
            selectedLabel={labels.selected || "Selected"}
            confirmLabel={labels.applyHotel || "Apply hotel"}
            cancelLabel={labels.cancel || "Cancel"}
            onConfirm={selectable ? (option) => {
              onSelectHotel(option?.value || option?.title || "");
              setModalOpen(false);
            } : undefined}
          />
        </>
      )}
    </section>
  );
}
