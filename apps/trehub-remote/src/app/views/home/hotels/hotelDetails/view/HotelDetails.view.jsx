import React from "react";
import {
  Breadcrumbs,
  Button,
  ErrorState,
  FloatingActionBar,
  Gallery,
  HotelRoomCard,
  Icon,
  Preloader,
  Spinner,
  StatusBadge,
} from "@packages/trem-ui";
import { ConfirmOverlay } from "@packages/trem-modals";
import "../../Hotels.scss";

export default function HotelDetailsView({
  contract,
  data,
  error,
  loading,
  saving,
  selectedRoom,
  expandedRoomId,
  confirmOpen,
  onSelectRoom,
  onToggleRoom,
  onBack,
  onContinue,
  onCloseConfirm,
  onConfirm,
  onRetry,
}) {
  const labels = contract?.elements?.labels || {};
  const widgets = contract?.structure?.widgets || [];
  const breadcrumbs = widgets.find((widget) => widget.type === "HotelBreadcrumbs");
  const summaryWidget = widgets.find((widget) => widget.type === "HotelSummary");
  const introWidgetType = widgets.some((widget) => widget.type === "HotelGallery")
    ? "HotelGallery"
    : "HotelDetails";

  return (
    <div className="trehub-page">
      <div className="trehub-page__breadcrumbs">
        <Breadcrumbs
          items={(breadcrumbs?.detailsItems || []).map((item) => ({
            label: labels[item.labelRef],
            path: item.path,
          }))}
        />
      </div>
      <main className="trehub-hotels trehub-hotels--details" aria-busy={loading || saving}>
        {loading && !data ? (
          <Preloader
            variant="stack"
            label={labels.loading || ""}
            className="trehub-hotels__preloader"
          />
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
        {data?.provider === "mock" ? (
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
                        aspectRatio="16 / 5"
                      />
                    </div>
                  ) : null}
                  <section className="trehub-hotels__overview">
                    <header className="trehub-hotels__hotel-heading">
                      <div>
                        <span className="trehub-eyebrow">{labels.eyebrow}</span>
                        <h1>{data.title}</h1>
                        <p>{data.address}</p>
                      </div>
                      <div className="trehub-hotels__hotel-rating">
                        <StatusBadge {...data.badge} showDot={false} />
                        <span>
                          <Icon name="star" size={18} aria-hidden="true" />
                          <strong>{data.rating}</strong>
                          <small>{labels.rating}</small>
                        </span>
                      </div>
                    </header>
                    <div className="trehub-hotels__section-heading">
                      <div>
                        <h2>{labels.overview}</h2>
                        <p>{labels.overviewDescription}</p>
                      </div>
                      <Button
                        text={labels.openInMaps}
                        variant="text"
                        href={data.mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        iconLeft="mapPin"
                      />
                    </div>
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
                    <p className="trehub-hotels__description">{data.description}</p>
                    <div className="trehub-hotels__detail-grid">
                      <div>
                        <h3>{labels.amenities}</h3>
                        <div className="trehub-hotels__amenities">
                          {data.amenities.map((amenity) => (
                            <span key={amenity.value}>
                              <Icon name={amenity.icon} size={18} aria-hidden="true" />
                              {amenity.value}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h3>{labels.policies}</h3>
                        <p>{labels.policiesDescription}</p>
                        <ul className="trehub-hotels__policies">
                          {data.policies.map((policy) => (
                            <li key={policy}>
                              <Icon name="shieldCheck" size={18} aria-hidden="true" />
                              <span>{policy}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </section>
                </div>
                {summaryWidget ? (
                  <aside className="trehub-hotels__summary">
                    <section className="trehub-hotels__stay-card">
                      <div className="trehub-hotels__stay-heading">
                        <span>
                          <Icon name="hotel" size={22} aria-hidden="true" />
                        </span>
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
                    {selectedRoom ? (
                      <section className="trehub-hotels__selection-card">
                        <StatusBadge
                          value={labels.selectedRoom}
                          tone="success"
                          icon="check"
                          showDot={false}
                        />
                        <div>
                          <small>{labels.selectedStay}</small>
                          <h3>{selectedRoom.title}</h3>
                        </div>
                        <div className="trehub-hotels__selection-price">
                          {selectedRoom.fields
                            .filter((item) => summaryWidget.summaryFieldIds?.includes(item.id))
                            .map((field) => (
                              <div key={field.id}>
                                <span>{labels[field.labelRef]}</span>
                                <strong>{field.value}</strong>
                              </div>
                            ))}
                        </div>
                      </section>
                    ) : null}
                  </aside>
                ) : null}
              </div>
            );
          if (widget.type === "HotelDetails") return null;
          if (widget.type === "HotelRooms")
            return (
              <section key={widget.type} className="trehub-hotels__rooms">
                <div className="trehub-hotels__section-heading">
                  <div>
                    <h2>{labels.rooms}</h2>
                    <p>{labels.roomsDescription}</p>
                  </div>
                </div>
                {!data.rooms.length ? <p>{labels.emptyDescription}</p> : null}
                <div className="trehub-hotels__room-list">
                  {data.rooms.map((room) => (
                    <HotelRoomCard
                      key={room.id}
                      room={room}
                      labels={labels}
                      selected={room.id === selectedRoom?.id}
                      expanded={room.id === expandedRoomId}
                      disabled={loading || saving}
                      onSelect={onSelectRoom}
                      onToggle={() => onToggleRoom(room.id)}
                    />
                  ))}
                </div>
              </section>
            );
          if (widget.type === "HotelSummary") return null;
          return null;
        })}
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
              disabled: !selectedRoom || loading || saving,
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
        />
      </main>
    </div>
  );
}
