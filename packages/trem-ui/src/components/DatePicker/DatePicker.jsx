import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import BottomSheet from "../BottomSheet/BottomSheet.jsx";
import "./DatePicker.styles.scss";

const MENU_GAP = 8;
const VIEWPORT_MARGIN = 12;
const MOBILE_BREAKPOINT = 640;

const MIN_CALENDAR_WIDTH = 260;
const IDEAL_CALENDAR_WIDTH = 308;
const MAX_CALENDAR_WIDTH = 340;
const DEFAULT_CALENDAR_HEIGHT = 350;

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/* ========================================================================== */
/* Icons                                                                      */
/* ========================================================================== */

function ChevronLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M10 3.5 5.5 8 10 12.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="m6 3.5 4.5 4.5L6 12.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect
        x="2.5"
        y="3.5"
        width="13"
        height="12"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.4"
      />

      <path d="M2.5 7h13" stroke="currentColor" strokeWidth="1.4" />

      <path d="M6 2v3M12 2v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />

      <path
        d="M6 10h1M9 10h1M12 10h1M6 13h1M9 13h1"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ========================================================================== */
/* Date helpers                                                               */
/* ========================================================================== */

function toDateString(date) {
  if (!(date instanceof Date)) return "";

  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseDate(value) {
  if (!value) return null;

  const parts = String(value).split("-");

  if (parts.length !== 3) {
    return null;
  }

  const year = Number(parts[0]);
  const month = Number(parts[1]) - 1;
  const day = Number(parts[2]);

  const date = new Date(year, month, day);

  /*
   * Prevent invalid dates such as 2026-02-31
   * from rolling into the following month.
   */
  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function isSameDay(a, b) {
  if (!a || !b) return false;

  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isBeforeDay(a, b) {
  if (!a || !b) return false;

  return startOfDay(a).getTime() < startOfDay(b).getTime();
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function yearPageStartFor(year) {
  return Math.floor(year / 12) * 12;
}

/* ========================================================================== */
/* Responsive helper                                                          */
/* ========================================================================== */

function useIsMobile(breakpoint = MOBILE_BREAKPOINT) {
  const [mobile, setMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth <= breakpoint,
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const query = window.matchMedia(`(max-width: ${breakpoint}px)`);

    const update = () => {
      setMobile(query.matches);
    };

    update();

    query.addEventListener("change", update);

    return () => {
      query.removeEventListener("change", update);
    };
  }, [breakpoint]);

  return mobile;
}

/* ========================================================================== */
/* DatePicker                                                                 */
/* ========================================================================== */

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
  portalZIndex,

  // Backward compatible:
  // existing consumers do not need to pass this.
  allowMonthYearChange = true,
}) {
  const selectedDate = useMemo(() => parseDate(value), [value]);

  const minDate = useMemo(() => parseDate(min), [min]);

  const maxDate = useMemo(() => parseDate(max), [max]);

  const isBirthDate = mode === "birthdate";

  const today = useMemo(() => {
    const now = new Date();

    return startOfDay(now);
  }, []);

  const effectiveMaxDate = useMemo(
    () => maxDate || (isBirthDate ? today : null),
    [isBirthDate, maxDate, today],
  );

  const initialViewDate = useMemo(() => {
    if (selectedDate) {
      return startOfMonth(selectedDate);
    }

    if (isBirthDate) {
      return new Date(today.getFullYear() - 25, today.getMonth(), 1);
    }

    if (minDate && isBeforeDay(today, minDate)) {
      return startOfMonth(minDate);
    }

    if (effectiveMaxDate && isBeforeDay(effectiveMaxDate, today)) {
      return startOfMonth(effectiveMaxDate);
    }

    return startOfMonth(today);
  }, [effectiveMaxDate, isBirthDate, minDate, selectedDate, today]);

  const [open, setOpen] = useState(false);

  const [viewDate, setViewDate] = useState(initialViewDate);

  /*
   * days
   * months
   * years
   */
  const [pickerView, setPickerView] = useState("days");

  const [yearPageStart, setYearPageStart] = useState(() =>
    yearPageStartFor(initialViewDate.getFullYear()),
  );

  const [menuStyle, setMenuStyle] = useState({});

  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const isMobile = useIsMobile();

  const viewYear = viewDate.getFullYear();

  const viewMonth = viewDate.getMonth();

  /* ======================================================================== */
  /* Year bounds                                                              */
  /* ======================================================================== */

  const yearBounds = useMemo(() => {
    const currentYear = today.getFullYear();

    let earliestYear;
    let latestYear;

    if (isBirthDate) {
      earliestYear = minDate?.getFullYear() ?? currentYear - 120;

      latestYear = effectiveMaxDate?.getFullYear() ?? currentYear;
    } else {
      earliestYear = minDate?.getFullYear() ?? currentYear - 100;

      latestYear = effectiveMaxDate?.getFullYear() ?? currentYear + 50;
    }

    return {
      earliestYear,
      latestYear,
    };
  }, [effectiveMaxDate, isBirthDate, minDate, today]);

  const { earliestYear, latestYear } = yearBounds;

  /* ======================================================================== */
  /* Date constraints                                                         */
  /* ======================================================================== */

  const isDateDisabled = useCallback(
    (date) => {
      if (minDate && isBeforeDay(date, minDate)) {
        return true;
      }

      if (effectiveMaxDate && isBeforeDay(effectiveMaxDate, date)) {
        return true;
      }

      return false;
    },
    [effectiveMaxDate, minDate],
  );

  const todayDisabled = isDateDisabled(today);

  const clampMonthForYear = useCallback(
    (year, proposedMonth) => {
      let nextMonth = proposedMonth;

      if (minDate && year === minDate.getFullYear()) {
        nextMonth = Math.max(nextMonth, minDate.getMonth());
      }

      if (effectiveMaxDate && year === effectiveMaxDate.getFullYear()) {
        nextMonth = Math.min(nextMonth, effectiveMaxDate.getMonth());
      }

      return nextMonth;
    },
    [effectiveMaxDate, minDate],
  );

  const monthIsDisabled = useCallback(
    (month) => {
      if (minDate && viewYear === minDate.getFullYear() && month < minDate.getMonth()) {
        return true;
      }

      if (
        effectiveMaxDate &&
        viewYear === effectiveMaxDate.getFullYear() &&
        month > effectiveMaxDate.getMonth()
      ) {
        return true;
      }

      return false;
    },
    [effectiveMaxDate, minDate, viewYear],
  );

  /* ======================================================================== */
  /* Calendar days                                                            */
  /* ======================================================================== */

  const calendarDays = useMemo(() => {
    const firstOfMonth = new Date(viewYear, viewMonth, 1);

    const startOffset = firstOfMonth.getDay();

    const firstVisibleDate = new Date(viewYear, viewMonth, 1 - startOffset);

    /*
     * Always render exactly 42 cells.
     * This keeps calendar height stable.
     */
    return Array.from(
      { length: 42 },
      (_, index) =>
        new Date(
          firstVisibleDate.getFullYear(),
          firstVisibleDate.getMonth(),
          firstVisibleDate.getDate() + index,
        ),
    );
  }, [viewMonth, viewYear]);

  const weeks = useMemo(() => {
    const result = [];

    for (let index = 0; index < 42; index += 7) {
      result.push(calendarDays.slice(index, index + 7));
    }

    return result;
  }, [calendarDays]);

  /* ======================================================================== */
  /* Focusable calendar day                                                   */
  /* ======================================================================== */

  const focusableDateKey = useMemo(() => {
    if (
      selectedDate &&
      selectedDate.getFullYear() === viewYear &&
      selectedDate.getMonth() === viewMonth &&
      !isDateDisabled(selectedDate)
    ) {
      return toDateString(selectedDate);
    }

    if (
      today.getFullYear() === viewYear &&
      today.getMonth() === viewMonth &&
      !isDateDisabled(today)
    ) {
      return toDateString(today);
    }

    const firstEnabled = calendarDays.find(
      (date) =>
        date.getFullYear() === viewYear && date.getMonth() === viewMonth && !isDateDisabled(date),
    );

    return firstEnabled ? toDateString(firstEnabled) : "";
  }, [calendarDays, isDateDisabled, selectedDate, today, viewMonth, viewYear]);

  /* ======================================================================== */
  /* Sync external value                                                      */
  /* ======================================================================== */

  useEffect(() => {
    if (selectedDate) {
      setViewDate(startOfMonth(selectedDate));

      setYearPageStart(yearPageStartFor(selectedDate.getFullYear()));
    }
  }, [selectedDate]);

  useEffect(() => {
    if (!selectedDate && !open) {
      setViewDate(initialViewDate);

      setYearPageStart(yearPageStartFor(initialViewDate.getFullYear()));
    }
  }, [initialViewDate, open, selectedDate]);

  /* ======================================================================== */
  /* Open / close                                                             */
  /* ======================================================================== */

  const close = useCallback(() => {
    setOpen(false);
    setPickerView("days");
  }, []);

  const toggleOpen = useCallback(() => {
    if (disabled) return;

    setOpen((current) => {
      const next = !current;

      if (next) {
        setPickerView("days");

        setYearPageStart(yearPageStartFor(viewDate.getFullYear()));
      }

      return next;
    });
  }, [disabled, viewDate]);

  /* ======================================================================== */
  /* Outside click / Escape                                                   */
  /* ======================================================================== */

  useEffect(() => {
    if (!open || isMobile) {
      return undefined;
    }

    const handleMouseDown = (event) => {
      const insideContainer = containerRef.current?.contains(event.target);

      const insideMenu = menuRef.current?.contains(event.target);

      if (!insideContainer && !insideMenu) {
        close();
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        close();

        triggerRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handleMouseDown);

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleMouseDown);

      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [close, isMobile, open]);

  /* ======================================================================== */
  /* Responsive desktop positioning                                           */
  /* ======================================================================== */

  const updateMenuPosition = useCallback(() => {
    if (typeof window === "undefined" || !triggerRef.current || isMobile) {
      return;
    }

    const rect = triggerRef.current.getBoundingClientRect();

    const viewportWidth = window.innerWidth;

    const viewportHeight = window.innerHeight;

    const availableWidth = Math.max(0, viewportWidth - VIEWPORT_MARGIN * 2);

    /*
     * Calendar does NOT blindly match
     * a small input width.
     */
    let desiredWidth;

    if (rect.width >= MIN_CALENDAR_WIDTH) {
      desiredWidth = Math.min(rect.width, MAX_CALENDAR_WIDTH);
    } else {
      desiredWidth = IDEAL_CALENDAR_WIDTH;
    }

    const width = Math.min(desiredWidth, availableWidth);

    const spaceBelow = viewportHeight - rect.bottom - VIEWPORT_MARGIN;

    const spaceAbove = rect.top - VIEWPORT_MARGIN;

    /*
     * Prefer whichever side actually
     * has more usable space.
     */
    const placement =
      spaceBelow >= DEFAULT_CALENDAR_HEIGHT || spaceBelow >= spaceAbove ? "bottom" : "top";

    const actualAvailableHeight =
      placement === "top" ? spaceAbove - MENU_GAP : spaceBelow - MENU_GAP;

    /*
     * We never enable scrolling.
     *
     * Instead the calendar cells and fonts
     * become smaller when available space
     * becomes constrained.
     */
    const safeAvailableHeight = Math.max(175, actualAvailableHeight);

    const padding = Math.round(clamp(width * 0.035, 6, 12));

    const cellFromWidth = (width - padding * 2 - 12) / 7;

    const cellFromHeight = (safeAvailableHeight - 88) / 6;

    const cellSize = Math.floor(clamp(Math.min(cellFromWidth, cellFromHeight), 20, 36));

    const dayFontSize = clamp(cellSize * 0.37, 9.5, 13);

    const weekdayFontSize = clamp(cellSize * 0.3, 8.5, 11);

    const controlHeight = Math.round(clamp(cellSize, 27, 34));

    const optionHeight = Math.round(clamp(cellSize * 1.15, 30, 40));

    const gridGap = cellSize <= 25 ? 1 : 2;

    /*
     * Centre the popup around the trigger
     * instead of always left-aligning it.
     */
    let left = rect.left + rect.width / 2 - width / 2;

    left = clamp(left, VIEWPORT_MARGIN, viewportWidth - width - VIEWPORT_MARGIN);

    const top = placement === "top" ? rect.top - MENU_GAP : rect.bottom + MENU_GAP;

    setMenuStyle({
      top,
      left,
      width,
      placement,

      "--dp-cell-size": `${cellSize}px`,

      "--dp-day-font-size": `${dayFontSize}px`,

      "--dp-weekday-font-size": `${weekdayFontSize}px`,

      "--dp-control-height": `${controlHeight}px`,

      "--dp-option-height": `${optionHeight}px`,

      "--dp-padding": `${padding}px`,

      "--dp-grid-gap": `${gridGap}px`,
    });
  }, [isMobile]);

  useEffect(() => {
    if (!open || isMobile) {
      return undefined;
    }

    updateMenuPosition();

    window.addEventListener("scroll", updateMenuPosition, true);

    window.addEventListener("resize", updateMenuPosition);

    let resizeObserver;

    if (typeof ResizeObserver !== "undefined" && triggerRef.current) {
      resizeObserver = new ResizeObserver(updateMenuPosition);

      resizeObserver.observe(triggerRef.current);
    }

    return () => {
      window.removeEventListener("scroll", updateMenuPosition, true);

      window.removeEventListener("resize", updateMenuPosition);

      resizeObserver?.disconnect();
    };
  }, [isMobile, open, updateMenuPosition]);

  /* ======================================================================== */
  /* Selection                                                                */
  /* ======================================================================== */

  const selectDate = useCallback(
    (date) => {
      if (!date || isDateDisabled(date)) {
        return;
      }

      onChange?.(toDateString(date));

      setViewDate(startOfMonth(date));

      close();
    },
    [close, isDateDisabled, onChange],
  );

  /* ======================================================================== */
  /* Month navigation                                                         */
  /* ======================================================================== */

  const canGoToPreviousMonth = useMemo(() => {
    if (!minDate) return true;

    const previousMonth = new Date(viewYear, viewMonth - 1, 1);

    return previousMonth >= startOfMonth(minDate);
  }, [minDate, viewMonth, viewYear]);

  const canGoToNextMonth = useMemo(() => {
    if (!effectiveMaxDate) {
      return true;
    }

    const nextMonth = new Date(viewYear, viewMonth + 1, 1);

    return nextMonth <= startOfMonth(effectiveMaxDate);
  }, [effectiveMaxDate, viewMonth, viewYear]);

  const goToPreviousMonth = useCallback(() => {
    if (!canGoToPreviousMonth) {
      return;
    }

    setViewDate((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1));
  }, [canGoToPreviousMonth]);

  const goToNextMonth = useCallback(() => {
    if (!canGoToNextMonth) {
      return;
    }

    setViewDate((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1));
  }, [canGoToNextMonth]);

  /* ======================================================================== */
  /* Year navigation                                                          */
  /* ======================================================================== */

  const canGoToPreviousYear = viewYear > earliestYear;

  const canGoToNextYear = viewYear < latestYear;

  const goToPreviousYear = useCallback(() => {
    if (!canGoToPreviousYear) {
      return;
    }

    setViewDate((current) => {
      const nextYear = current.getFullYear() - 1;

      return new Date(nextYear, clampMonthForYear(nextYear, current.getMonth()), 1);
    });
  }, [canGoToPreviousYear, clampMonthForYear]);

  const goToNextYear = useCallback(() => {
    if (!canGoToNextYear) {
      return;
    }

    setViewDate((current) => {
      const nextYear = current.getFullYear() + 1;

      return new Date(nextYear, clampMonthForYear(nextYear, current.getMonth()), 1);
    });
  }, [canGoToNextYear, clampMonthForYear]);

  /* ======================================================================== */
  /* Year page                                                                */
  /* ======================================================================== */

  const yearPage = useMemo(
    () => Array.from({ length: 12 }, (_, index) => yearPageStart + index),
    [yearPageStart],
  );

  const firstYearPage = yearPageStartFor(earliestYear);

  const lastYearPage = yearPageStartFor(latestYear);

  const canGoPreviousYearPage = yearPageStart > firstYearPage;

  const canGoNextYearPage = yearPageStart < lastYearPage;

  const isYearDisabled = useCallback(
    (year) => year < earliestYear || year > latestYear,
    [earliestYear, latestYear],
  );

  /* ======================================================================== */
  /* Header navigation                                                        */
  /* ======================================================================== */

  const goPrevious = useCallback(() => {
    if (pickerView === "years") {
      if (canGoPreviousYearPage) {
        setYearPageStart((current) => current - 12);
      }

      return;
    }

    if (pickerView === "months") {
      goToPreviousYear();
      return;
    }

    goToPreviousMonth();
  }, [canGoPreviousYearPage, goToPreviousMonth, goToPreviousYear, pickerView]);

  const goNext = useCallback(() => {
    if (pickerView === "years") {
      if (canGoNextYearPage) {
        setYearPageStart((current) => current + 12);
      }

      return;
    }

    if (pickerView === "months") {
      goToNextYear();
      return;
    }

    goToNextMonth();
  }, [canGoNextYearPage, goToNextMonth, goToNextYear, pickerView]);

  const canGoPrevious =
    pickerView === "years"
      ? canGoPreviousYearPage
      : pickerView === "months"
        ? canGoToPreviousYear
        : canGoToPreviousMonth;

  const canGoNext =
    pickerView === "years"
      ? canGoNextYearPage
      : pickerView === "months"
        ? canGoToNextYear
        : canGoToNextMonth;

  /* ======================================================================== */
  /* Display                                                                  */
  /* ======================================================================== */

  const displayValue = selectedDate
    ? selectedDate.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

  /* ======================================================================== */
  /* Header centre                                                            */
  /* ======================================================================== */

  const renderHeaderPeriod = () => {
    if (!allowMonthYearChange) {
      return (
        <span className="trem-datepicker__title">
          {MONTHS[viewMonth]} {viewYear}
        </span>
      );
    }

    if (pickerView === "years") {
      return (
        <button
          type="button"
          className="trem-datepicker__period-range"
          onClick={() => setPickerView("days")}
          aria-label="Return to calendar"
        >
          {yearPageStart}
          {" – "}
          {yearPageStart + 11}
        </button>
      );
    }

    if (pickerView === "months") {
      return (
        <button
          type="button"
          className="trem-datepicker__period-btn trem-datepicker__period-btn--single"
          onClick={() => {
            setYearPageStart(yearPageStartFor(viewYear));

            setPickerView("years");
          }}
        >
          {viewYear}
        </button>
      );
    }

    return (
      <div className="trem-datepicker__period">
        <button
          type="button"
          className="trem-datepicker__period-btn trem-datepicker__period-btn--month"
          onClick={() => setPickerView("months")}
        >
          {MONTHS[viewMonth]}
        </button>

        <button
          type="button"
          className="trem-datepicker__period-btn trem-datepicker__period-btn--year"
          onClick={() => {
            setYearPageStart(yearPageStartFor(viewYear));

            setPickerView("years");
          }}
        >
          {viewYear}
        </button>
      </div>
    );
  };

  /* ======================================================================== */
  /* Month picker                                                             */
  /* ======================================================================== */

  const monthPicker = (
    <div
      className="trem-datepicker__month-grid"
      role="grid"
      aria-label={`Select month for ${viewYear}`}
    >
      {MONTHS.map((month, index) => {
        const selected = index === viewMonth;

        const monthDisabled = monthIsDisabled(index);

        return (
          <button
            key={month}
            type="button"
            role="gridcell"
            aria-selected={selected}
            disabled={monthDisabled}
            className={["trem-datepicker__month-option", selected ? "is-selected" : ""]
              .filter(Boolean)
              .join(" ")}
            onClick={() => {
              if (monthDisabled) {
                return;
              }

              setViewDate(new Date(viewYear, index, 1));

              setPickerView("days");
            }}
          >
            {/*
                Full month name.
                No Jan / Feb / Sep truncation.
              */}
            {month}
          </button>
        );
      })}
    </div>
  );

  /* ======================================================================== */
  /* Year picker                                                              */
  /* ======================================================================== */

  const yearPicker = (
    <div className="trem-datepicker__year-grid" role="grid" aria-label="Select year">
      {yearPage.map((year) => {
        const yearDisabled = isYearDisabled(year);

        const selected = year === viewYear;

        return (
          <button
            key={year}
            type="button"
            role="gridcell"
            disabled={yearDisabled}
            aria-selected={selected}
            className={["trem-datepicker__year-option", selected ? "is-selected" : ""]
              .filter(Boolean)
              .join(" ")}
            onClick={() => {
              if (yearDisabled) {
                return;
              }

              setViewDate(
                (current) => new Date(year, clampMonthForYear(year, current.getMonth()), 1),
              );

              setPickerView("days");
            }}
          >
            {year}
          </button>
        );
      })}
    </div>
  );

  /* ======================================================================== */
  /* Day calendar                                                             */
  /* ======================================================================== */

  const dayPicker = (
    <>
      <div className="trem-datepicker__weekdays" aria-hidden="true">
        {DAYS.map((day) => (
          <span key={day} className="trem-datepicker__weekday">
            {day}
          </span>
        ))}
      </div>

      <div
        className="trem-datepicker__grid"
        role="grid"
        aria-label={`${MONTHS[viewMonth]} ${viewYear}`}
      >
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="trem-datepicker__row" role="row">
            {week.map((date) => {
              const dateKey = toDateString(date);

              const outsideMonth = date.getFullYear() !== viewYear || date.getMonth() !== viewMonth;

              const dateDisabled = isDateDisabled(date);

              const selected = isSameDay(date, selectedDate);

              const isToday = isSameDay(date, today);

              return (
                <button
                  key={dateKey}
                  type="button"
                  role="gridcell"
                  className={[
                    "trem-datepicker__cell",
                    "trem-datepicker__day",

                    outsideMonth ? "trem-datepicker__day--outside" : "",

                    selected ? "trem-datepicker__day--selected" : "",

                    isToday && !selected ? "trem-datepicker__day--today" : "",

                    dateDisabled ? "trem-datepicker__day--disabled" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  disabled={dateDisabled}
                  aria-selected={selected}
                  aria-current={isToday ? "date" : undefined}
                  aria-label={date.toLocaleDateString("en-IN", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                  tabIndex={dateKey === focusableDateKey ? 0 : -1}
                  onClick={() => selectDate(date)}
                >
                  <span>{date.getDate()}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </>
  );

  /* ======================================================================== */
  /* Complete calendar                                                        */
  /* ======================================================================== */

  const calendarContent = (
    <>
      <div className="trem-datepicker__header">
        <button
          type="button"
          className="trem-datepicker__nav-btn"
          onClick={goPrevious}
          disabled={!canGoPrevious}
          aria-label={
            pickerView === "years"
              ? "Previous years"
              : pickerView === "months"
                ? "Previous year"
                : "Previous month"
          }
        >
          <ChevronLeftIcon />
        </button>

        <div className="trem-datepicker__header-center">{renderHeaderPeriod()}</div>

        <button
          type="button"
          className="trem-datepicker__nav-btn"
          onClick={goNext}
          disabled={!canGoNext}
          aria-label={
            pickerView === "years"
              ? "Next years"
              : pickerView === "months"
                ? "Next year"
                : "Next month"
          }
        >
          <ChevronRightIcon />
        </button>
      </div>

      <div className="trem-datepicker__content">
        {pickerView === "months" ? monthPicker : pickerView === "years" ? yearPicker : dayPicker}
      </div>

      {!isBirthDate && pickerView === "days" ? (
        <div className="trem-datepicker__footer">
          <button
            type="button"
            className="trem-datepicker__today-btn"
            disabled={todayDisabled}
            onClick={() => selectDate(today)}
          >
            <CalendarIcon />

            <span>Today</span>
          </button>
        </div>
      ) : null}
    </>
  );

  /* ======================================================================== */
  /* Render                                                                   */
  /* ======================================================================== */

  return (
    <div
      ref={containerRef}
      className={[
        "trem-datepicker",

        open ? "trem-datepicker--open" : "",

        error ? "trem-datepicker--error" : "",

        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <button
        type="button"
        ref={triggerRef}
        className={[
          "trem-datepicker__trigger",

          disabled ? "trem-datepicker__trigger--disabled" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        onClick={toggleOpen}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-invalid={Boolean(error)}
      >
        <span className={displayValue ? "trem-datepicker__value" : "trem-datepicker__placeholder"}>
          {displayValue || placeholder}
        </span>

        <span className="trem-datepicker__trigger-icon" aria-hidden="true">
          <CalendarIcon />
        </span>
      </button>

      {isMobile ? (
        <BottomSheet open={open} onClose={close} title={placeholder} zIndex={portalZIndex}>
          <div className="trem-datepicker__calendar-sheet">{calendarContent}</div>
        </BottomSheet>
      ) : (
        open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            className={[
              "trem-datepicker__menu-wrapper",

              `trem-datepicker__menu-wrapper--${menuStyle.placement || "bottom"}`,
            ].join(" ")}
            style={{ ...menuStyle, ...(portalZIndex != null ? { zIndex: portalZIndex } : {}) }}
          >
            <div className="trem-datepicker__dropdown">{calendarContent}</div>
          </div>,
          document.body,
        )
      )}
    </div>
  );
}
