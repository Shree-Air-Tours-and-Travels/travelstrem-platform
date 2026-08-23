import { getBuilderProcessDefinition } from "../../modules/tours/builder/stepDefinitions.js";

/**
 * Compatibility export for existing process routes. The renderer, builder
 * service and legacy process endpoint now consume one versioned definition.
 */
export const TOUR_BUILDER_PROCESS = Object.freeze(getBuilderProcessDefinition());

export default TOUR_BUILDER_PROCESS;
