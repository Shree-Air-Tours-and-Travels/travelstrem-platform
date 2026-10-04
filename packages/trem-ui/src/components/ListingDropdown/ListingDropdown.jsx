import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { createPortal } from "react-dom";
import BottomSheet from "../BottomSheet/BottomSheet.jsx";
import "./ListingDropdown.styles.scss";

function useMobileLayout(breakpoint) {
  const [mobile, setMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth <= breakpoint,
  );

  useEffect(() => {
    const update = () => setMobile(window.innerWidth <= breakpoint);
    update();
    window.addEventListener("resize", update, { passive: true });
    return () => window.removeEventListener("resize", update);
  }, [breakpoint]);

  return mobile;
}

export default function ListingDropdown({
  open,
  anchorRef,
  groups = [],
  children,
  mobileHeader,
  mobileTitle,
  ariaLabel = "Listings",
  id,
  className = "",
  emptyContent,
  loadingContent,
  loading = false,
  mobileBreakpoint = 768,
  desktopMaxHeight = 560,
  mobileVariant = "default",
  mobileCloseLabel = "Close",
  onClose,
}) {
  const panelRef = useRef(null);
  const mobile = useMobileLayout(Math.max(320, Number(mobileBreakpoint) || 768));
  const [position, setPosition] = useState({});

  useLayoutEffect(() => {
    if (!open || mobile) return undefined;
    const update = () => {
      const rect = anchorRef?.current?.getBoundingClientRect();
      if (!rect) return;
      const margin = 12;
      const width = Math.min(Math.max(rect.width, 360), window.innerWidth - margin * 2);
      const left = Math.min(Math.max(rect.left, margin), window.innerWidth - width - margin);
      setPosition({
        top: rect.bottom + 8,
        left,
        width,
        maxHeight: Math.min(
          Math.max(180, Number(desktopMaxHeight) || 560),
          Math.max(180, window.innerHeight - rect.bottom - 24),
        ),
      });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [anchorRef, desktopMaxHeight, mobile, open]);

  useEffect(() => {
    if (!open || mobile) return undefined;
    const handlePointer = (event) => {
      if (anchorRef?.current?.contains(event.target) || panelRef.current?.contains(event.target))
        return;
      onClose?.();
    };
    const handleKey = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    document.addEventListener("mousedown", handlePointer);
    window.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      window.removeEventListener("keydown", handleKey);
    };
  }, [anchorRef, mobile, onClose, open]);

  const content = (
    <>
      {loading ? loadingContent : null}
      {!loading && !groups.length ? emptyContent : null}
      {!loading
        ? groups.map((group, groupIndex) => (
            <section className="trem-listing-dropdown__group" key={group.id || groupIndex}>
              {group.label ? <h2>{group.label}</h2> : null}
              <div className="trem-listing-dropdown__list" role="group" aria-label={group.label}>
                {group.items.map((item, itemIndex) =>
                  children({
                    item,
                    group,
                    groupIndex,
                    itemIndex,
                  }),
                )}
              </div>
            </section>
          ))
        : null}
    </>
  );

  if (!open) return null;

  if (mobile) {
    return (
      <BottomSheet
        open
        onClose={onClose}
        title={mobileTitle}
        variant={mobileVariant}
        closeLabel={mobileCloseLabel}
        className={`trem-listing-dropdown__sheet ${className}`.trim()}
      >
        {mobileHeader}
        <div className="trem-listing-dropdown__content" id={id}>
          {content}
        </div>
      </BottomSheet>
    );
  }

  return createPortal(
    <section
      ref={panelRef}
      className={`trem-listing-dropdown ${className}`.trim()}
      role="listbox"
      aria-label={ariaLabel}
      id={id}
      style={position}
    >
      <div className="trem-listing-dropdown__content">{content}</div>
    </section>,
    document.body,
  );
}

ListingDropdown.propTypes = {
  open: PropTypes.bool,
  anchorRef: PropTypes.object,
  groups: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      label: PropTypes.string,
      items: PropTypes.array.isRequired,
    }),
  ),
  children: PropTypes.func.isRequired,
  mobileHeader: PropTypes.node,
  mobileTitle: PropTypes.string,
  ariaLabel: PropTypes.string,
  id: PropTypes.string,
  className: PropTypes.string,
  emptyContent: PropTypes.node,
  loadingContent: PropTypes.node,
  loading: PropTypes.bool,
  mobileBreakpoint: PropTypes.number,
  desktopMaxHeight: PropTypes.number,
  mobileVariant: PropTypes.oneOf(["default", "fullscreen"]),
  mobileCloseLabel: PropTypes.string,
  onClose: PropTypes.func,
};
