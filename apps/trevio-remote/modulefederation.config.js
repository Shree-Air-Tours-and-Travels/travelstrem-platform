const deps = require("./package.json").dependencies;

module.exports = {
  name: "trevio",
  filename: "remoteEntry.js",
  exposes: {
    "./App": "./src/app/App.jsx",
    "./TrevioApp": "./src/app/App.jsx",
  },
  shared: {
    react: { singleton: true, requiredVersion: deps.react },
    "react-dom": { singleton: true, requiredVersion: deps["react-dom"] },
    "react-router-dom": { singleton: true, requiredVersion: deps["react-router-dom"] },
  },
};
