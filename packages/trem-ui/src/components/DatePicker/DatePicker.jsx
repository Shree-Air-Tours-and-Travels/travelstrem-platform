import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import "./DatePicker.styles.scss";

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

export default function DatePicker({
  value = "",
  onChange,
  placeholder = "Select date",
  min,
  max,
  disabled = false,
  error,
  className = "",
}) {
  const selectedDate = useMemo(() => parseDate(value), [value]);
  const minDate = useMemo(() => parseDate(min), [min]);
  const maxDate = useMemo(() => parseDate(max), [max]);

  const today = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }, []);

  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => selectedDate || today);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
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
  }, [open]);

  useEffect(() => {
    if (selectedDate) setViewDate(selectedDate);
  }, [selectedDate]);

  const selectDate = useCallback((date) => {
    onChange?.(toDateString(date));
    setOpen(false);
  }, [onChange]);

  const goToPrevMonth = useCallback(() => {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }, []);

  const goToNextMonth = useCallback(() => {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }, []);

  const goToPrevYear = useCallback(() => {
    setViewDate((d) => new Date(d.getFullYear() - 1, d.getMonth(), 1));
  }, []);

  const goToNextYear = useCallback(() => {
    setViewDate((d) => new Date(d.getFullYear() + 1, d.getMonth(), 1));
  }, []);

  const isDateDisabled = useCallback((date) => {
    if (minDate && isBeforeDay(date, minDate)) return true;
    if (maxDate && isBeforeDay(maxDate, date)) return true;
    return false;
  }, [minDate, maxDate]);

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

  return (
    <div className={`trem-datepicker ${open ? "trem-datepicker--open" : ""} ${error ? "trem-datepicker--error" : ""} ${className}`} ref={containerRef}>
      <button
        type="button"
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

      {open && (
        <div className="trem-datepicker__dropdown">
          <div className="trem-datepicker__header">
            <button type="button" className="trem-datepicker__nav-btn" onClick={goToPrevYear} aria-label="Previous year">
              <svg width="14" height="14" viewBox="0 0 14 14"><path d="M9 3L5 7l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><path d="M5 3L1 7l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
            </button>
            <button type="button" className="trem-datepicker__nav-btn" onClick={goToPrevMonth} aria-label="Previous month">
              <svg width="14" height="14" viewBox="0 0 14 14"><path d="M9 3L5 7l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
            </button>
            <span className="trem-datepicker__title">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button type="button" className="trem-datepicker__nav-btn" onClick={goToNextMonth} aria-label="Next month">
              <svg width="14" height="14" viewBox="0 0 14 14"><path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
            </button>
            <button type="button" className="trem-datepicker__nav-btn" onClick={goToNextYear} aria-label="Next year">
              <svg width="14" height="14" viewBox="0 0 14 14"><path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><path d="M9 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
            </button>
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

          <div className="trem-datepicker__footer">
            <button type="button" className="trem-datepicker__today-btn" onClick={() => { selectDate(today); setViewDate(today); }}>
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
