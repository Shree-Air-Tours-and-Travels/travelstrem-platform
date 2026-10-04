import { createContext, useContext } from "react";

/**
 * Shared renderer context: root step values drive cross-field conditions;
 * uploader is injected by the host portal for IMAGE_UPLOAD widgets.
 */
export const BuilderContext = createContext({
  rootValues: {},
  uploader: null,
  runtime: {},
});

export const useBuilderContext = () => useContext(BuilderContext);
