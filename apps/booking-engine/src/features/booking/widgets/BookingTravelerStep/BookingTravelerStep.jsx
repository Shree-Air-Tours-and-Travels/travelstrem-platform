import React, { useMemo } from "react";
import { useComponentData } from "@packages/trem-utils";
import BookingTravelerStepView from "./BookingTravelerStep.view";
import { resolveConfig, PAGE_KEY, WIDGET_ENDPOINT } from "./bookingSchema";

export default function BookingTravelerStep({ config: configOverride = null, labels: pageLabels = {}, options: pageOptions = {}, maxGuests = 10, ...props }) {
  const { componentData, loading } = useComponentData(WIDGET_ENDPOINT, { params: { pageKey: PAGE_KEY } });
  const widgetLabels = componentData?.elements?.labels || {};
  const widgetStructure = componentData?.structure || {};
  const widgetProps = widgetStructure.widgets?.[0]?.props || widgetStructure;

  const labels = useMemo(() => ({ ...widgetLabels, ...pageLabels }), [widgetLabels, pageLabels]);
  const extra = useMemo(() => ({ maxGuests }), [maxGuests]);

  const config = useMemo(() => {
    if (configOverride) return resolveConfig(configOverride, labels, pageOptions, extra);
    return resolveConfig(widgetProps, labels, pageOptions, extra);
  }, [configOverride, widgetProps, labels, pageOptions, extra]);

  return <BookingTravelerStepView {...props} labels={labels} options={pageOptions} config={config} configLoading={loading && !configOverride} />;
}
