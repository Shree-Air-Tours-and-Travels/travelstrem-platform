const HOME_DESTINATION = "/?tab=overview";

const getHomeUrl = () =>
  typeof window === "undefined"
    ? HOME_DESTINATION
    : new URL(HOME_DESTINATION, window.location.origin).toString();

let activeReturnTo = getHomeUrl();

export const resolveAuthReturnTo = (destination) =>
  destination?.kind === "remote" && typeof window !== "undefined"
    ? window.location.href
    : getHomeUrl();

export const setActiveAuthReturnTo = (returnTo) => {
  activeReturnTo = returnTo || getHomeUrl();
};

export const getActiveAuthReturnTo = () => activeReturnTo || getHomeUrl();
