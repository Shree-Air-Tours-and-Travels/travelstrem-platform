import { SUPPORT_ACTION_TYPE, SUPPORT_ANALYTICS_EVENT } from "@packages/trem-support-contracts";

export const formatDateTime = (date) => date ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(date)) : "";

export const trackSupport = (event, metadata = {}) => {
  if (!Object.values(SUPPORT_ANALYTICS_EVENT).includes(event) || typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("travelstrem:analytics", { detail: { event, metadata } }));
};

export const executeSupportAction = (action, navigate) => {
  const kind = action?.action?.type || action?.type;
  const target = action?.action?.target || action?.target;
  if (!target) return false;
  if ([SUPPORT_ACTION_TYPE.NAVIGATE, SUPPORT_ACTION_TYPE.CREATE_TICKET, SUPPORT_ACTION_TYPE.CANCELLATION, SUPPORT_ACTION_TYPE.REFUND, SUPPORT_ACTION_TYPE.RESCHEDULE].includes(kind)) {
    navigate(target);
    return true;
  }
  if (kind === SUPPORT_ACTION_TYPE.CONTACT || kind === SUPPORT_ACTION_TYPE.DOWNLOAD) {
    window.location.assign(target);
    return true;
  }
  return false;
};
