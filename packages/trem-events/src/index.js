const DEFAULT_SESSION_KEYS = ["auth_user"];

const createEventBus = (initialOptions = {}) => {
  const listeners = {};
  let clearSessionCache = null;
  let clearAuthHeader = null;
  let eventHandler = null;
  let initialized = false;
  let options = {
    dispatchWindowEvent: "always",
    clearSessionOnLogout: false,
    sessionStorageKeys: DEFAULT_SESSION_KEYS,
    ...initialOptions,
  };

  const configure = (nextOptions = {}) => {
    options = { ...options, ...nextOptions };
  };

  const registerSessionCacheClearer = (clearer) => {
    clearSessionCache = clearer;
  };

  const registerAuthHeaderClearer = (clearer) => {
    clearAuthHeader = clearer;
  };

  const shouldDispatchWindowEvent = (event) =>
    options.dispatchWindowEvent === "always" ||
    (options.dispatchWindowEvent === "when-no-listeners" && !listeners[event]?.length);

  const registerEventHandler = (handler) => {
    eventHandler = typeof handler === "function" ? handler : null;

    return () => {
      if (eventHandler === handler) eventHandler = null;
    };
  };

  const emit = (event, payload, meta = {}) => {
    (listeners[event] || []).forEach((cb) => cb(payload));
    if (!meta.skipController && eventHandler) {
      eventHandler(event, payload, meta);
    }
    if (typeof window !== "undefined" && shouldDispatchWindowEvent(event)) {
      window.dispatchEvent(new CustomEvent(event, { detail: payload }));
    }
  };

  const on = (event, cb) => {
    listeners[event] = [...(listeners[event] || []), cb];

    return () => {
      listeners[event] = (listeners[event] || []).filter((listener) => listener !== cb);
    };
  };

  const clearBrowserSession = () => {
    if (typeof localStorage !== "undefined") {
      options.sessionStorageKeys.forEach((key) => localStorage.removeItem(key));
    }
    clearAuthHeader?.();
    clearSessionCache?.();
  };

  const initEventBus = (nextOptions = {}) => {
    configure(nextOptions);

    if (!initialized && options.clearSessionOnLogout && typeof window !== "undefined") {
      initialized = true;
      on("USER_LOGOUT", clearBrowserSession);
    }

    return { emit, on };
  };

  return {
    configure,
    emit,
    on,
    initEventBus,
    registerEventHandler,
    registerAuthHeaderClearer,
    registerSessionCacheClearer,
  };
};

const defaultEventBus = createEventBus();

const isObject = (value) => value && typeof value === "object" && !Array.isArray(value);
const CLEAR_CONTEXT = "ctx:clear";

const getPathValue = (source, path) => {
  if (!path) return source;
  return String(path)
    .split(".")
    .reduce((value, key) => (value == null ? undefined : value[key]), source);
};

const interpolateValue = (value, payload = {}) => {
  if (typeof value !== "string") return value;

  const exactMatch = value.match(/^\$\{([^}]+)\}$/);
  if (exactMatch) return getPathValue(payload, exactMatch[1]);

  return value.replace(/\$\{([^}]+)\}/g, (_, key) => {
    const nextValue = getPathValue(payload, key);
    return nextValue == null ? "" : String(nextValue);
  });
};

const resolveTemplate = (value, payload = {}) => {
  if (Array.isArray(value)) return value.map((item) => resolveTemplate(item, payload));
  if (!isObject(value)) return interpolateValue(value, payload);

  return Object.entries(value).reduce((acc, [key, entry]) => {
    const nextValue = resolveTemplate(entry, payload);
    if (nextValue === CLEAR_CONTEXT) return acc;
    acc[key] = nextValue;
    return acc;
  }, {});
};

const mergeEventData = (...sources) =>
  sources.reduce((acc, source) => {
    if (!isObject(source)) return acc;

    return {
      ...acc,
      ...source,
      request: {
        ...(acc.request || {}),
        ...(source.request || {}),
        data: {
          ...(acc.request?.data || {}),
          ...(source.request?.data || {}),
        },
        context: {
          ...(acc.request?.context || {}),
          ...(source.request?.context || {}),
        },
      },
      additionalData: {
        ...(acc.additionalData || {}),
        ...(source.additionalData || {}),
      },
    };
  }, {});

