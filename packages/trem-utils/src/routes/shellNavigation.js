export const SHELL_NAVIGATION_EVENT = "travelstrem:shell-navigate";

export function requestShellNavigation(destination, options = {}) {
  if (typeof window === "undefined") return false;
  window.dispatchEvent(
    new CustomEvent(SHELL_NAVIGATION_EVENT, {
      detail: {
        destination,
        params: options.params || {},
        query: options.query || {},
        replace: Boolean(options.replace),
        target: options.target || "_self",
      },
    }),
  );
  return true;
}
