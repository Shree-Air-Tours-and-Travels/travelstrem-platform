const path = require("path");
const reactScriptsDir = path.dirname(require.resolve("react-scripts/package.json"));
const { container } = require(require.resolve("webpack", { paths: [reactScriptsDir] }));

const appSrc = path.resolve(__dirname, "src");
const packagesSrc = path.resolve(__dirname, "../../packages");
const bookingEngineSrc = path.resolve(__dirname, "../booking-engine/src");
const backendTarget =
  process.env.REACT_APP_BACKEND_URL ||
  process.env.REACT_APP_API_URL?.replace(/\/api\/?$/, "") ||
  "http://localhost:5000";
const remoteEntry = (explicitEntry, baseUrl, fallback) => {
  const value = explicitEntry || baseUrl || fallback;
  return value.endsWith("/remoteEntry.js") ? value : `${value.replace(/\/$/, "")}/remoteEntry.js`;
};
const trevistaRemoteEntry = remoteEntry(
  process.env.REACT_APP_TREVISTA_REMOTE_ENTRY,
  process.env.REACT_APP_TREVISTA_URL,
  "http://localhost:3001",
);
const trevioRemoteEntry = remoteEntry(
  process.env.REACT_APP_TREVIO_REMOTE_ENTRY,
  process.env.REACT_APP_TREVIO_URL,
  "http://localhost:3005",
);

function extendBabelIncludes(webpackConfig) {
  const oneOfRule = webpackConfig.module.rules.find((rule) => Array.isArray(rule.oneOf));
  if (!oneOfRule) return;

  oneOfRule.oneOf.forEach((rule) => {
    if (!rule.loader || !rule.loader.includes("babel-loader")) return;
    const include = Array.isArray(rule.include) ? rule.include : rule.include ? [rule.include] : [];
    rule.include = Array.from(new Set([...include, appSrc, packagesSrc, bookingEngineSrc]));
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
    return devServerConfig;
  },
  webpack: {
    configure: (webpackConfig) => {
      // The dashboard is the browser-history shell. Its own assets must always
      // resolve from the origin root when a remote route is refreshed directly
      // (for example /trip/:slug), rather than relative to that nested route.
      webpackConfig.output.publicPath = "/";
      webpackConfig.output.uniqueName = "app-shell";
      webpackConfig.optimization.runtimeChunk = false;
      webpackConfig.resolve.alias = {
        ...(webpackConfig.resolve.alias || {}),
        "@apps/booking-engine": path.resolve(__dirname, "../booking-engine/src/library.js"),
        "@packages/trem-auth-core": path.resolve(__dirname, "../../packages/trem-auth-core/src"),
        "@packages/trem-environment": path.resolve(
          __dirname,
          "../../packages/trem-environment/src",
        ),
        "@packages/trem-events": path.resolve(__dirname, "../../packages/trem-events/src"),
        "@packages/trem-modals": path.resolve(__dirname, "../../packages/trem-modals/src"),
        "@packages/trem-runtime": path.resolve(__dirname, "../../packages/trem-runtime/src"),
        "@packages/trem-session": path.resolve(__dirname, "../../packages/trem-session/src"),
        "@packages/trem-ui": path.resolve(__dirname, "../../packages/trem-ui/src"),
        "@packages/trem-utils": path.resolve(__dirname, "../../packages/trem-utils/src"),
        "@packages/trem-design-tokens": path.resolve(
          __dirname,
          "../../packages/trem-design-tokens/src",
        ),
      };
      webpackConfig.resolve.plugins = (webpackConfig.resolve.plugins || []).filter(
        (plugin) => plugin?.constructor?.name !== "ModuleScopePlugin",
      );
      extendBabelIncludes(webpackConfig);
      webpackConfig.plugins.push(
        new container.ModuleFederationPlugin({
          name: "app_shell",
          remotes: {
            trevio: `trevio@${trevioRemoteEntry}`,
            trevista: `trevista@${trevistaRemoteEntry}`,
          },
          shared: {
            react: { singleton: true, requiredVersion: false },
            "react-dom": { singleton: true, requiredVersion: false },
            "react-router-dom": { singleton: true, requiredVersion: false },
          },
        }),
      );
      return webpackConfig;
    },
  },
};
