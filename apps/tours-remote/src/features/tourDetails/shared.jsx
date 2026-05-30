import React from "react";
import { Paragraph } from "@packages/trem-ui";

export const WidgetSkeleton = ({ compact = false }) => (
  <div className={`tour-detail__skeleton${compact ? " tour-detail__skeleton--compact" : ""}`} />
);

export const WidgetError = ({ message = "This section could not load." }) => (
  <Paragraph primaryClassname="tour-detail__muted tour-detail__muted--error" text={message} />
);
