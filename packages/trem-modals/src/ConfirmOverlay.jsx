import React, { useEffect, useState } from "react";
import { Button, Icon, BottomSheet } from "@packages/trem-ui";
import ModalShell from "./ModalShell.jsx";
import "./ConfirmOverlay.styles.scss";

const MOBILE_BP = 768;

function isMobile() {
  return typeof window !== "undefined" && window.innerWidth <= MOBILE_BP;
}

export default function ConfirmOverlay({
  open,
  onClose,
  onConfirm,
  title = "Confirm",
  note,
  icon,
  confirmLabel = "Proceed",
  cancelLabel = "Cancel",
  confirmColor = "primary",
  confirmDisabled = false,
  children = null,
  className = "",
  closeOnOutsideClick = false,
}) {
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    setMobile(isMobile());
    const onResize = () => setMobile(isMobile());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  if (!open) return null;

  if (mobile) {
    return (
      <BottomSheet
        open={open}
        onClose={onClose}
        title={title}
        closeOnOutsideClick={closeOnOutsideClick}
      >
        <div className={`trem-confirm ${className}`.trim()}>
          {note && (
            <div className="trem-confirm__note">
              {icon && <Icon name={icon} size={20} />}
              <p>{note}</p>
            </div>
          )}
          {children ? <div className="trem-confirm__content">{children}</div> : null}
          <div className="trem-confirm__actions">
            <Button
              variant="outline"
              text={cancelLabel}
              onClick={onClose}
              primaryClassName="trem-confirm__btn trem-confirm__btn--cancel"
            />
            <Button
              variant="solid"
              color={confirmColor}
              text={confirmLabel}
              onClick={onConfirm}
              disabled={confirmDisabled}
              primaryClassName={`trem-confirm__btn trem-confirm__btn--confirm trem-confirm__btn--${confirmColor}`}
            />
          </div>
        </div>
      </BottomSheet>
    );
  }

  return (
    <ModalShell
      open={open}
      className={className}
      dialogClassName="trem-confirm-overlay__dialog"
      label={title}
      closeOnOutsideClick={closeOnOutsideClick}
      onClose={onClose}
    >
      <Button
        variant="text"
        isCircular
        iconLeft="x"
        onClick={onClose}
        aria-label="Close"
        primaryClassName="trem-confirm-overlay__close"
      />
      <div className="trem-confirm-overlay__header">
        {icon && <Icon name={icon} size={24} />}
        <h3>{title}</h3>
      </div>
      {note && (
        <div className="trem-confirm-overlay__note">
          <p>{note}</p>
        </div>
      )}
      {children ? <div className="trem-confirm-overlay__content">{children}</div> : null}
      <div className="trem-confirm-overlay__actions">
        <Button
          variant="outline"
          text={cancelLabel}
          onClick={onClose}
          primaryClassName="trem-confirm__btn trem-confirm__btn--cancel"
        />
        <Button
          variant="solid"
          color={confirmColor}
          text={confirmLabel}
          onClick={onConfirm}
          disabled={confirmDisabled}
          primaryClassName={`trem-confirm__btn trem-confirm__btn--confirm trem-confirm__btn--${confirmColor}`}
        />
      </div>
    </ModalShell>
  );
}
