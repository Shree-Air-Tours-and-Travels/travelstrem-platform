import React, { useState } from "react";
import { BottomSheet, Button, SubTitle } from "@packages/trem-ui";
import { getLabel } from "./_helpers";

export default function MobileBottomNav({ navigation, labels, activeNav, onNavChange }) {
    const [sheet, setSheet] = useState(null);

    const bookingsItem = (
        navigation.find((s) => s.sectionRef === "menuMain")?.items || []
    ).find((i) => i.id === "bookings");

    const bookingChildActive = bookingsItem?.children?.some((c) => activeNav === c.id);

    const moreSections = navigation
        .map((section) => ({
            ...section,
            items: (section.items || []).filter(
                (i) => !["dashboard", "bookings", "favorites"].includes(i.id)
            ),
        }))
        .filter((s) => s.items.length > 0);

    return (
        <>
            <div className="dashboard-mobile-nav" role="navigation" aria-label="Dashboard sections">
                <Button variant="text" iconLeft="user" text={getLabel(labels, "navDashboard", "Profile")} primaryClassName={activeNav === "dashboard" ? "is-active" : ""} onClick={() => onNavChange("dashboard")} />
                <Button variant="text" iconLeft="suitcase" text={getLabel(labels, "navBookings", "My Bookings")} primaryClassName={bookingChildActive ? "is-active" : ""} onClick={() => setSheet("bookings")} />
                <Button variant="text" iconLeft="moreVertical" text={getLabel(labels, "mobileNavMore", "More")} onClick={() => setSheet("more")} />
            </div>

            <BottomSheet open={sheet === "bookings"} onClose={() => setSheet(null)} title="My Bookings">
                {bookingsItem?.children?.map((child) => (
                    <Button
                        key={child.id}
                        variant="text"
                        iconLeft={child.icon || "compass"}
                        text={getLabel(labels, child.labelRef, child.label)}
                        primaryClassName="dashboard-mobile-sheet-item"
                        onClick={() => { onNavChange(child.id); setSheet(null); }}
                    />
                ))}
            </BottomSheet>

            <BottomSheet open={sheet === "more"} onClose={() => setSheet(null)} title="More">
                {moreSections.map((section) => (
                    <div key={section.sectionRef || section.items?.[0]?.id}>
                        <SubTitle primaryClassname="dashboard-mobile-sheet-section" text={getLabel(labels, section.sectionRef, section.sectionRef)} />
                        {section.items.map((item) => (
                            <Button
                                key={item.id}
                                variant="text"
                                iconLeft={item.icon || "compass"}
                                text={`${getLabel(labels, item.labelRef, item.label)}${item.badge ? ` ${item.badge}` : ""}`}
                                primaryClassName={`dashboard-mobile-sheet-item${item.disabled ? " is-disabled" : ""}`}
                                disabled={item.disabled}
                                onClick={() => {
                                    if (!item.disabled) {
                                        onNavChange(item.id);
                                        setSheet(null);
                                    }
                                }}
                            />
                        ))}
                    </div>
                ))}
            </BottomSheet>
        </>
    );
}
