import config from "../config/index.js";

const SCOPE_ORDER = ["environment", "remote", "page", "shared"];

class DataScopeResolver {
  constructor(options = {}) {
    this.cache = options.cache !== false ? new Map() : null;
    this.cacheTtl = options.cacheTtl || 300000;
    this.environmentOverrides = options.environmentOverrides || null;
  }

  _cacheKey(scope, app, page) {
    return `${scope}:${app || ""}:${page || ""}`;
  }

  _cached(key, fetcher) {
    if (!this.cache) return fetcher();
    const entry = this.cache.get(key);
    if (entry && Date.now() - entry.ts < this.cacheTtl) return entry.data;
    const data = fetcher();
    this.cache.set(key, { data, ts: Date.now() });
    return data;
  }

  resolveShared(sharedData = {}) {
    return this._cached("shared", () => ({
      elements: {
        labels: { ...sharedData?.elements?.labels },
        urls: { ...sharedData?.elements?.urls },
      },
    }));
  }

  resolvePage(pageDefinition = {}) {
    const component = pageDefinition?.component || {};
    return {
      data: { ...component?.data },
      elements: {
        labels: { ...component?.elements?.labels },
        urls: { ...component?.elements?.urls },
      },
      structure: this._deepClone(component?.structure || {}),
    };
  }

  resolveEnvironment() {
    if (this.environmentOverrides) return this.environmentOverrides;

    const env = config.NODE_ENV || "development";
    return {
      env,
      isProduction: env === "production",
      isDevelopment: env === "development",
      isStaging: env === "staging",
      baseUrl: config.BASE_URL || "",
      features: {
        debug: config.DEBUG || false,
        enableEmails: config.ENABLE_EMAILS || false,
        devDelayMs: config.DEV_DELAY_MS || 0,
      },
    };
  }

  resolveRemoteOverrides(remoteOverrides = {}) {
    return {
      elements: {
        labels: { ...remoteOverrides?.elements?.labels },
        urls: { ...remoteOverrides?.elements?.urls },
      },
    };
  }

  mergeLabels(...sources) {
    return Object.assign({}, ...sources.map((s) => s?.elements?.labels || {}));
  }

  mergeUrls(...sources) {
    return Object.assign({}, ...sources.map((s) => s?.elements?.urls || {}));
  }

  resolve(scopeTree = {}) {
    const shared = this.resolveShared(scopeTree.shared);
    const page = this.resolvePage(scopeTree.page);
    const environment = this.resolveEnvironment();
    const remote = this.resolveRemoteOverrides(scopeTree.remoteOverrides);

    const labels = this.mergeLabels(
      environment,
      remote,
      page,
      shared
    );

    const urls = this.mergeUrls(
      environment,
      remote,
      page,
      shared
    );

    return {
      status: "success",
      component: {
        data: {
          ...page.data,
          _meta: {
            env: environment.env,
            resolvedAt: new Date().toISOString(),
          },
        },
        elements: { labels, urls },
        structure: page.structure,
      },
    };
  }

  resolveDataScope(pageDefinition, scopeContext = {}) {
    const { sharedData, remoteOverrides } = scopeContext;
    const shared = this.resolveShared(sharedData);
    const page = this.resolvePage(pageDefinition);
    const environment = this.resolveEnvironment();
    const remote = this.resolveRemoteOverrides(remoteOverrides);

    const labels = this.mergeLabels(environment, remote, page, shared);
    const urls = this.mergeUrls(environment, remote, page, shared);

    return {
      shared,
      page,
      environment,
      remote,
      mergedLabels: labels,
      mergedUrls: urls,
    };
  }

  _deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  clearCache() {
    if (this.cache) this.cache.clear();
  }
}

export default DataScopeResolver;
