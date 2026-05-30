import React from "react";
import { Title, Paragraph } from "@packages/trem-ui";

export default function CancellationPolicyView({ labels, policy }) {
  if (!policy) return null;

  return (
    <section className="tour-detail__section">
      <Title text={labels.cancellationPolicy || "Cancellation Policy"} />
      <div className="tour-detail__section-body">
        <Paragraph primaryClassname="tour-detail__policy" text={policy} />
      </div>
    </section>
  );
}
