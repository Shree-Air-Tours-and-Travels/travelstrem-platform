const { container } = require("webpack");
const ModuleScopePlugin = require("react-dev-utils/ModuleScopePlugin");
const moduleFederationConfig = require("./modulefederation.config");
const path = require("path");

const appSrc = path.resolve(__dirname, "src");
const authTremSrc = path.resolve(__dirname, "../../apps/auth-trem/src");
const sharedPackageSrc = path.resolve(__dirname, "../../packages");
const backendTarget =
    process.env.REACT_APP_BACKEND_URL ||
    process.env.REACT_APP_API_URL?.replace(/\/api\/?$/, "") ||
    "http://localhost:5000";
const toursRemoteTarget =
    process.env.REACT_APP_TOURS_REMOTE_URL ||
    "http://localhost:3001";

function extendBabelIncludes(webpackConfig) {
    const oneOfRule = webpackConfig.module.rules.find((rule) => Array.isArray(rule.oneOf));
    if (!oneOfRule) return;

    oneOfRule.oneOf.forEach((rule) => {
        if (!rule.loader || !rule.loader.includes("babel-loader")) return;
        const include = Array.isArray(rule.include) ? rule.include : rule.include ? [rule.include] : [];
        rule.include = Array.from(new Set([...include, appSrc, authTremSrc, sharedPackageSrc]));
    });
}

module.exports = {
    devServer: (devServerConfig) => {
        devServerConfig.proxy = {
            "/api": {
                target: backendTarget,
                changeOrigin: true,
                secure: false,
            },
        };
        devServerConfig.client = {
            ...(devServerConfig.client || {}),
            overlay: {
                ...(devServerConfig.client?.overlay && typeof devServerConfig.client.overlay === "object"
                    ? devServerConfig.client.overlay
                    : {}),
                runtimeErrors: false,
            },
        };
        devServerConfig.headers = {
            ...(devServerConfig.headers || {}),
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
            "Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization",
        };
        return devServerConfig;
    },
    webpack: {
        configure: (webpackConfig) => {
            webpackConfig.output.publicPath = "/";
            webpackConfig.output.uniqueName = moduleFederationConfig.name;
            webpackConfig.optimization.runtimeChunk = false;
            webpackConfig.resolve.modules = [
                path.resolve(__dirname, ".pnpm-modules"),
                ...(webpackConfig.resolve.modules || ["node_modules"]),
            ];
            webpackConfig.resolve.alias = {
                ...(webpackConfig.resolve.alias || {}),
                "@apps/auth-trem": path.resolve(__dirname, "../../apps/auth-trem/src/public-api.js"),
                "@packages/trem-auth-core": path.resolve(__dirname, "../../packages/trem-auth-core/src"),
                "@packages/trem-ui": path.resolve(__dirname, "../../packages/trem-ui/src"),
                "@packages/trem-utils": path.resolve(__dirname, "../../packages/trem-utils/src"),
                "@packages/trem-widget-contracts": path.resolve(__dirname, "../../packages/trem-widget-contracts/src"),
            };
            webpackConfig.resolve.plugins = (webpackConfig.resolve.plugins || []).filter(
                (plugin) => !(plugin instanceof ModuleScopePlugin)
            );
            extendBabelIncludes(webpackConfig);
            webpackConfig.plugins.push(new container.ModuleFederationPlugin(moduleFederationConfig));
            return webpackConfig;
        },
    },
};