const buildEventConfig = (sessionConfig = {}, headerConfig = {}) => {
  const eventConfig = sessionConfig.eventConfig || sessionConfig.events || {};
  const data = eventConfig.data || eventConfig;
  const structure = eventConfig.structure || data.structure || {};
  const elements = eventConfig.elements || data.elements || {};
  const pages = eventConfig.pages || data.pages || data.component?.data?.pages || [];
  const authorization = eventConfig.authorization || data.authorization || {};

  return {
    data,
    pages: Array.isArray(pages) ? pages : [],
    structureEvents: Array.isArray(structure.events) ? structure.events : [],
    urls: {
      ...(elements.urls || {}),
      ...(headerConfig.elements?.urls || {}),
      ...(headerConfig.authActions?.login?.path
        ? { proceedToLogin: headerConfig.authActions.login.path }
        : {}),
      ...(headerConfig.authActions?.logout?.redirectTo
        ? { navigateToLogout: headerConfig.authActions.logout.redirectTo }
        : {}),
    },
    authorization,
    fallbacks: headerConfig.fallbacks || {},
  };
};

const createLookup = (entries = []) =>
  entries.reduce(
    (acc, entry) => {
      if (entry?.event) acc.byEvent[entry.event] = entry;
      if (entry?.pageName) acc.byPage[entry.pageName] = entry;
      return acc;
    },
    { byEvent: {}, byPage: {} },
  );

const shouldRunTranslatedEvent = (event, payload) => {
  if (!event.triggerIf) return true;
  const actualValue = resolveTemplate(event.triggerIf.actualValue, payload);
  const receivedValue = resolveTemplate(event.triggerIf.receivedValue, payload);
  return actualValue === receivedValue;
};

const toLocation = (path, payload = {}) => {
  if (!path) return null;
  const resolvedPath = resolveTemplate(path, payload);
  if (!resolvedPath) return null;
  return String(resolvedPath);
};

