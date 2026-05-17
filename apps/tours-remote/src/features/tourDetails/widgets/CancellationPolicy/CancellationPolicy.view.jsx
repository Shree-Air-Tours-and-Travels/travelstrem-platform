import React from "react";
import { Section } from "../../shared";

export default function CancellationPolicyView({ labels, policy }) {
    if (!policy) return null;

    return (
        <Section title={labels.cancellationPolicy || "Cancellation Policy"}>
            <p className="tour-detail__policy">{policy}</p>
        </Section>
    );
}

