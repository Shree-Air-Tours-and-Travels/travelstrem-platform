const ModuleScopePlugin = require("react-dev-utils/ModuleScopePlugin");
const path = require("path");

const backendTarget = process.env.REACT_APP_BACKEND_URL;

const appSrc = path.resolve(__dirname, "src");
const sharedPackageSrc = path.resolve(__dirname, "../../packages");

function extendBabelIncludes(webpackConfig) {
  const oneOfRule = webpackConfig.module.rules.find((rule) => Array.isArray(rule.oneOf));
  if (!oneOfRule) return;

  oneOfRule.oneOf.forEach((rule) => {
    if (!rule.loader || !rule.loader.includes("babel-loader")) return;
    const include = Array.isArray(rule.include) ? rule.include : rule.include ? [rule.include] : [];
    rule.include = Array.from(new Set([...include, appSrc, sharedPackageSrc]));
  });
}

module.exports = {
  devServer: (config) => {
    config.proxy = backendTarget
      ? { "/api": { target: backendTarget, changeOrigin: true, secure: false } }
      : undefined;
    return config;
  },
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.resolve.alias = {
        ...(webpackConfig.resolve.alias || {}),
        "@packages/trem-ui": path.resolve(__dirname, "../../packages/trem-ui/src"),
        "@packages/trem-utils": path.resolve(__dirname, "../../packages/trem-utils/src"),
      };
      webpackConfig.resolve.plugins = (webpackConfig.resolve.plugins || []).filter(
        (plugin) => !(plugin instanceof ModuleScopePlugin),
      );
      extendBabelIncludes(webpackConfig);
      return webpackConfig;
    },
  },
};
