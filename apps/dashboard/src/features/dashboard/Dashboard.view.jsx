import React, { useMemo } from "react";
import { Dashboard, GlobalLoader } from "@packages/trem-ui";
import "./Dashboard.styles.scss";

const PRODUCT_FILTERS = [
  { id: "all", label: "All Products" },
  { id: "trevista", label: "Trevista" },
  { id: "trevio", label: "Trevio" },
];

const PRODUCT_URLS = {
  trevista: { domain: "trevista.travelstrem.in", port: 3001 },
  trevio: { domain: "trevio.travelstrem.in", port: 3005 },
};

const getProductBaseUrl = (productKey) => {
  if (typeof window === "undefined") return "/";
  const product = PRODUCT_URLS[productKey];
  if (!product) return "/";
  const host = window.location.hostname;
  const parts = host.split(".");
  if (parts.length > 2) {
    return `https://${product.domain}`;
  }
  return `http://localhost:${product.port}`;
};

function ProductFilterBar({ activeFilter, onFilterChange }) {
  return (
    <div className="dashboard-product-filter">
      {PRODUCT_FILTERS.map((filter) => (
        <button
          key={filter.id}
          className={`dashboard-product-filter__btn${activeFilter === filter.id ? " is-active" : ""}`}
          onClick={() => onFilterChange(filter.id)}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}

function BackToProductBanner({ productFilter }) {
  const product = useMemo(() => {
    if (productFilter === "all" || !PRODUCT_URLS[productFilter]) return null;
    return {
      key: productFilter,
      name: PRODUCT_FILTERS.find((f) => f.id === productFilter)?.label || productFilter,
      url: getProductBaseUrl(productFilter),
    };
  }, [productFilter]);

  if (!product) return null;

  return (
    <div className="dashboard-back-to-product">
      <a
        href={product.url}
        className="dashboard-back-to-product__link"
        onClick={(e) => {
          e.preventDefault();
          window.location.assign(product.url);
        }}
      >
        ← Back to {product.name}
      </a>
    </div>
  );
}

export default function DashboardPageView({
  loading,
  error,
  labels,
  widgets,
  options,
  user,
  profile,
  icons,
  onProfileUpdate,
  bookingState,
  bookingQuery,
  onBookingQueryChange,
  favoritesState,
  favoritesChips,
  loadFavorites,
  onSaveProfile,
  onSavePassword,
  onViewTour,
  onViewBooking,
  productFilter,
  onProductFilterChange,
}) {
  if (loading) return <GlobalLoader visible text="Loading dashboard" />;
  if (error) return <main className="dashboard-page dashboard-page--error">Error: {error}</main>;

  return (
    <div className="dashboard-page">
      <BackToProductBanner productFilter={productFilter} />
      <ProductFilterBar activeFilter={productFilter} onFilterChange={onProductFilterChange} />
      <Dashboard
        loading={loading}
        error={error}
        labels={labels}
        widgets={widgets}
        options={options}
        user={user}
        profile={profile}
        icons={icons}
        onProfileUpdate={onProfileUpdate}
        bookingState={bookingState}
        bookingQuery={bookingQuery}
        onBookingQueryChange={onBookingQueryChange}
        favoritesState={favoritesState}
        favoritesChips={favoritesChips}
        loadFavorites={loadFavorites}
        onSaveProfile={onSaveProfile}
        onSavePassword={onSavePassword}
        onViewTour={onViewTour}
        onViewBooking={onViewBooking}
        initialNav="dashboard"
        bannerText="Showing data across all your TravelsTrem products."
      />
    </div>
  );
}
