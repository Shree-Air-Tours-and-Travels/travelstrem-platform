import React from "react";
import { ListBlock, Section } from "../../shared";

export default function InclusionsExclusionsView({ labels, inclusions, exclusions }) {
    return (
        <div className="tour-detail__split">
            <Section title={labels.inclusions || "Included"} className="tour-detail__section--compact">
                <ListBlock items={inclusions} empty="Inclusions will be confirmed before booking." />
            </Section>
            <Section title={labels.exclusions || "Not Included"} className="tour-detail__section--compact">
                <ListBlock items={exclusions} empty="Exclusions will be confirmed before booking." />
            </Section>
        </div>
    );
}

