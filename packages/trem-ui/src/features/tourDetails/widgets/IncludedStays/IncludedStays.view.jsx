import React, { useState } from "react";
import { Title, Icon } from "../../../../index.js";
import { OptionsModal } from "@packages/trem-modals";
import "./IncludedStays.styles.scss";

export default function IncludedStaysView({ labels = {}, stays = [], hotelOptions = [] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const title = labels.title || "Included stays";
  const nightsLabel = labels.nightsLabel || "nights";
  const hasOptions = Array.isArray(hotelOptions) && hotelOptions.length > 0;

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
            stay.propertyClass,
            stay.propertyName,
            stay.roomType,
            ...(Array.isArray(stay.meals) && stay.meals.length
              ? [`${stay.meals.join(", ")} included`]
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
                  {stay.nights} {nightsLabel} · {stay.location}
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
            {labels.viewOptions || "View hotel options"}
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
          />
        </>
      )}
    </section>
  );
}
