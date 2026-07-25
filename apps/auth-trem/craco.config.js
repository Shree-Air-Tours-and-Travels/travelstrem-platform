const path = require("path");
const ModuleScopePlugin = require("react-dev-utils/ModuleScopePlugin");

const appSrc = path.resolve(__dirname, "src");
const packagesSrc = path.resolve(__dirname, "../../packages");
const backendTarget =
  process.env.REACT_APP_BACKEND_URL ||
  process.env.REACT_APP_API_URL?.replace(/\/api\/?$/, "") ||
  "http://localhost:5000";

function extendBabelIncludes(webpackConfig) {
  const oneOfRule = webpackConfig.module.rules.find((rule) => Array.isArray(rule.oneOf));
  if (!oneOfRule) return;

  oneOfRule.oneOf.forEach((rule) => {
    if (!rule.loader || !rule.loader.includes("babel-loader")) return;
    const include = Array.isArray(rule.include) ? rule.include : rule.include ? [rule.include] : [];
    rule.include = Array.from(new Set([...include, appSrc, packagesSrc]));
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
    return devServerConfig;
  },
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.resolve.alias = {
        ...(webpackConfig.resolve.alias || {}),
        "@packages/trem-auth-core": path.resolve(__dirname, "../../packages/trem-auth-core/src"),
        "@packages/trem-modals": path.resolve(__dirname, "../../packages/trem-modals/src"),
        "@packages/trem-ui": path.resolve(__dirname, "../../packages/trem-ui/src"),
        "@packages/trem-utils": path.resolve(__dirname, "../../packages/trem-utils/src"),
      };
      webpackConfig.resolve.plugins = (webpackConfig.resolve.plugins || []).filter(
        (plugin) => !(plugin instanceof ModuleScopePlugin)
      );
      extendBabelIncludes(webpackConfig);
      return webpackConfig;
    },
  },
};
