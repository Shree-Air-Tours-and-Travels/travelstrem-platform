const deps = require("./package.json").dependencies;

module.exports = {
  name: "bookingEngine",
  filename: "remoteEntry.js",
  exposes: {
    "./EmbeddedApp": "./src/EmbeddedApp.jsx",
  },
  shared: {
    react: { singleton: true, requiredVersion: deps.react },
    "react-dom": { singleton: true, requiredVersion: deps["react-dom"] },
    "react-router-dom": { singleton: true, requiredVersion: deps["react-router-dom"] },
    "react-redux": { singleton: true, requiredVersion: deps["react-redux"] },
  },
};
