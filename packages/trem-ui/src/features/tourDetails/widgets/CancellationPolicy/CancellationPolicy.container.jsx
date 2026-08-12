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
    const widgetProps = widgetData?.structure?.widgets?.[0]?.props || {};
    const config = {
        locale: widgetProps.locale,
        defaultCurrency: widgetProps.defaultCurrency,
        headerIcon: widgetProps.headerIcon,
        policySummaryIcon: widgetProps.policySummaryIcon,
        freeCancellationIcon: widgetProps.freeCancellationIcon,
        refundIcon: widgetProps.refundIcon,
        depositIcon: widgetProps.depositIcon,
        timelineIcon: widgetProps.timelineIcon,
        noteIcon: widgetProps.noteIcon,
        extrasIcon: widgetProps.extrasIcon,
        defaultExtraIcon: widgetProps.defaultExtraIcon,
    };

    if (loading) return <WidgetSkeleton compact />;
    if (error) return <WidgetError message={error} />;
    return <CancellationPolicyView labels={labels} policy={policy} cancellation={cancellation} extras={extras} config={config} />;
}
