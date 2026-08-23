import React, { useMemo } from "react";
import PropTypes from "prop-types";
import ProductHeader from "./ProductHeader.jsx";

export default function ProductHeaderWithDropdown({
  profile,
  authAction,
  accountItems,
  ...headerProps
}) {
  const accountProfile = useMemo(() => {
    if (!profile) return null;

    const items = [
      {
        id: "account-profile",
        label: profile.menuLabel || "View profile",
        icon: "user",
        onClick: profile.onClick,
      },
      ...accountItems,
      authAction
        ? {
            id: "account-auth",
            label: authAction.label || "Sign out",
            icon: "logout",
            onClick: authAction.onClick,
            disabled: authAction.disabled,
          }
        : null,
    ].filter(Boolean);

    return {
      ...profile,
      variant: "profile",
      items,
      onClick: undefined,
    };
  }, [accountItems, authAction, profile]);

  return (
    <ProductHeader
      {...headerProps}
      profile={accountProfile}
      authAction={accountProfile ? null : authAction}
      className={`trem-product-header--with-dropdown ${headerProps.className || ""}`.trim()}
    />
  );
}

ProductHeaderWithDropdown.propTypes = {
  profile: PropTypes.shape({
    ariaLabel: PropTypes.string,
    avatarUrl: PropTypes.string,
    displayName: PropTypes.string,
    label: PropTypes.string,
    menuLabel: PropTypes.string,
    onClick: PropTypes.func,
  }),
  authAction: PropTypes.shape({
    disabled: PropTypes.bool,
    label: PropTypes.string,
    onClick: PropTypes.func,
  }),
  accountItems: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      label: PropTypes.string.isRequired,
      icon: PropTypes.string,
      onClick: PropTypes.func,
    }),
  ),
};

ProductHeaderWithDropdown.defaultProps = {
  profile: null,
  authAction: null,
  accountItems: [],
};
