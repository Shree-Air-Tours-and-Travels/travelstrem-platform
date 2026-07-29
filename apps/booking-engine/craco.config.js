const path = require("path");
const { container } = require("webpack");
const ModuleScopePlugin = require("react-dev-utils/ModuleScopePlugin");
const moduleFederationConfig = require("./modulefederation.config");

const appSrc = path.resolve(__dirname, "src");
const packagesSrc = path.resolve(__dirname, "../../packages");
const bookingSource = path.resolve(__dirname, "../trevista-remote/src");
const sharedNodeModules = path.resolve(__dirname, "../trevista-remote/node_modules");
const backendTarget = process.env.REACT_APP_BACKEND_URL;

module.exports = {
  devServer: (config) => {
    config.proxy = { "/api": { target: backendTarget, changeOrigin: true, secure: false } };
    return config;
  },
  webpack: {
    configure: (config) => {
      config.output.publicPath = "auto";
      config.output.uniqueName = moduleFederationConfig.name;
      config.optimization.runtimeChunk = false;
      config.resolve.alias = {
        ...(config.resolve.alias || {}),
        "@packages/trem-modals": path.resolve(__dirname, "../../packages/trem-modals/src"),
        "@packages/trem-design-tokens": path.resolve(__dirname, "../../packages/trem-design-tokens/src"),
        "@packages/trem-ui": path.resolve(__dirname, "../../packages/trem-ui/src"),
        "@packages/trem-utils": path.resolve(__dirname, "../../packages/trem-utils/src"),
        react: path.resolve(sharedNodeModules, "react"),
        "react-dom": path.resolve(sharedNodeModules, "react-dom"),
        "react-router-dom": path.resolve(sharedNodeModules, "react-router-dom"),
      };
      config.resolve.plugins = (config.resolve.plugins || []).filter((plugin) => !(plugin instanceof ModuleScopePlugin));
      const oneOfRule = config.module.rules.find((rule) => Array.isArray(rule.oneOf));
      oneOfRule?.oneOf.forEach((rule) => {
        if (!rule.loader?.includes("babel-loader")) return;
        const include = Array.isArray(rule.include) ? rule.include : rule.include ? [rule.include] : [];
        rule.include = Array.from(new Set([...include, appSrc, packagesSrc, bookingSource]));
      });
      config.plugins.push(new container.ModuleFederationPlugin(moduleFederationConfig));
      return config;
    },
  },
};