export const createPortalEventController = ({
  navigate,
  reload,
  emit: busEmit = defaultEventBus.emit,
  getLocation,
  getSession,
} = {}) => {
  let sessionConfig = {};
  let headerConfig = {};
  let callbackHandlers = {};

  const configure = (nextConfig = {}) => {
    sessionConfig = nextConfig.sessionConfig || sessionConfig || {};
    headerConfig = nextConfig.headerConfig || headerConfig || {};
    callbackHandlers = nextConfig.callbacks || callbackHandlers || {};
  };

  const resolvePage = (eventName, pageName) => {
    const config = buildEventConfig(sessionConfig, headerConfig);
    const lookup = createLookup(config.pages);
    return pageName ? lookup.byPage[pageName] : lookup.byEvent[eventName];
  };

  const isAuthorized = (eventName) => {
    const config = buildEventConfig(sessionConfig, headerConfig);
    if (!Object.prototype.hasOwnProperty.call(config.authorization, eventName)) return true;
    return Boolean(config.authorization[eventName]);
  };

  const buildNavigationState = (eventDefinition, payload = {}, translatedData = {}) => {
    const renderConfig = resolveTemplate(eventDefinition?.renderConfig || {}, payload);
    const eventData = resolveTemplate(translatedData, payload);
    const incomingData = payload?.eventData || payload;
    const mergedEventData = mergeEventData({ request: renderConfig }, eventData, incomingData);

    return {
      event: eventDefinition?.event,
      pageName: eventDefinition?.pageName,
      title: eventDefinition?.title || "",
      data: mergedEventData.request?.data || {},
      context: mergedEventData.request?.context || {},
      additionalData: mergedEventData.additionalData || {},
    };
  };

  const runRedirect = async (eventName, payload = {}, translatedEvent = null) => {
    const config = buildEventConfig(sessionConfig, headerConfig);
    const page = resolvePage(eventName, payload?.pageName);
    const fallbackPage = page?.fallback ? resolvePage(null, page.fallback) : null;
    const path = toLocation(
      payload?.path ||
        translatedEvent?.path ||
        config.urls[eventName] ||
        config.urls[page?.event] ||
        page?.path ||
        fallbackPage?.path ||
        config.urls[fallbackPage?.event] ||
        config.fallbacks.authenticated ||
        "/",
      payload,
    );

    if (!path || typeof navigate !== "function") return false;

    const navigationState = buildNavigationState(
      page || translatedEvent,
      payload,
      translatedEvent?.eventData,
    );

    navigate(path, {
      replace: Boolean(payload?.replace || translatedEvent?.replace),
      state: {
        ...(navigationState.context || {}),
        ...(payload?.state || {}),
        portalEvent: navigationState,
      },
    });
    return true;
  };

  const runReload = async (eventName, payload = {}) => {
    busEmit(eventName, payload, { skipController: true });
    if (typeof reload === "function") {
      await reload({
        forceSession: Boolean(payload?.forceSession),
        location: getLocation?.(),
      });
    }
    return true;
  };

  const runCallback = async (eventDefinition, payload = {}) => {
    const handlerName = eventDefinition?.config?.eventType || eventDefinition?.event;
    const callback = callbackHandlers[handlerName] || callbackHandlers[eventDefinition?.event];
    const resolvedPayload = resolveTemplate(eventDefinition?.eventData || payload || {}, payload);

    if (typeof callback === "function") {
      await callback(resolvedPayload, eventDefinition);
      return true;
    }

    busEmit(eventDefinition?.event || handlerName, resolvedPayload, { skipController: true });
    return true;
  };

  const dispatch = async (eventName, payload = {}, meta = {}) => {
    if (!eventName || !isAuthorized(eventName)) return false;

    const config = buildEventConfig(sessionConfig, headerConfig);
    const structureEvent = config.structureEvents.find((event) => event.event === eventName);
    const pageEvent = resolvePage(eventName, payload?.pageName);
    const eventDefinition = structureEvent || pageEvent || { event: eventName, type: meta.type };
    const type = eventDefinition?.type || pageEvent?.type || meta.type;

    if (type === "translation") {
      const childEvents = eventDefinition?.config?.events || [];
      let handled = false;

      for (const childEvent of childEvents) {
        if (!shouldRunTranslatedEvent(childEvent, payload)) continue;
        const childPayload = mergeEventData(
          payload,
          resolveTemplate(childEvent.eventData || {}, payload),
        );
        handled =
          (await dispatch(childEvent.name, childPayload, { ...meta, type: childEvent.type })) ||
          handled;
      }

      return handled;
    }

    if (type === "redirect") return runRedirect(eventName, payload, eventDefinition);
    if (type === "reload") return runReload(eventName, payload);
    if (type === "sync" || type === "sync_update") {
      busEmit(eventName, payload, { skipController: true });
      return true;
    }
    if (type === "callback") return runCallback(eventDefinition, payload);

    if (pageEvent?.type === "redirect") return runRedirect(eventName, payload, pageEvent);
    return false;
  };

  return {
    configure,
    dispatch,
    handle: dispatch,
    getSession,
  };
};

const configureEventBus = defaultEventBus.configure;
export const emit = defaultEventBus.emit;
export const on = defaultEventBus.on;
export const initEventBus = defaultEventBus.initEventBus;
export const registerEventHandler = defaultEventBus.registerEventHandler;
export const registerAuthHeaderClearer = defaultEventBus.registerAuthHeaderClearer;
export const registerSessionCacheClearer = defaultEventBus.registerSessionCacheClearer;

export {
  TREM_TOAST_EVENT,
  DEFAULT_REALTIME_NOTIFY_EVENTS,
  showRealtimeToast,
  initRealtimeNotifications,
} from "./realtimeNotify.js";

export { RealtimeProvider, useRealtimeContext } from "./realtime/RealtimeProvider.jsx";
export { default as RealtimeProviderDefault } from "./realtime/RealtimeProvider.jsx";
export { default as useRealtime } from "./realtime/useRealtime.js";
export { default as useRealtimeEvent } from "./realtime/useRealtimeEvent.js";
export { default as useRealtimeStatus } from "./realtime/useRealtimeStatus.js";
export { default as useResourceRealtime } from "./realtime/useResourceRealtime.js";
export {
  useBookingRealtime,
  useTourRealtime,
  useTripRealtime,
  useSupportRealtime,
  useEnquiryRealtime,
  useTourCatalogRealtime,
} from "./realtime/domain-hooks.js";
export { REALTIME_EVENTS, REALTIME_RESOURCES, CONNECTION_STATUS } from "./realtime/realtime-types.js";
export { getRealtimeClient, resolveRealtimeUrl } from "./realtime/realtime-client.js";
