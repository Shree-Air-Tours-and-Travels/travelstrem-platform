import React from "react";
import Button from "../../components/Button/Button.jsx";
import Paragraph from "../../components/Paragraph/Paragraph.jsx";

export const WidgetSkeleton = ({ compact = false }) => (
  <div className={`tour-detail__skeleton${compact ? " tour-detail__skeleton--compact" : ""}`} />
);

export const WidgetError = ({ message = "This section could not load.", retry }) => (
  <div className="tour-detail__widget-error" role="alert">
    <Paragraph primaryClassname="tour-detail__muted tour-detail__muted--error" text={message} />
    {retry ? (
      <Button size="small" variant="outline" onClick={retry}>
        Retry
      </Button>
    ) : null}
  </div>
);
