import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import DataScopeResolver from "../../shared/utils/dataScopeResolver.js";
import { validatePageContract } from "../../shared/validators/pageContractValidator.js";
import masterDataService from "../masterData/services/masterDataService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, "../../data");

class PageDefinitionService {
    constructor(options = {}) {
        this.dataDir = options.dataDir || DATA_DIR;
        this.resolver = new DataScopeResolver({
            cache: options.cache !== false,
            cacheTtl: options.cacheTtl || 300000,
        });
        this.registry = null;
        this.sharedData = null;
        this.environmentOverrides = options.environmentOverrides || null;
    }

    _readJson(...segments) {
        const filePath = path.resolve(this.dataDir, ...segments);
        const raw = fs.readFileSync(filePath, "utf8");
        return JSON.parse(raw);
    }

    _resolveFilePath(baseFile, relativeFile) {
        if (!relativeFile) return null;
        if (relativeFile.startsWith(".")) return path.resolve(path.dirname(baseFile), relativeFile);
        return path.resolve(this.dataDir, relativeFile);
    }

    _loadWidgetDefinition(pageFile, widgetRef) {
        const filePath = this._resolveFilePath(pageFile, widgetRef);
        if (!filePath) return null;
        const raw = fs.readFileSync(filePath, "utf8");
        return JSON.parse(raw);
    }

    _deepMerge(target = {}, source = {}) {
        const output = { ...(target || {}) };
        Object.entries(source || {}).forEach(([key, value]) => {
            if (
                value &&
                typeof value === "object" &&
                !Array.isArray(value) &&
                output[key] &&
                typeof output[key] === "object" &&
                !Array.isArray(output[key])
            ) {
                output[key] = this._deepMerge(output[key], value);
                return;
            }
            output[key] = value;
        });
        return output;
    }

    _toWidgetEntry(entry = {}, widgetComponent = {}) {
        const structure = widgetComponent?.structure || {};
        const nestedWidgets = structure.widgets;

        if (Array.isArray(nestedWidgets) && nestedWidgets.length) return nestedWidgets;

        if (structure.type || Array.isArray(structure.features)) {
            return [
                {
                    name: entry.name || structure.name || structure.type,
                    type: structure.type || entry.type || entry.name || "Section",
                    source: structure.source || entry.source || "",
                    props: {
                        ...(entry.props || {}),
                        ...(Array.isArray(structure.features)
                            ? { features: structure.features }
                            : {}),
                    },
                },
            ];
        }

        return [entry];
    }

    _expandWidgetRefs(pageDefinition, pageFile) {
        const pageComponent = pageDefinition?.component || {};
        const widgetEntries = pageComponent?.structure?.widgets || [];
        const expandedWidgets = [];
        const widgetContracts = [];

        widgetEntries.forEach((entry) => {
            const widgetRef = entry.widgetRef || entry.path;
            if (!widgetRef) {
                expandedWidgets.push(entry);
                return;
            }
            const widgetDefinition = this._loadWidgetDefinition(pageFile, widgetRef);
            const widgetComponent = widgetDefinition?.component || {};
            widgetContracts.push(widgetComponent);
            expandedWidgets.push(...this._toWidgetEntry(entry, widgetComponent));
        });

        return {
            status: pageDefinition.status,
            component: {
                data: this._deepMerge(
                    pageComponent.data || {},
                    widgetContracts.reduce(
                        (acc, widget) => this._deepMerge(acc, widget?.data || {}),
                        {},
                    ),
                ),
                dataScope: {
                    options: Object.assign(
                        {},
                        pageComponent?.dataScope?.options || {},
                        ...widgetContracts.map((widget) => widget?.dataScope?.options || {}),
                    ),
                    optionSets: Object.assign(
                        {},
                        pageComponent?.dataScope?.optionSets || {},
                        ...widgetContracts.map((widget) => widget?.dataScope?.optionSets || {}),
                    ),
                },
                elements: {
                    labels: Object.assign(
                        {},
                        pageComponent?.elements?.labels || {},
                        ...widgetContracts.map((widget) => widget?.elements?.labels || {}),
                    ),
                    urls: Object.assign(
                        {},
                        pageComponent?.elements?.urls || {},
                        ...widgetContracts.map((widget) => widget?.elements?.urls || {}),
                    ),
                },
                structure: {
                    header: pageComponent?.structure?.header || {},
                    widgets: expandedWidgets,
                    config: {
                        ...(pageComponent?.structure?.config || {}),
                        ...Object.assign(
                            {},
                            ...widgetContracts.map((widget) => widget?.structure?.config || {}),
                        ),
                    },
                    actions: [
                        ...(pageComponent?.structure?.actions || []),
                        ...widgetContracts.flatMap((widget) => widget?.structure?.actions || []),
                    ],
                },
            },
        };
    }

    _loadRegistry() {
        if (!this.registry) {
            this.registry = this._readJson("index.json");
        }
        return this.registry;
    }

    _loadShared() {
        if (!this.sharedData) {
            try {
                this.sharedData = this._readJson("shared", "shared.json");
            } catch {
                this.sharedData = { elements: { labels: {}, urls: {} } };
            }
        }
        return this.sharedData;
    }

    getRegisteredPages() {
        const registry = this._loadRegistry();
        return { ...registry.pages };
    }

    getPathMap() {
        const registry = this._loadRegistry();
        return { ...registry.pathMap };
    }

    getAliases() {
        const registry = this._loadRegistry();
        return { ...registry.aliases };
    }

