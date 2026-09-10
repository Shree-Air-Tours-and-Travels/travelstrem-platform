const path = require("path");
const reactScriptsDir = path.dirname(require.resolve("react-scripts/package.json"));
const { container } = require(require.resolve("webpack", { paths: [reactScriptsDir] }));
const ModuleScopePlugin = require(require.resolve("react-dev-utils/ModuleScopePlugin", {
  paths: [reactScriptsDir],
}));
const moduleFederationConfig = require("./modulefederation.config");

const appSrc = path.resolve(__dirname, "src");
const sharedPackageSrc = path.resolve(__dirname, "../../packages");
const backendTarget = process.env.REACT_APP_BACKEND_URL;

module.exports = {
  devServer: (config) => {
    config.proxy = { "/api": { target: backendTarget, changeOrigin: true, secure: false } };
    config.headers = {
      ...(config.headers || {}),
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization",
    };
    return config;
  },
  webpack: {
    configure: (config) => {
      config.output.publicPath = "auto";
      config.output.uniqueName = moduleFederationConfig.name;
      config.optimization.runtimeChunk = false;
      config.resolve.alias = {
        ...(config.resolve.alias || {}),
        "@packages/trem-auth-core": path.resolve(__dirname, "../../packages/trem-auth-core/src"),
        "@packages/trem-modals": path.resolve(__dirname, "../../packages/trem-modals/src"),
        "@packages/trem-ui": path.resolve(__dirname, "../../packages/trem-ui/src"),
        "@packages/trem-utils": path.resolve(__dirname, "../../packages/trem-utils/src"),
        "@packages/trem-runtime": path.resolve(__dirname, "../../packages/trem-runtime/src"),
        "@packages/trem-session": path.resolve(__dirname, "../../packages/trem-session/src"),
        "@packages/trem-events": path.resolve(__dirname, "../../packages/trem-events/src"),
        "@packages/trem-environment": path.resolve(__dirname, "../../packages/trem-environment/src"),
        "@packages/trem-design-tokens": path.resolve(
          __dirname,
          "../../packages/trem-design-tokens/src",
        ),
      };
      config.resolve.plugins = (config.resolve.plugins || []).filter(
        (plugin) => !(plugin instanceof ModuleScopePlugin),
      );
      const oneOfRule = config.module.rules.find((rule) => Array.isArray(rule.oneOf));
      oneOfRule?.oneOf.forEach((rule) => {
        if (!rule.loader?.includes("babel-loader")) return;
        const include = Array.isArray(rule.include)
          ? rule.include
          : rule.include
            ? [rule.include]
            : [];
        rule.include = Array.from(new Set([...include, appSrc, sharedPackageSrc]));
      });
      config.plugins.push(new container.ModuleFederationPlugin(moduleFederationConfig));
      return config;
    },
  },
};
