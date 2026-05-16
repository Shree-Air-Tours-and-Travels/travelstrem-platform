import React, { useState } from "react";
import AboutView from "./About.view";

export default function AboutContainer() {
    const [contactOpen, setContactOpen] = useState(false);

    const mapsHref = "G-108 Shalimar complex, opposite church road, MI road, jaipur"
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              "G-108 Shalimar complex, opposite church road, MI road, jaipur"
          )}`
        : null;

    return (
        <AboutView
            contactOpen={contactOpen}
            setContactOpen={setContactOpen}
            mapsHref={mapsHref}
        />
    );
}
