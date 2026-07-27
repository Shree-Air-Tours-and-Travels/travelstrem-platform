const path = require("path");
const ModuleScopePlugin = require("react-dev-utils/ModuleScopePlugin");

const appSrc = path.resolve(__dirname, "src");
const sharedPackageSrc = path.resolve(__dirname, "../../packages");
const authTremSrc = path.resolve(__dirname, "../../apps/auth-trem/src");
const backendTarget =
    process.env.REACT_APP_BACKEND_URL ||
    process.env.REACT_APP_API_URL?.replace(/\/api\/?$/, "") ||
    "http://localhost:5000";

function extendBabelIncludes(webpackConfig) {
    const oneOfRule = webpackConfig.module.rules.find((rule) => Array.isArray(rule.oneOf));
    if (!oneOfRule) return;

    oneOfRule.oneOf.forEach((rule) => {
        if (!rule.loader || !rule.loader.includes("babel-loader")) return;

        if (Array.isArray(rule.include)) {
            rule.include = Array.from(new Set([...rule.include, appSrc, sharedPackageSrc, authTremSrc]));
            return;
        }

        if (rule.include) {
            rule.include = [rule.include, appSrc, sharedPackageSrc, authTremSrc];
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
        devServerConfig.historyApiFallback = true;
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
            webpackConfig.output.uniqueName = "adminShell";
            webpackConfig.resolve.alias = {
                ...(webpackConfig.resolve.alias || {}),
                react: path.resolve(__dirname, "node_modules/react"),
                "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
                "@apps/auth": path.resolve(__dirname, "../../apps/auth-trem/src/public-api.js"),
                "@packages/trem-auth-core": path.resolve(__dirname, "../../packages/trem-auth-core/src"),
                "@packages/trem-modals": path.resolve(__dirname, "../../packages/trem-modals/src"),
                "@packages/trem-ui": path.resolve(__dirname, "../../packages/trem-ui/src"),
                "@packages/trem-utils": path.resolve(__dirname, "../../packages/trem-utils/src"),
                "@packages/trem-design-tokens": path.resolve(__dirname, "../../packages/trem-design-tokens/src"),
            };
            webpackConfig.resolve.plugins = (webpackConfig.resolve.plugins || []).filter(
                (plugin) => !(plugin instanceof ModuleScopePlugin)
            );
            extendBabelIncludes(webpackConfig);
            return webpackConfig;
        },
    },
};
