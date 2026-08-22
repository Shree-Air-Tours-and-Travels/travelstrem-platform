/**
 * @packages/tour-builder — shared, backend-driven Tour Builder.
 *
 * Host portals mount <TourBuilder />; every step, field, validation rule,
 * condition, action and permission arrives from the backend envelope. The
 * renderer understands only generic builder concepts (contract §3).
 */
import TourBuilder from "./components/TourBuilder/TourBuilder.jsx";
export { default as StepRenderer } from "./components/TourBuilder/StepRenderer.jsx";
export { BuilderContext, useBuilderContext } from "./components/TourBuilder/BuilderContext.jsx";

export {
    default as WidgetRenderer,
    widgetRegistry,
    registerWidget,
    getRegisteredTypes,
    joinBase,
    joinBase as joinWidgetPath,
} from "./widgets/WidgetRenderer.jsx";

export { WIDGET_TYPES, BUILDER_ACTIONS, DEFAULT_ACTIONS } from "./constants/widgetTypes.js";
export { tourBuilderApi, configureTourBuilderApi } from "./api/tourBuilderApi.js";
export { default as useTourBuilder } from "./hooks/useTourBuilder.js";
export { default as useStepForm } from "./hooks/useStepForm.js";
export { default as useOptionsSource } from "./hooks/useOptionsSource.js";
export { evaluateCondition } from "./utils/conditions.js";
export { validateWidgets, validateValue } from "./utils/validation.js";
export { getPath, setPath, joinPath as joinPathUtil } from "./utils/paths.js";
export { formatMinor, resolveTierLabel } from "./utils/money.js";

import "./styles/tour-builder.scss";

export default TourBuilder;
