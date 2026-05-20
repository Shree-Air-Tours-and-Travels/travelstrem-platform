import React, { useState } from "react";
import { useComponentData } from "@packages/trem-utils";
import AboutView from "./About.view";

export default function AboutContainer() {
    const [contactOpen, setContactOpen] = useState(false);

    const { loading, error, resolvedView } = useComponentData(
        "/pages/customer-shell/about",
        {
            headers: {},
            params: {},
        }
    );

    if (loading) {
        return <AboutView loading error={null} contactOpen={false} />;
    }

    if (error) {
        return <AboutView loading={false} error={error} contactOpen={false} />;
    }

    if (!resolvedView) return null;

    const widget = resolvedView?.structure?.widgets?.[0] || {};
    const aboutProps = widget.props || {};
    const address = aboutProps?.company?.officeAddress || "";
    const mapsHref = address
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
        : null;

    return (
        <AboutView
            loading={false}
            error={null}
            contactOpen={contactOpen}
            setContactOpen={setContactOpen}
            mapsHref={mapsHref}
            aboutProps={aboutProps}
        />
    );
}
