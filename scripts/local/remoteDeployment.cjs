const remoteOnly = process.env.REACT_APP_REMOTE_ONLY === "true";

if (process.env.REACT_APP_TENANT_DEPLOYMENT_MODE === "app-shell" && !remoteOnly) {
  throw new Error("Multi-product tenants must deploy this product as an App Shell remote.");
}

exports.configureRemoteServer = (config) => {
  if (!remoteOnly) return config;
  const setupMiddlewares = config.setupMiddlewares;
  config.historyApiFallback = false;
  config.setupMiddlewares = (middlewares, server) => {
    const configured = setupMiddlewares ? setupMiddlewares(middlewares, server) : middlewares;
    configured.unshift({
      name: "tenant-remote-only",
      middleware: (req, res, next) => {
        if (
          req.path === "/" ||
          /\.html$/.test(req.path) ||
          req.headers.accept?.includes("text/html")
        ) {
          return res.status(403).send("Open this product through your tenant App Shell.");
        }
        next();
      },
    });
    return configured;
  };
  return config;
};

exports.configureRemoteBuild = (config) => {
  if (remoteOnly) {
    config.plugins = config.plugins.filter(
      (plugin) => plugin.constructor.name !== "HtmlWebpackPlugin",
    );
  }
  return config;
};
