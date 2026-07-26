import React from "react";
import "./Sidebar.scss";

const TABS = [
  { id: "overview", label: "Overview", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4" },
  { id: "bookings", label: "Bookings", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" },
  { id: "favorites", label: "Favorites", icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" },
  { id: "profile", label: "Profile", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
];

const PRODUCTS = [
  { key: "trevio", label: "Trevio", url: process.env.REACT_APP_TREVIO_URL },
  { key: "trevista", label: "Trevista", url: process.env.REACT_APP_TREVISTA_URL },
];

export default function Sidebar({ activeTab, onTabChange, user, isOpen, onClose }) {
  const availableProducts = PRODUCTS.filter((p) => p.url);

  return (
    <aside className={`dash-sidebar ${isOpen ? "is-open" : ""}`}>
      <div className="dsb-brand">
        <img className="dsb-brand__logo" src="/logo-images/logo-icon-only.png" alt="TravelsTrem" width="36" height="36" />
        <div className="dsb-brand__text">
          <span className="dsb-brand__name">TravelsTrem</span>
          <span className="dsb-brand__sub">Dashboard</span>
        </div>
      </div>

      <nav className="dsb-nav">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`dsb-nav__item ${activeTab === tab.id ? "is-active" : ""}`}
            onClick={() => {
              onTabChange(tab.id);
              onClose?.();
            }}
          >
            <svg className="dsb-nav__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d={tab.icon} />
            </svg>
            <span className="dsb-nav__label">{tab.label}</span>
          </button>
        ))}
      </nav>

      {availableProducts.length > 0 && (
        <div className="dsb-products">
          {availableProducts.map((p) => (
            <a key={p.key} className="dsb-product-link" href={p.url}>
              <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back to {p.label}
            </a>
          ))}
        </div>
      )}

      <div className="dsb-footer">
        {user && (
          <div className="dsb-user">
            <div className="dsb-user__avatar">
              {(user.name || user.email || "U").charAt(0).toUpperCase()}
            </div>
            <div className="dsb-user__info">
              <span className="dsb-user__name">{user.name || "User"}</span>
              <span className="dsb-user__email">{user.email || ""}</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
