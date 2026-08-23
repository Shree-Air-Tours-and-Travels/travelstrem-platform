const backendTarget = process.env.REACT_APP_BACKEND_URL;

module.exports = {
  devServer: (config) => {
    config.proxy = backendTarget
      ? { "/api": { target: backendTarget, changeOrigin: true, secure: false } }
      : undefined;
    return config;
  },
};
