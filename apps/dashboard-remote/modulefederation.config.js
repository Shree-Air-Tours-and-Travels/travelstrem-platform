const deps = require("./package.json").dependencies;

module.exports = {
  name: "dashboard",
  filename: "remoteEntry.js",
  exposes: { "./Dashboard": "./src/Dashboard.jsx" },
  shared: {
    react: { singleton: true, requiredVersion: deps.react },
    "react-dom": { singleton: true, requiredVersion: deps["react-dom"] },
  },
};
