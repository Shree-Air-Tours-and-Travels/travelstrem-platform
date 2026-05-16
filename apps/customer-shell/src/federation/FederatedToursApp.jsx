import React from "react";
import FederatedMicroApp from "./FederatedMicroApp";
import { ROUTES } from "@packages/trem-utils";
import { usePortalConfig } from "../app/providers/PortalProvider";
import { getConfiguredRemoteOrigin } from "../core/config/portalEnvironment";

const TOURS_REMOTE_URL = getConfiguredRemoteOrigin("toursTREM");

const TOURS_REMOTE_CONFIG = {
    label: "ToursTREM",
    exportName: "ToursApp",
    remoteUrl: TOURS_REMOTE_URL,
    checkingText: "Checking tours app...",
    loadingText: "Loading tours app...",
    importer: () => import("toursTREM/ToursApp"),
    errorView: {
        title: "Tours workspace unavailable",
        message: "The ToursTREM micro app could not be loaded. Start the tours server and try again.",
        openLabel: "Open ToursTREM",
        remoteUrl: TOURS_REMOTE_URL,
    },
    remoteProps: {
        embedded: true,
        basename: ROUTES.tours,
        basePath: ROUTES.tours,
    },
};

export default function FederatedToursApp() {
    const { headerConfig } = usePortalConfig();
    const remoteConfig = headerConfig?.remotes?.toursTREM || headerConfig?.remotes?.tours || {};
    const remoteUrl = remoteConfig.defaultRemoteUrl || TOURS_REMOTE_URL;
    const fallbackRemoteUrls = Array.isArray(remoteConfig.fallbackRemoteUrls) ? remoteConfig.fallbackRemoteUrls : [];

    return (
        <FederatedMicroApp
            {...TOURS_REMOTE_CONFIG}
            label={remoteConfig.label || TOURS_REMOTE_CONFIG.label}
            exportName={remoteConfig.exportName || TOURS_REMOTE_CONFIG.exportName}
            remoteUrl={remoteUrl}
            fallbackRemoteUrls={fallbackRemoteUrls}
            errorView={{
                ...TOURS_REMOTE_CONFIG.errorView,
                remoteUrl,
            }}
            remoteProps={{
                ...TOURS_REMOTE_CONFIG.remoteProps,
                ...(remoteConfig.remoteProps || {}),
            }}
        />
    );
}
