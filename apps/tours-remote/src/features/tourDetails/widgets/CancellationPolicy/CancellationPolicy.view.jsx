import React from "react";

export default function CancellationPolicyView({ labels, policy }) {
  if (!policy) return null;

  return (
    <section className="tour-detail__section">
      <h2>{labels.cancellationPolicy || "Cancellation Policy"}</h2>
      <div className="tour-detail__section-body">
        <p className="tour-detail__policy">{policy}</p>
      </div>
    </section>
  );
}
