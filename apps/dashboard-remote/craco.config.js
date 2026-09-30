const path = require("path");
const reactScriptsDir = path.dirname(require.resolve("react-scripts/package.json"));
const { container } = require(require.resolve("webpack", { paths: [reactScriptsDir] }));
const ModuleScopePlugin = require(require.resolve("react-dev-utils/ModuleScopePlugin", { paths: [reactScriptsDir] }));
const federation = require("./modulefederation.config");

module.exports = {
  devServer: (config) => {
    config.headers = { ...(config.headers || {}), "Access-Control-Allow-Origin": "*" };
    return config;
  },
  webpack: {
    configure: (config) => {
      config.output.publicPath = "auto";
      config.output.uniqueName = federation.name;
      config.optimization.runtimeChunk = false;
      config.resolve.alias = {
        ...(config.resolve.alias || {}),
        "@packages/trem-auth-core": path.resolve(__dirname, "../../packages/trem-auth-core/src"),
        "@packages/trem-environment": path.resolve(__dirname, "../../packages/trem-environment/src"),
        "@packages/trem-events": path.resolve(__dirname, "../../packages/trem-events/src"),
        "@packages/trem-modals": path.resolve(__dirname, "../../packages/trem-modals/src"),
        "@packages/trem-runtime": path.resolve(__dirname, "../../packages/trem-runtime/src"),
        "@packages/trem-session": path.resolve(__dirname, "../../packages/trem-session/src"),
        "@packages/trem-ui": path.resolve(__dirname, "../../packages/trem-ui/src"),
        "@packages/trem-utils": path.resolve(__dirname, "../../packages/trem-utils/src"),
        "@packages/trem-design-tokens": path.resolve(__dirname, "../../packages/trem-design-tokens/src"),
      };
      config.resolve.plugins = (config.resolve.plugins || []).filter((plugin) => !(plugin instanceof ModuleScopePlugin));
      const oneOf = config.module.rules.find((rule) => Array.isArray(rule.oneOf));
      oneOf?.oneOf.forEach((rule) => {
        if (!rule.loader?.includes("babel-loader")) return;
        const includes = Array.isArray(rule.include) ? rule.include : rule.include ? [rule.include] : [];
        rule.include = [...includes, path.resolve(__dirname, "src"), path.resolve(__dirname, "../../packages")];
      });
      config.plugins.push(new container.ModuleFederationPlugin(federation));
      return config;
    },
  },
};
