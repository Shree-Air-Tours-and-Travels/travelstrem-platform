import config from "../config/index.js";

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
            dataScope: {
                options: { ...sharedData?.dataScope?.options },
                optionSets: { ...sharedData?.dataScope?.optionSets },
            },
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
            dataScope: {
                options: { ...component?.dataScope?.options },
                optionSets: { ...component?.dataScope?.optionSets },
            },
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
            dataScope: {
                options: { ...remoteOverrides?.dataScope?.options },
                optionSets: { ...remoteOverrides?.dataScope?.optionSets },
            },
            elements: {
                labels: { ...remoteOverrides?.elements?.labels },
                urls: { ...remoteOverrides?.elements?.urls },
            },
        };
    }

    resolveFeatureOverrides(featureOverrides = {}) {
        return {
            data: { ...featureOverrides?.data },
            dataScope: {
                options: { ...featureOverrides?.dataScope?.options },
                optionSets: { ...featureOverrides?.dataScope?.optionSets },
            },
            elements: {
                labels: { ...featureOverrides?.elements?.labels },
                urls: { ...featureOverrides?.elements?.urls },
            },
            structure: this._deepClone(featureOverrides?.structure || {}),
        };
    }

    mergeLabels(...sources) {
        return Object.assign({}, ...sources.map((s) => s?.elements?.labels || {}));
    }

    mergeUrls(...sources) {
        return Object.assign({}, ...sources.map((s) => s?.elements?.urls || {}));
    }

    mergeOptions(...sources) {
        return Object.assign({}, ...sources.map((s) => s?.dataScope?.options || {}));
    }

    mergeOptionSets(...sources) {
        return Object.assign({}, ...sources.map((s) => s?.dataScope?.optionSets || {}));
    }

    resolve(scopeTree = {}) {
        const shared = this.resolveShared(scopeTree.shared);
        const page = this.resolvePage(scopeTree.page);
        const environment = this.resolveEnvironment();
        const remote = this.resolveRemoteOverrides(scopeTree.remoteOverrides);
        const feature = this.resolveFeatureOverrides(scopeTree.featureOverrides);

        const labels = this.mergeLabels(shared, page, remote, feature, environment);

        const urls = this.mergeUrls(shared, page, remote, feature, environment);
        const options = this.mergeOptions(shared, page, remote, feature, environment);
        const optionSets = this.mergeOptionSets(shared, page, remote, feature, environment);

        return {
            status: "success",
            component: {
                data: {
                    ...page.data,
                    ...feature.data,
                    _meta: {
                        env: environment.env,
                        resolvedAt: new Date().toISOString(),
                    },
                },
                dataScope: { options, optionSets },
                elements: { labels, urls },
                structure: Object.keys(feature.structure).length
                    ? feature.structure
                    : page.structure,
            },
        };
    }

    resolveDataScope(pageDefinition, scopeContext = {}) {
        const { sharedData, remoteOverrides, featureOverrides } = scopeContext;
        const shared = this.resolveShared(sharedData);
        const page = this.resolvePage(pageDefinition);
        const environment = this.resolveEnvironment();
        const remote = this.resolveRemoteOverrides(remoteOverrides);
        const feature = this.resolveFeatureOverrides(featureOverrides);

        const labels = this.mergeLabels(shared, page, remote, feature, environment);
        const urls = this.mergeUrls(shared, page, remote, feature, environment);
        const options = this.mergeOptions(shared, page, remote, feature, environment);
        const optionSets = this.mergeOptionSets(shared, page, remote, feature, environment);

        return {
            shared,
            page,
            environment,
            remote,
            feature,
            mergedLabels: labels,
            mergedUrls: urls,
            mergedOptions: options,
            mergedOptionSets: optionSets,
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
