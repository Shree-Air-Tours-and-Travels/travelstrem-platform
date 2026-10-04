import React from "react";
import { ConfiguredProductHeader, ProductFooter, ScrollToTopButton } from "@packages/trem-ui";

export default function Shell({ children, headerConfig, userSession, embedded = false, buildAuthAction }) {
  return <>
    {!embedded && <ConfiguredProductHeader config={headerConfig || {}} product="trevio"
      session={userSession} authAction={buildAuthAction(headerConfig, userSession)} />}
    {children}
    {!embedded && <ProductFooter config={headerConfig?.footer} tenantId={headerConfig?.tenantId} />}
    <ScrollToTopButton />
  </>;
}
