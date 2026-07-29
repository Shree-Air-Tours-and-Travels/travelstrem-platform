import React from "react";
import "./LoginPrompt.scss";

export default function LoginPrompt({ onLogin }) {
  return (
    <div className="dlp">
      <div className="dlp__card">
        <div className="dlp__icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="32" height="32">
            <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className="dlp__title">Welcome to TravelsTrem</h2>
        <p className="dlp__desc">
          Sign in to view your bookings, manage favorites, and track your travel history.
        </p>
        <button className="dlp__btn" onClick={onLogin}>
          Log in
        </button>
      </div>
    </div>
  );
}
