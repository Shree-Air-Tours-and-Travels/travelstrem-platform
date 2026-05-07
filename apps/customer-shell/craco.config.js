const path = require("path");
const { container } = require("webpack");
const ModuleScopePlugin = require("react-dev-utils/ModuleScopePlugin");
const moduleFederationConfig = require("./modulefederation.config");

const backendTarget =
    process.env.REACT_APP_BACKEND_URL ||
    process.env.REACT_APP_API_URL?.replace(/\/api\/?$/, "") ||
    "http://localhost:5000";

const appSrc = path.resolve(__dirname, "src");
const sharedPackageSrc = path.resolve(__dirname, "../../packages");

function extendBabelIncludes(webpackConfig) {
    const oneOfRule = webpackConfig.module.rules.find((rule) => Array.isArray(rule.oneOf));
    if (!oneOfRule) return;

    oneOfRule.oneOf.forEach((rule) => {
        if (!rule.loader || !rule.loader.includes("babel-loader")) return;

        if (Array.isArray(rule.include)) {
            rule.include = Array.from(new Set([...rule.include, appSrc, sharedPackageSrc]));
            return;
        }

        if (rule.include) {
            rule.include = [rule.include, appSrc, sharedPackageSrc];
        }
    });
}

module.exports = {
    devServer: (devServerConfig) => {
        devServerConfig.proxy = {
            "/api": {
                target: backendTarget,
                changeOrigin: true,
                secure: false,
                ws: false,
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
            webpackConfig.output.publicPath = "auto";
            webpackConfig.output.uniqueName = moduleFederationConfig.name;
            webpackConfig.optimization.runtimeChunk = false;
            webpackConfig.resolve.alias = {
                ...(webpackConfig.resolve.alias || {}),
                react: path.resolve(__dirname, "node_modules/react"),
                "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
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
