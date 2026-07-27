import React, { useState, useCallback } from "react";
import { BottomSheet } from "@packages/trem-ui";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

export default function MobileDateInput({ value, onChange, error, placeholder = "Select date" }) {
  const [open, setOpen] = useState(false);
  const parsed = value ? new Date(value) : null;
  const isValid = parsed && !Number.isNaN(parsed.getTime());

  const [selYear, setSelYear] = useState(isValid ? parsed.getFullYear() : 2000);
  const [selMonth, setSelMonth] = useState(isValid ? parsed.getMonth() : 0);
  const [selDay, setSelDay] = useState(isValid ? parsed.getDate() : 1);

  const maxDay = daysInMonth(selYear, selMonth);
  const clampedDay = Math.min(selDay, maxDay);

  const displayValue = isValid
    ? `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`
    : "";

  const handleConfirm = useCallback(() => {
    const d = `${selYear}-${String(selMonth + 1).padStart(2, "0")}-${String(clampedDay).padStart(2, "0")}`;
    onChange?.(d);
    setOpen(false);
  }, [selYear, selMonth, clampedDay, onChange]);

  const openSheet = useCallback(() => {
    if (isValid) {
      setSelYear(parsed.getFullYear());
      setSelMonth(parsed.getMonth());
      setSelDay(parsed.getDate());
    }
    setOpen(true);
  }, [isValid, parsed]);

  const currentYear = new Date().getFullYear();
  const years = [];
  for (let y = currentYear; y >= 1920; y--) years.push(y);

  return (
    <>
      <div className={`booking-page__mobile-date-trigger ${error ? "has-error" : ""}`} onClick={openSheet}>
        <span>{displayValue || placeholder}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
      </div>
      <BottomSheet open={open} onClose={() => setOpen(false)} title="Select Date of Birth">
        <div className="booking-page__dob-picker" onClick={(e) => e.stopPropagation()}>
          <div className="booking-page__dob-row">
            <label>Day</label>
            <select className="booking-page__select" value={clampedDay} onChange={(e) => { e.stopPropagation(); setSelDay(Number(e.target.value)); }}>
              {Array.from({ length: maxDay }, (_, i) => (
                <option key={i + 1} value={i + 1}>{i + 1}</option>
              ))}
            </select>
          </div>
          <div className="booking-page__dob-row">
            <label>Month</label>
            <select className="booking-page__select" value={selMonth} onChange={(e) => { e.stopPropagation(); setSelMonth(Number(e.target.value)); }}>
              {MONTHS.map((m, i) => (
                <option key={i} value={i}>{m}</option>
              ))}
            </select>
          </div>
          <div className="booking-page__dob-row">
            <label>Year</label>
            <select className="booking-page__select" value={selYear} onChange={(e) => { e.stopPropagation(); setSelYear(Number(e.target.value)); }}>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <button className="booking-page__dob-confirm" onClick={handleConfirm}>Confirm</button>
        </div>
      </BottomSheet>
    </>
  );
}
