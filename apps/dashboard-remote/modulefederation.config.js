const deps = require("./package.json").dependencies;

module.exports = {
  name: "dashboard",
  filename: "remoteEntry.js",
  exposes: { "./Dashboard": "./src/Dashboard.jsx", "./AccountDashboard": "./src/account/AccountDashboard.jsx" },
  shared: {
    react: { singleton: true, requiredVersion: deps.react },
    "react-router-dom": { singleton: true, requiredVersion: deps["react-router-dom"] },
    "react-dom": { singleton: true, requiredVersion: deps["react-dom"] },
  },
};
