import React, { useRef, useState } from "react";
import {
  Breadcrumbs,
  Button,
  CardWithSubEntity,
  ErrorState,
  FloatingActionBar,
  Gallery,
  HotelRoomCard,
  HotelRoomDetails,
  HotelRateCard,
  Icon,
  Spinner,
  StatusBadge,
} from "@packages/trem-ui";
import TrehubPreloader from "../../../TrehubPreloader.jsx";
import HotelPropertyInformationContainer from "../container/HotelPropertyInformation.container.jsx";
import { ConfirmOverlay, ModalShell } from "@packages/trem-modals";
import "../../Hotels.scss";

export default function HotelDetailsView({
  contract,
  data,
  propertyWidgetUrl,
  roomsLoading,
  error,
  loading,
  saving,
  selectedRooms,
  activeSlot,
  quote,
  quoteLoading,
  quoteError,
  expandedRoomId,
  confirmOpen,
  onSelectRoom,
  onChooseSlot,
  onToggleRoom,
  onBack,
  onContinue,
  onCloseConfirm,
  onConfirm,
  onRetry,
}) {
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [rateGroup, setRateGroup] = useState(null);
  const labels = contract?.elements?.labels || {};
  const widgets = contract?.structure?.widgets || [];
  const breadcrumbs = widgets.find((widget) => widget.type === "HotelBreadcrumbs");
  const summaryWidget = widgets.find((widget) => widget.type === "HotelSummary");
  const propertyWidget = widgets.find((widget) => widget.type === "HotelPropertyInformation");
  const benefitLabelRefs = propertyWidget?.props?.benefitLabelRefs || [];
  const introWidgetType = widgets.some((widget) => widget.type === "HotelGallery")
    ? "HotelGallery"
    : "HotelDetails";
  const expandedRoom = data?.rooms?.find((room) => room.id === expandedRoomId) || null;
  const expandedRoomTotal = expandedRoom?.priceFields?.find((field) => field.id === "total");
  const selectedRoom = selectedRooms[activeSlot] || null;
  const selectedCount = selectedRooms.filter(Boolean).length;
  const roomGroups = data?.roomGroups || [];
  const roomCardRefs = useRef(new Map());

  return (
    <div className="trehub-page">
      <div className="trehub-page__breadcrumbs">
        {contract ? (
          <Breadcrumbs
            items={(breadcrumbs?.detailsItems || []).map((item) => ({
              label: labels[item.labelRef],
              ...(item.labelRef === "breadcrumbHotels" ? { onClick: onBack } : { path: item.path }),
            }))}
          />
        ) : loading ? (
          <span className="trehub-loading__breadcrumb-placeholder" aria-hidden="true" />
        ) : null}
      </div>
      <main
        className="trehub-hotels trehub-hotels--details"
        aria-busy={loading || roomsLoading || saving}
      >
        {loading && !data ? (
          <TrehubPreloader variant="hotel-detail" label={labels.loading} />
        ) : null}
        {saving || (loading && data) ? (
          <Spinner label={labels.loading || ""} className="trehub-hotels__pending" />
        ) : null}
        {error ? (
          <ErrorState
            title={labels.error}
            description={error.message}
            retry={onRetry}
            retryText={labels.retry}
          />
        ) : null}
        {data?.demoInventory || data?.provider === "mock" ? (
          <p role="note" className="trehub-hotels__notice">
            <Icon name="info" size={18} aria-hidden="true" />
            {labels.mock}
          </p>
        ) : null}
        {widgets.map((widget) => {
          if (!data) return null;
          if (widget.type === introWidgetType)
            return (
              <div key={widget.type} className="trehub-hotels__details-intro">
                <div className="trehub-hotels__details-main">
                  {data.images.length ? (
                    <div className="trehub-hotels__gallery">
                      <Gallery
                        images={data.images}
                        title={data.title}
                        subtitle={data.address}
                        labels={labels}
                        aspectRatio="16 / 6"
                      />
                    </div>
                  ) : null}
                  <section className="trehub-hotels__overview">
                    <header className="trehub-hotels__hotel-heading">
                      <div className="trehub-hotels__hotel-identity">
                        <div className="trehub-hotels__identity-meta">
                          <span className="trehub-eyebrow">{labels.eyebrow}</span>
                          <span className="trehub-hotels__property-class">
                            <Icon name="hotel" size={16} aria-hidden="true" />
                            {data.propertyClass || data.badge?.value}
                          </span>
                        </div>
                        <h1>{data.title}</h1>
                        <p>
                          <Icon name="mapPin" size={18} aria-hidden="true" />
                          {data.address}
                        </p>
                      </div>
                      {Number.isFinite(Number(data.rating)) && Number(data.rating) > 0 ? (
                        <div className="trehub-hotels__hotel-rating">
                          <strong className="trehub-hotels__rating-score">
                            <Icon name="star" size={18} aria-hidden="true" />
                            {data.ratingSummary?.value || data.rating}
                          </strong>
                          <span className="trehub-hotels__rating-copy">
                            <strong>{labels[data.ratingSummary?.labelRef] || labels.rating}</strong>
                            <small>{data.ratingSummary?.reviews}</small>
                          </span>
                        </div>
                      ) : null}
                    </header>
                    <div className="trehub-hotels__section-heading">
                      <div>
                        <h2>{labels.overview}</h2>
                        <p>{labels.overviewDescription}</p>
                      </div>
                    </div>
                    {data.facts?.length ? (
                      <div className="trehub-hotels__facts">
                        {data.facts.map((fact) => (
                          <div className="trehub-hotels__fact" key={fact.id}>
                            <span>
                              <Icon name={fact.icon} size={20} aria-hidden="true" />
                            </span>
                            <div>
                              <small>{labels[fact.labelRef]}</small>
                              <strong>{fact.value}</strong>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                    {data.description ? (
                      <div className="trehub-hotels__description">
                        <span>
                          <Icon name="sparkles" size={20} aria-hidden="true" />
                        </span>
                        <div>
                          <small>{labels.propertyDescription}</small>
                          <p
                            className={
                              showFullDescription
                                ? "trehub-hotels__description-copy--expanded"
                                : "trehub-hotels__description-copy"
                            }
                          >
                            {data.description}
                          </p>
                          {data.description?.length > 320 ? (
                            <Button
                              text={showFullDescription ? labels.showLess : labels.readMore}
                              variant="text"
                              onClick={() => setShowFullDescription((visible) => !visible)}
                            />
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                  </section>
                </div>
              </div>
            );
          if (widget.type === "HotelDetails") return null;
          if (widget.type === "HotelPropertyInformation")
            return (
              <HotelPropertyInformationContainer
                key={widget.type}
                url={propertyWidgetUrl}
                labels={labels}
                widgetProps={widget.props || {}}
              />
            );
          if (widget.type === "HotelRooms")
            return (
              <section key={widget.type} id="hotel-rooms" className="trehub-hotels__rooms">
                <div className="trehub-hotels__section-heading">
                  <div>
                    <h2>{labels.rooms}</h2>
                    <p>{labels.roomsDescription}</p>
                  </div>
                </div>
                {data.input.rooms > 1 || selectedCount ? (
                  <div className="trehub-hotels__room-slot-bar">
                    <div className="trehub-hotels__selection-heading">
                      <strong>{labels.selectedRooms}</strong>
                      <span className="trehub-hotels__room-slot-count">
                        {selectedCount}/{data.input.rooms}
                      </span>
                      <StatusBadge
                        value={labels.roomsSelected
                          ?.replace("{selected}", selectedCount)
                          ?.replace("{count}", data.input.rooms)}
                        tone={selectedCount === data.input.rooms ? "success" : "info"}
                        icon={selectedCount === data.input.rooms ? "check" : undefined}
                        showDot={false}
                      />
                      {quoteLoading ? (
                        <Spinner
                          size="sm"
                          label={labels.loading || ""}
                          className="trehub-hotels__sync-status"
                        />
                      ) : null}
                      {quote ? (
                        <strong className="trehub-hotels__room-slot-total">
                          {labels.total}: {quote.display.total}
                        </strong>
                      ) : null}
                    </div>
                    <div className="trehub-hotels__selected-slots">
                      {Array.from({ length: data.input.rooms }, (_, index) => (
                        <button
                          key={index}
                          type="button"
                          className={`trehub-hotels__selected-slot${selectedRooms[index] ? " trehub-hotels__selected-slot--filled" : ""}${activeSlot === index ? " trehub-hotels__selected-slot--active" : ""}`}
                          aria-pressed={activeSlot === index}
                          title={`${labels.roomSlot?.replace("{count}", index + 1)} · ${selectedRooms[index]?.title || labels.selectRoom}${selectedRooms[index]?.rateLabel ? ` · ${selectedRooms[index].rateLabel}` : ""}`}
                          onClick={() => {
                            onChooseSlot(index);
                            const room = selectedRooms[index];
                            roomCardRefs.current
                              .get(room?.roomTypeId || room?.id)
                              ?.scrollIntoView({ behavior: "smooth", block: "center" });
                          }}
                        >
                          <span>{labels.roomSlot?.replace("{count}", index + 1)}</span>
                          <strong>{selectedRooms[index]?.title || labels.selectRoom}</strong>
                          {selectedRooms[index]?.rateLabel ? (
                            <small>
                              {selectedRooms[index].rateLabel}
                              {quote?.lineItems?.[index]?.stayAmount
                                ? ` · ${quote.lineItems[index].stayAmount}`
                                : ""}
                            </small>
                          ) : null}
                        </button>
                      ))}
                    </div>
                    {quoteError ? <p role="alert">{quoteError.message}</p> : null}
                  </div>
                ) : null}
                {quote ? (
                  <div className="trehub-hotels__selection-card trehub-hotels__selection-card--rooms">
                    <div className="trehub-hotels__selection-price">
                      <div>
                        <span>{labels.stay}</span>
                        <strong>{quote.display.subtotal}</strong>
                      </div>
                      <div>
                        <span>{labels.fee}</span>
                        <strong>{quote.display.convenienceFee}</strong>
                      </div>
                      <div>
                        <span>{labels.total}</span>
                        <strong>{quote.display.total}</strong>
                      </div>
                    </div>
                  </div>
                ) : null}
                {roomsLoading ? (
                  <div className="trehub-hotels__widget-loading">
                    <Spinner label={labels.loading || ""} />
                  </div>
                ) : !data.rooms?.length ? (
                  <p>{labels.emptyDescription}</p>
                ) : null}
                <div className="trehub-hotels__room-list">
                  {roomGroups.map((group) => {
                    const variants = group.variants || [];
                    const room =
                      variants.find((offer) => offer.id === selectedRoom?.id) ||
                      variants.find((offer) =>
                        selectedRooms.some((selected) => selected?.id === offer.id),
                      ) ||
                      variants[0];
                    const assignedSlots = selectedRooms.flatMap((selected, index) =>
                      selected && variants.some((offer) => offer.id === selected.id)
                        ? [
                            {
                              slot: labels.roomSlot?.replace("{count}", index + 1),
                              roomId: selected.id,
                              rateLabel: selected.rateLabel,
                            },
                          ]
                        : [],
                    );
                    return (
                      <div
                        key={group.id}
                        ref={(node) => {
                          const typeId = room.roomTypeId || room.id;
                          if (node) roomCardRefs.current.set(typeId, node);
                          else roomCardRefs.current.delete(typeId);
                        }}
                      >
                        <HotelRoomCard
                          room={room}
                          variant="preview"
                          variants={variants}
                          labels={labels}
                          assignedSlots={assignedSlots}
                          selected={room.id === selectedRoom?.id}
                          expanded={room.id === expandedRoomId}
                          disabled={loading || saving}
                          onSelect={onSelectRoom}
                          onOpenRates={() => setRateGroup({ room, variants })}
                          onToggle={() => onToggleRoom(room.id)}
                          renderExpandedDetails={false}
                        />
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          if (widget.type === "HotelSummary") return null;
          return null;
        })}
        {data && summaryWidget ? (
          <aside className="trehub-hotels__rail" aria-label={labels[data.summary.titleRef]}>
            <div className="trehub-hotels__rail-stack">
              <section className="trehub-hotels__stay-card">
                <div className="trehub-hotels__stay-heading">
                  <span><Icon name="hotel" size={22} aria-hidden="true" /></span>
                  <div>
                    <h2>{labels[data.summary.titleRef]}</h2>
                    <p>{data.summary.subtitle}</p>
                  </div>
                </div>
                <div className="trehub-hotels__stay-facts">
                  {data.summary.fields.map((field) => (
                    <div key={field.id}>
                      <Icon name={field.icon} size={18} aria-hidden="true" />
                      <span>
                        <small>{labels[field.labelRef]}</small>
                        <strong>{field.value}</strong>
                      </span>
                    </div>
                  ))}
                </div>
              </section>
              {data.startingPrice ? (
                <section className="trehub-hotels__stay-price-card">
                  <small>{labels.stayPrice}</small>
                  <strong>{data.startingPrice}</strong>
                  <Button
                    text={labels.viewRooms}
                    variant="solid"
                    href="#hotel-rooms"
                    iconRight="chevronRight"
                    fullWidth
                  />
                </section>
              ) : null}
              {data.address ? (
                <section className="trehub-hotels__property-block trehub-hotels__location-card">
                  <span className="trehub-hotels__location-icon">
                    <Icon name="mapPin" size={22} aria-hidden="true" />
                  </span>
                  <div className="trehub-hotels__location-copy">
                    <h3>{labels.propertyLocation}</h3>
                    <p>{data.address}</p>
                  </div>
                  <Button
                    text={labels.openInMaps}
                    variant="outline"
                    href={data.mapUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    iconRight="chevronRight"
                  />
                </section>
              ) : null}
              {benefitLabelRefs.length ? (
                <section className="trehub-hotels__property-block trehub-hotels__benefits">
                  <div className="trehub-hotels__benefits-heading">
                    <span><Icon name="sparkles" size={19} aria-hidden="true" /></span>
                    <h3>{labels.travelstremBenefits}</h3>
                  </div>
                  <ul>
                    {benefitLabelRefs.map((ref) => (
                      <li key={ref}>
                        <Icon name="check" size={18} aria-hidden="true" />
                        {labels[ref]}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </div>
          </aside>
        ) : null}
        <ModalShell
          open={Boolean(expandedRoom)}
          label={expandedRoom ? `${labels.roomDetailsHeading}: ${expandedRoom.title}` : undefined}
          className="trehub-room-details-modal"
          dialogClassName="trehub-room-details-modal__dialog"
          closeOnOutsideClick
          onClose={() => expandedRoom && onToggleRoom(expandedRoom.id)}
        >
          {expandedRoom ? (
            <section className="trehub-room-details-modal__content">
              <header className="trehub-room-details-modal__header">
                <div>
                  {expandedRoom.badge?.value ? (
                    <span className="trehub-eyebrow">{expandedRoom.badge.value}</span>
                  ) : null}
                  <h2>{expandedRoom.title}</h2>
                  <p>{expandedRoom.meta}</p>
                </div>
                <Button
                  variant="text"
                  iconLeft="x"
                  aria-label={labels.closeRoomDetails}
                  onClick={() => onToggleRoom(expandedRoom.id)}
                />
              </header>
              <div className="trehub-room-details-modal__body">
                <HotelRoomDetails room={expandedRoom} labels={labels} />
              </div>
              <footer className="trehub-room-details-modal__footer">
                {expandedRoomTotal ? <div className="trehub-room-details-modal__total">
                  <span>{labels[expandedRoomTotal.labelRef] || labels.total}</span>
                  <strong>{expandedRoomTotal.value}</strong>
                </div> : null}
                <div className="trehub-room-details-modal__footer-actions">
                  <Button
                    text={labels.closeRoomDetails}
                    variant="outline"
                    disabled={saving}
                    onClick={() => onToggleRoom(expandedRoom.id)}
                  />
                  <Button
                    text={
                      labels[
                        expandedRoom.id === selectedRoom?.id
                          ? expandedRoom.selectedLabelRef
                          : expandedRoom.actionLabelRef
                      ]
                    }
                    iconLeft={expandedRoom.id === selectedRoom?.id ? "check" : undefined}
                    iconRight={expandedRoom.id === selectedRoom?.id ? undefined : "arrowUpRight"}
                    disabled={saving}
                    onClick={() => {
                      onToggleRoom(expandedRoom.id);
                      const group = roomGroups.find((item) =>
                        item.variants?.some((offer) => offer.id === expandedRoom.id),
                      );
                      if (group?.variants?.length)
                        setRateGroup({ room: expandedRoom, variants: group.variants });
                    }}
                  />
                </div>
              </footer>
            </section>
          ) : null}
        </ModalShell>
        <ModalShell
          open={Boolean(rateGroup)}
          label={rateGroup ? `${labels.rateOptions}: ${rateGroup.room.title}` : undefined}
          className="trehub-rate-modal"
          dialogClassName="trehub-rate-modal__dialog"
          closeOnOutsideClick
          onClose={() => setRateGroup(null)}
        >
          {rateGroup ? (
            <section className="trehub-rate-modal__content">
              <header className="trehub-rate-modal__header">
                <div>
                  <span className="trehub-eyebrow">{labels.rateOptions}</span>
                  <h2>{rateGroup.room.title}</h2>
                  {rateGroup.room.meta ? <p>{rateGroup.room.meta}</p> : null}
                </div>
                <Button
                  variant="text"
                  iconLeft="x"
                  aria-label={labels.closeRoomDetails}
                  onClick={() => setRateGroup(null)}
                />
              </header>
              <div className="trehub-rate-modal__list">
                {rateGroup.variants.map((rate) => (
                  <HotelRateCard
                    key={rate.id}
                    rate={rate}
                    labels={labels}
                    assignedSlots={selectedRooms.flatMap((selected, index) =>
                      selected?.id === rate.id
                        ? [labels.roomSlot?.replace("{count}", index + 1)]
                        : [],
                    )}
                    disabled={saving}
                    onSelect={(offer) => {
                      onSelectRoom(offer);
                      setRateGroup(null);
                    }}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </ModalShell>
        <FloatingActionBar
          actions={[
            {
              label: labels.back,
              variant: "outline",
              align: "left",
              disabled: saving,
              onClick: onBack,
            },
            {
              label: labels.continue,
              variant: "solid",
              align: "right",
              disabled: !quote || quoteLoading || loading || saving,
              onClick: onContinue,
            },
          ]}
        />
        <ConfirmOverlay
          open={confirmOpen}
          title={labels.modalTitle}
          note={labels.modalDescription}
          confirmLabel={labels.confirm}
          cancelLabel={labels.cancel}
          confirmDisabled={saving}
          onClose={onCloseConfirm}
          onConfirm={onConfirm}
        >
          {quote ? (
            <CardWithSubEntity
              className="trehub-hotels__confirm-card"
              title={labels.selectedRooms}
              badge={labels.roomsSelected
                ?.replace("{selected}", quote.lineItems.length)
                ?.replace("{count}", data.input.rooms)}
              items={quote.lineItems.map((item, index) => ({
                id: `${item.roomId}-${index}`,
                label: (
                  <span className="trehub-hotels__confirm-room-label">
                    <strong>
                      {labels.roomSlot?.replace("{count}", index + 1)} · {item.name}
                    </strong>
                    <small>{item.ratePlan}</small>
                  </span>
                ),
                value: item.stayAmount,
              }))}
              sections={[
                {
                  id: "charges",
                  items: [
                    { id: "stay", label: labels.stay, value: quote.display.subtotal },
                    { id: "fee", label: labels.fee, value: quote.display.convenienceFee },
                  ],
                },
              ]}
              totals={[
                { id: "total", label: labels.total, value: quote.display.total, tone: "highlight" },
              ]}
            />
          ) : null}
        </ConfirmOverlay>
      </main>
    </div>
  );
}
