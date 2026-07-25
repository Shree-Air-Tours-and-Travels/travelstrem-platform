import { createContext, useContext } from "react";

const ProductDetailContext = createContext({
    apiPrefix: "/tours.json",
    productType: "tour",
});

export const ProductDetailProvider = ProductDetailContext.Provider;

export const useProductDetailContext = () => useContext(ProductDetailContext);

export const WIDGET_API_OPTIONS = {
    tour: { apiPrefix: "/tours.json" },
    trip: { apiPrefix: "/trevio/trips.json" },
};

export default ProductDetailContext;
