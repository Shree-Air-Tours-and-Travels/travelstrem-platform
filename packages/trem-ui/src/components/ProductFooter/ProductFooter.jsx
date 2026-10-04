import React from "react";
import PropTypes from "prop-types";
import AppFooter from "../AppFooter/AppFooter.jsx";

const DEFAULT_TRAVELS_TREM_CONFIG = {
  brand: "",
  productName: "",
  owner: "",
  description: "",
};

export default function ProductFooter({
  config = {},
  tenantConfig = {},
  clientConfig = {},
  className = "",
  tenantId,
}) {
  const resolvedConfig = {
    ...DEFAULT_TRAVELS_TREM_CONFIG,
    ...tenantConfig,
    ...clientConfig,
    ...config,
  };

  if (resolvedConfig.enabled === false || (tenantId && config?.variant !== "minimal")) return null;

  return <AppFooter className={className} config={resolvedConfig} />;
}

ProductFooter.propTypes = {
  config: PropTypes.object,
  tenantConfig: PropTypes.object,
  clientConfig: PropTypes.object,
  className: PropTypes.string,
  tenantId: PropTypes.string,
};
