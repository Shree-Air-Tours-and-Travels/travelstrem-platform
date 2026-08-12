import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import BottomSheet from "../BottomSheet/BottomSheet.jsx";
import "./DatePicker.styles.scss";

const MENU_GAP = 8;
const VIEWPORT_MARGIN = 12;
const DEFAULT_CALENDAR_HEIGHT = 344;

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function toDateString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseDate(str) {
  if (!str) return null;
  const parts = str.split("-");
  if (parts.length !== 3) return null;
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  return isNaN(d.getTime()) ? null : d;
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

function isSameDay(a, b) {
  if (!a || !b) return false;
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isBeforeDay(a, b) {
  if (!a || !b) return false;
  const ta = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  const tb = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
  return ta < tb;
}

function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth <= breakpoint);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    setIsMobile(mq.matches);
    return () => mq.removeEventListener("change", handler);
  }, [breakpoint]);
  return isMobile;
}

export default function DatePicker({
  value = "",
  onChange,
  placeholder = "Select date",
  min,
  max,
  mode = "calendar",
  disabled = false,
  error,
  className = "",
}) {
  const selectedDate = useMemo(() => parseDate(value), [value]);
  const minDate = useMemo(() => parseDate(min), [min]);
  const maxDate = useMemo(() => parseDate(max), [max]);
  const isBirthDate = mode === "birthdate";

  const today = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }, []);
  const effectiveMaxDate = useMemo(
    () => maxDate || (isBirthDate ? today : null),
    [isBirthDate, maxDate, today],
  );
  const initialViewDate = useMemo(
    () => selectedDate || (isBirthDate
      ? new Date(today.getFullYear() - 25, today.getMonth(), 1)
      : today),
    [isBirthDate, selectedDate, today],
  );

  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(initialViewDate);
  const [menuStyle, setMenuStyle] = useState({});
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const isMobile = useIsMobile();

  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const selectableYears = useMemo(() => {
    if (!isBirthDate) return [];
    const latestYear = effectiveMaxDate?.getFullYear() ?? today.getFullYear();
    const earliestYear = minDate?.getFullYear() ?? latestYear - 120;
    return Array.from(
      { length: Math.max(1, latestYear - earliestYear + 1) },
      (_, index) => latestYear - index,
    );
  }, [effectiveMaxDate, isBirthDate, minDate, today]);

  useEffect(() => {
    // Mobile content is portalled outside containerRef. BottomSheet owns
    // backdrop dismissal there; the desktop outside-click listener would
    // otherwise treat every calendar interaction as an outside click.
    if (!open || isMobile) return undefined;
    function handleClickOutside(e) {
      const insideContainer = containerRef.current && containerRef.current.contains(e.target);
      const insideMenu = menuRef.current && menuRef.current.contains(e.target);
      if (!insideContainer && !insideMenu) {
        setOpen(false);
      }
    }
    function handleEscape(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, isMobile]);

  const updateMenuPosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const width = Math.max(0, Math.min(rect.width, vw - VIEWPORT_MARGIN * 2));
    const spaceBelow = vh - rect.bottom - VIEWPORT_MARGIN;
    const spaceAbove = rect.top - VIEWPORT_MARGIN;
    const menuHeight = menuRef.current?.getBoundingClientRect().height || DEFAULT_CALENDAR_HEIGHT;
    let top;
    let placement;
    if (spaceBelow < menuHeight && spaceAbove > spaceBelow) {
      placement = "top";
      top = rect.top - MENU_GAP;
    } else {
      placement = "bottom";
      top = rect.bottom + MENU_GAP;
    }
    let left = rect.left;
    if (left + width > vw - VIEWPORT_MARGIN) left = vw - width - VIEWPORT_MARGIN;
    if (left < VIEWPORT_MARGIN) left = VIEWPORT_MARGIN;
    const availableHeight = Math.max(
      220,
      placement === "top" ? spaceAbove - MENU_GAP : spaceBelow - MENU_GAP,
    );
    setMenuStyle({ top, left, width, placement, maxHeight: availableHeight });
  }, []);

  useEffect(() => {
    if (!open || isMobile) return undefined;
    updateMenuPosition();
    window.addEventListener("scroll", updateMenuPosition, true);
    window.addEventListener("resize", updateMenuPosition);
    return () => {
      window.removeEventListener("scroll", updateMenuPosition, true);
      window.removeEventListener("resize", updateMenuPosition);
    };
  }, [open, isMobile, updateMenuPosition]);

  useEffect(() => {
    if (selectedDate) setViewDate(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    if (!selectedDate && isBirthDate) setViewDate(initialViewDate);
  }, [initialViewDate, isBirthDate, selectedDate]);

  const selectDate = useCallback((date) => {
    onChange?.(toDateString(date));
    setOpen(false);
  }, [onChange]);

  const goToPrevMonth = useCallback(() => {
    setViewDate((date) => {
      const next = new Date(date.getFullYear(), date.getMonth() - 1, 1);
      if (minDate && next < new Date(minDate.getFullYear(), minDate.getMonth(), 1)) return date;
      return next;
    });
  }, [minDate]);

  const goToNextMonth = useCallback(() => {
    setViewDate((date) => {
      const next = new Date(date.getFullYear(), date.getMonth() + 1, 1);
      if (effectiveMaxDate && next > new Date(effectiveMaxDate.getFullYear(), effectiveMaxDate.getMonth(), 1)) return date;
      return next;
    });
  }, [effectiveMaxDate]);

  const goToPrevYear = useCallback(() => {
    setViewDate((d) => new Date(d.getFullYear() - 1, d.getMonth(), 1));
  }, []);

  const goToNextYear = useCallback(() => {
    setViewDate((d) => new Date(d.getFullYear() + 1, d.getMonth(), 1));
  }, []);

  const isDateDisabled = useCallback((date) => {
    if (minDate && isBeforeDay(date, minDate)) return true;
    if (effectiveMaxDate && isBeforeDay(effectiveMaxDate, date)) return true;
    return false;
  }, [minDate, effectiveMaxDate]);

  const changeViewMonth = useCallback((event) => {
    const nextMonth = Number(event.target.value);
    setViewDate((date) => new Date(date.getFullYear(), nextMonth, 1));
  }, []);

  const changeViewYear = useCallback((event) => {
    const nextYear = Number(event.target.value);
    setViewDate((date) => {
      let nextMonth = date.getMonth();
      if (minDate && nextYear === minDate.getFullYear()) {
        nextMonth = Math.max(nextMonth, minDate.getMonth());
      }
      if (effectiveMaxDate && nextYear === effectiveMaxDate.getFullYear()) {
        nextMonth = Math.min(nextMonth, effectiveMaxDate.getMonth());
      }
      return new Date(nextYear, nextMonth, 1);
    });
  }, [effectiveMaxDate, minDate]);

  const canGoToPreviousMonth = !minDate
    || new Date(viewYear, viewMonth - 1, 1) >= new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  const canGoToNextMonth = !effectiveMaxDate
    || new Date(viewYear, viewMonth + 1, 1) <= new Date(effectiveMaxDate.getFullYear(), effectiveMaxDate.getMonth(), 1);

  const weeks = useMemo(() => {
    const cells = [];
    for (let i = 0; i < firstDay; i++) {
      cells.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(new Date(viewYear, viewMonth, d));
    }
    const rows = [];
    for (let i = 0; i < cells.length; i += 7) {
      rows.push(cells.slice(i, i + 7));
    }
    return rows;
  }, [viewYear, viewMonth, daysInMonth, firstDay]);

  const displayValue = selectedDate
    ? selectedDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "";

  const calendarContent = (
    <>
      <div className={`trem-datepicker__header ${isBirthDate ? "trem-datepicker__header--selectable" : ""}`}>
        {!isBirthDate && (
          <button type="button" className="trem-datepicker__nav-btn" onClick={goToPrevYear} aria-label="Previous year">
            <svg width="14" height="14" viewBox="0 0 14 14"><path d="M9 3L5 7l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><path d="M5 3L1 7l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </button>
        )}
        <button type="button" className="trem-datepicker__nav-btn" onClick={goToPrevMonth} aria-label="Previous month" disabled={!canGoToPreviousMonth}>
          <svg width="14" height="14" viewBox="0 0 14 14"><path d="M9 3L5 7l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
        </button>
        {isBirthDate ? (
          <div className="trem-datepicker__month-year">
            <label>
              <span className="trem-datepicker__visually-hidden">Month</span>
              <select
                className="trem-datepicker__select"
                aria-label="Month"
                value={viewMonth}
                onChange={changeViewMonth}
              >
                {MONTHS.map((month, index) => (
                  <option
                    value={index}
                    key={month}
                    disabled={
                      (minDate && viewYear === minDate.getFullYear() && index < minDate.getMonth())
                      || (effectiveMaxDate && viewYear === effectiveMaxDate.getFullYear() && index > effectiveMaxDate.getMonth())
                    }
                  >
                    {month}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="trem-datepicker__visually-hidden">Year</span>
              <select
                className="trem-datepicker__select trem-datepicker__select--year"
                aria-label="Year"
                value={viewYear}
                onChange={changeViewYear}
              >
                {selectableYears.map((year) => (
                  <option value={year} key={year}>{year}</option>
                ))}
              </select>
            </label>
          </div>
        ) : (
          <span className="trem-datepicker__title">
            {MONTHS[viewMonth]} {viewYear}
          </span>
        )}
        <button type="button" className="trem-datepicker__nav-btn" onClick={goToNextMonth} aria-label="Next month" disabled={!canGoToNextMonth}>
          <svg width="14" height="14" viewBox="0 0 14 14"><path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
        </button>
        {!isBirthDate && (
          <button type="button" className="trem-datepicker__nav-btn" onClick={goToNextYear} aria-label="Next year">
            <svg width="14" height="14" viewBox="0 0 14 14"><path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><path d="M9 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </button>
        )}
      </div>

      <div className="trem-datepicker__weekdays">
        {DAYS.map((d) => (
          <span key={d} className="trem-datepicker__weekday">{d}</span>
        ))}
      </div>

      <div className="trem-datepicker__grid">
        {weeks.map((week, wi) => (
          <div key={wi} className="trem-datepicker__row">
            {week.map((date, di) => {
              if (!date) return <span key={`e-${di}`} className="trem-datepicker__cell trem-datepicker__cell--empty" />;
              const disabled = isDateDisabled(date);
              const selected = isSameDay(date, selectedDate);
              const todayHighlight = isSameDay(date, today);
              return (
                <button
                  key={toDateString(date)}
                  type="button"
                  className={[
                    "trem-datepicker__cell",
                    "trem-datepicker__day",
                    selected ? "trem-datepicker__day--selected" : "",
                    todayHighlight && !selected ? "trem-datepicker__day--today" : "",
                    disabled ? "trem-datepicker__day--disabled" : "",
                  ].filter(Boolean).join(" ")}
                  onClick={() => !disabled && selectDate(date)}
                  disabled={disabled}
                  tabIndex={selected ? 0 : -1}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {!isBirthDate && (
        <div className="trem-datepicker__footer">
          <button type="button" className="trem-datepicker__today-btn" onClick={() => { selectDate(today); setViewDate(today); }}>
            Today
          </button>
        </div>
      )}
    </>
  );

  return (
    <div className={`trem-datepicker ${open ? "trem-datepicker--open" : ""} ${error ? "trem-datepicker--error" : ""} ${className}`} ref={containerRef}>
      <button
        type="button"
        ref={triggerRef}
        className={`trem-datepicker__trigger ${disabled ? "trem-datepicker__trigger--disabled" : ""}`}
        onClick={() => { if (!disabled) setOpen((o) => !o); }}
        disabled={disabled}
      >
        <span className={!displayValue ? "trem-datepicker__placeholder" : ""}>
          {displayValue || placeholder}
        </span>
        <svg className="trem-datepicker__icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.2" />
          <path d="M2 6.5h12" stroke="currentColor" strokeWidth="1.2" />
          <path d="M5.5 1.5v3M10.5 1.5v3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </button>

      {isMobile ? (
        <BottomSheet open={open} onClose={() => setOpen(false)} title={placeholder}>
          <div className="trem-datepicker__calendar-sheet">{calendarContent}</div>
        </BottomSheet>
      ) : (
        open && createPortal(
          <div
            ref={menuRef}
            className={`trem-datepicker__menu-wrapper trem-datepicker__menu-wrapper--${menuStyle.placement || "bottom"}`}
            style={{ top: menuStyle.top, left: menuStyle.left, width: menuStyle.width, maxHeight: menuStyle.maxHeight }}
          >
            <div className="trem-datepicker__dropdown">{calendarContent}</div>
          </div>,
          document.body,
        )
      )}
    </div>
  );
}
