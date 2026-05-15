import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import DataScopeResolver from "../utils/dataScopeResolver.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, "../data");

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

  _loadRegistry() {
    if (!this.registry) {
      this.registry = this._readJson("index.json");
    }
    return this.registry;
  }

  _loadShared() {
    if (!this.sharedData) {
      try {
        this.sharedData = this._readJson("shared.json");
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

    return registry.defaultPage || "customer-shell/home";
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

    const remoteOverrides = overrides.remoteOverrides || {};
    const merged = this.resolver.resolve({
      shared: this._loadShared(),
      page: pageDefinition,
      remoteOverrides,
    });

    return {
      pageKey: resolvedKey,
      app: entry.app,
      page: entry.page,
      definition: merged,
    };
  }

  resolvePage(req, res, pageKey, options = {}) {
    const {
      remoteOverrides,
      injectData,
      injectLabels,
      injectUrls,
      statusCode = 200,
    } = options;

    const resolvedKey = this.resolvePageKey(pageKey);
    const resolved = this.loadPageDefinition(resolvedKey, { remoteOverrides });

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

    return res.status(statusCode).json(payload);
  }

  buildPageResponse(pageKey, options = {}) {
    const {
      remoteOverrides,
      injectData,
      injectLabels,
      injectUrls,
    } = options;

    const resolvedKey = this.resolvePageKey(pageKey);
    const resolved = this.loadPageDefinition(resolvedKey, { remoteOverrides });

    const payload = {
      status: resolved.definition.status,
      component: {
        data: {
          ...resolved.definition.component.data,
          ...injectData,
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
