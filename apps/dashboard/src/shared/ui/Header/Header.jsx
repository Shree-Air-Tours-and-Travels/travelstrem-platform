import React, { useCallback, useMemo } from "react";
import { Header as TremHeader } from "@packages/trem-ui";
import { useSearchParams } from "react-router-dom";
import { useDashboardConfig } from "../../../app/providers/DashboardProvider";
import { emit } from "@packages/trem-events";
import { apiService } from "../../../services/apiService";
import { clearUserSessionCache } from "../../../services/userSession";

const PRODUCT_CATALOG = [
  { key: "trevista", name: "Trevista", url: process.env.REACT_APP_TREVISTA_URL },
  { key: "trevio", name: "Trevio", url: process.env.REACT_APP_TREVIO_URL },
];

const getProductBaseUrl = (productKey) => {
  if (typeof window === "undefined") return "/";
  const product = PRODUCT_CATALOG.find((p) => p.key === productKey);
  if (!product?.url) return "/";
  return product.url;
};

const headerConfig = {
  brand: { label: "TravelsTrem Dashboard", homePath: "/" },
  leftSection: { welcome: true, showStatus: false },
  menu: [],
  authActions: {
    login: { label: "Login", path: "/login" },
    logout: { label: "Logout" },
  },
};

export default function Header() {
  const { session } = useDashboardConfig();
  const [searchParams] = useSearchParams();
  const productFilter = searchParams.get("product") || "all";

  const handleLogout = useCallback(async () => {
    try {
      await apiService.post("/auth/logout");
    } catch {
      // ignore
    }
    clearUserSessionCache();
    emit("USER_LOGOUT");
    window.location.assign("/");
  }, []);

  const handleNavigateHome = useCallback(() => {
    window.location.assign("/");
  }, []);

  const backToProduct = useMemo(() => {
    if (productFilter === "all") return null;
    const product = PRODUCT_CATALOG.find((p) => p.key === productFilter);
    if (!product) return null;
    return {
      key: product.key,
      label: `Back to ${product.name}`,
      url: getProductBaseUrl(product.key),
    };
  }, [productFilter]);

  const handleBackToProduct = useCallback(() => {
    if (backToProduct) {
      window.location.assign(backToProduct.url);
    }
  }, [backToProduct]);

  return (
    <TremHeader
      headerConfig={{
        ...headerConfig,
        brand: { ...headerConfig.brand, onClick: handleNavigateHome },
      }}
      session={session}
      onLogout={handleLogout}
      showFavorites={false}
      theme="light"
    />
  );
}
