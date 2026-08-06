import React from "react";
import useTourDetailWidget from "../../hooks/useTourDetailWidget";
import { WidgetError, WidgetSkeleton } from "../../shared";
import CancellationPolicyView from "./CancellationPolicy.view";

export default function CancellationPolicyContainer({ tourRef }) {
    const { loading, error, widgetData } = useTourDetailWidget(tourRef, "cancellation-policy.json");
    const labels = widgetData?.elements?.labels || {};
    const policy = widgetData?.data?.cancellationPolicy || "";
    const cancellation = widgetData?.data?.cancellation || null;
    const extras = Array.isArray(widgetData?.data?.extras) ? widgetData.data.extras : [];

    if (loading) return <WidgetSkeleton compact />;
    if (error) return <WidgetError message={error} />;
    return <CancellationPolicyView labels={labels} policy={policy} cancellation={cancellation} extras={extras} />;
}
