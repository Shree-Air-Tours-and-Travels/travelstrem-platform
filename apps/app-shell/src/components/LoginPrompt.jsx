import React from "react";
import { Button, Icon, Paragraph, Title } from "@packages/trem-ui";
import { ModalShell } from "@packages/trem-modals";
import "./LoginPrompt.scss";

export default function LoginPrompt({
  onLogin,
  onContinueAsGuest,
  title = "Welcome to TravelsTrem",
  description,
}) {
  const continueAsGuest = (event) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    if (typeof onContinueAsGuest === "function") {
      onContinueAsGuest();
    }
  };

  return (
    <ModalShell
      open
      label={title}
      dialogClassName="dlp__card"
      closeOnOutsideClick={false}
      onClose={continueAsGuest}
    >
      <button
        className="dlp__close"
        type="button"
        aria-label="Continue as guest"
        title="Continue as guest"
        onClick={continueAsGuest}
      >
        <Icon name="x" size={18} />
      </button>
      <div className="dlp__content">
        <div className="dlp__brand">TRAVELSTREM</div>
        <div className="dlp__icon" aria-hidden="true">
          <img src="/favicon-dark.png" alt="" />
        </div>
        <Title text={title} primaryClassname="dlp__title" />
        <Paragraph
          text={
            description ||
            "Sign in to manage favourites and enquiries, or continue as a guest to discover travel services tailored to you."
          }
          primaryClassname="dlp__desc"
        />
        <div className="dlp__actions">
          <Button
            variant="solid"
            color="primary"
            size="large"
            text="Sign in"
            iconRight="chevronRight"
            onClick={onLogin}
            primaryClassName="dlp__btn"
          />
          {onContinueAsGuest ? (
            <Button
              variant="text"
              color="primary"
              size="large"
              text="Explore as guest"
              onClick={onContinueAsGuest}
              primaryClassName="dlp__btn dlp__btn--guest"
            />
          ) : null}
        </div>
      </div>
      <div className="dlp__visual" aria-hidden="true">
        <span className="dlp__visual-orbit" />
        <span className="dlp__visual-route" />
        <span className="dlp__visual-point dlp__visual-point--start" />
        <span className="dlp__visual-point dlp__visual-point--end" />
        <span className="dlp__visual-mark">
          <Icon name="compass" size={42} />
        </span>
      </div>
    </ModalShell>
  );
}