    resolvePageKey(pageKey) {
        const registry = this._loadRegistry();
        if (registry.pages[pageKey]) return pageKey;

        const alias = registry.aliases[pageKey];
        if (alias && registry.pages[alias]) return alias;

        const pathEntry = registry.pathMap[pageKey];
        if (pathEntry && registry.pages[pathEntry]) return pathEntry;

        return registry.defaultPage || "trevio-remote/home";
    }

    loadPageDefinition(pageKey, overrides = {}) {
        const resolvedKey = this.resolvePageKey(pageKey);
        const registry = this._loadRegistry();
        const entry = registry.pages[resolvedKey];

        if (!entry) {
            throw new Error(`Page definition not found: ${pageKey} (resolved: ${resolvedKey})`);
        }

        let pageDefinition;
        try {
            pageDefinition = this._readJson(entry.file);
        } catch (err) {
            throw new Error(`Failed to load page file for ${resolvedKey}: ${err.message}`);
        }

        const pageFile = path.resolve(this.dataDir, entry.file);
        const expandedPageDefinition = this._expandWidgetRefs(pageDefinition, pageFile);
        const remoteOverrides = overrides.remoteOverrides || {};
        const featureOverrides = overrides.featureOverrides || {};
        const merged = this.resolver.resolve({
            shared: this._loadShared(),
            page: expandedPageDefinition,
            remoteOverrides,
            featureOverrides,
        });
        validatePageContract(merged);

        return {
            pageKey: resolvedKey,
            app: entry.app,
            page: entry.page,
            definition: merged,
        };
    }

    async resolvePage(req, res, pageKey, options = {}) {
        const {
            remoteOverrides,
            featureOverrides,
            injectData,
            injectDataScope,
            injectLabels,
            injectUrls,
            authUser,
            statusCode = 200,
        } = options;

        const resolvedKey = this.resolvePageKey(pageKey);
        const resolved = this.loadPageDefinition(resolvedKey, {
            remoteOverrides,
            featureOverrides,
        });

        const payload = {
            status: resolved.definition.status,
            component: resolved.definition.component,
        };

        if (injectData) {
            payload.component.data = {
                ...payload.component.data,
                ...injectData,
            };
        }
        if (injectDataScope) {
            payload.component.dataScope = {
                ...payload.component.dataScope,
                options: {
                    ...payload.component.dataScope.options,
                    ...injectDataScope.options,
                },
            };
        }

        if (injectLabels) {
            payload.component.elements.labels = {
                ...payload.component.elements.labels,
                ...injectLabels,
            };
        }

        if (injectUrls) {
            payload.component.elements.urls = {
                ...payload.component.elements.urls,
                ...injectUrls,
            };
        }

        payload.component = await masterDataService.hydrateDataScope(payload.component);

        return res.status(statusCode).json(payload);
    }

    buildPageResponse(pageKey, options = {}) {
        const {
            remoteOverrides,
            featureOverrides,
            injectData,
            injectDataScope,
            injectLabels,
            injectUrls,
        } = options;

        const resolvedKey = this.resolvePageKey(pageKey);
        const resolved = this.loadPageDefinition(resolvedKey, {
            remoteOverrides,
            featureOverrides,
        });

        const payload = {
            status: resolved.definition.status,
            component: {
                data: {
                    ...resolved.definition.component.data,
                    ...injectData,
                },
                dataScope: {
                    optionSets: { ...resolved.definition.component.dataScope.optionSets },
                    options: {
                        ...resolved.definition.component.dataScope.options,
                        ...injectDataScope?.options,
                    },
                },
                elements: {
                    labels: {
                        ...resolved.definition.component.elements.labels,
                        ...injectLabels,
                    },
                    urls: {
                        ...resolved.definition.component.elements.urls,
                        ...injectUrls,
                    },
                },
                structure: resolved.definition.component.structure,
            },
        };

        return payload;
    }

    renderLabelsOnly(pageKey, options = {}) {
        const resolved = this.loadPageDefinition(pageKey, options);
        return {
            status: "success",
            component: {
                elements: {
                    labels: resolved.definition.component.elements.labels,
                },
            },
        };
    }

    buildWidgetResponse(pageKey, widgetRef, options = {}) {
        const resolvedKey = this.resolvePageKey(pageKey);
        const registry = this._loadRegistry();
        const entry = registry.pages[resolvedKey];
        const pageFile = path.resolve(this.dataDir, entry.file);
        const widgetDefinition = this._loadWidgetDefinition(pageFile, widgetRef);
        const merged = this.resolver.resolve({
            shared: this._loadShared(),
            page: widgetDefinition,
            remoteOverrides: options.remoteOverrides,
            featureOverrides: options.featureOverrides,
        });
        validatePageContract(merged);
        return {
            status: merged.status,
            component: {
                data: { ...merged.component.data, ...options.injectData },
                dataScope: {
                    optionSets: { ...merged.component.dataScope.optionSets },
                    options: {
                        ...merged.component.dataScope.options,
                        ...options.injectDataScope?.options,
                    },
                },
                elements: {
                    labels: { ...merged.component.elements.labels, ...options.injectLabels },
                    urls: { ...merged.component.elements.urls, ...options.injectUrls },
                },
                structure: merged.component.structure,
            },
        };
    }

    clearCache() {
        this.registry = null;
        this.sharedData = null;
        this.resolver.clearCache();
    }

    reloadRegistry() {
        this.registry = null;
        this.sharedData = null;
        return this._loadRegistry();
    }
}

const singleton = new PageDefinitionService();

export { PageDefinitionService };
export default singleton;
