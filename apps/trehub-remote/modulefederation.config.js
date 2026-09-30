const deps = require("./package.json").dependencies;

module.exports = {
  name: "trehub",
  filename: "remoteEntry.js",
  exposes: {
    "./App": "./src/app/App.jsx",
    "./TrehubApp": "./src/app/App.jsx",
  },
  shared: {
    react: { singleton: true, requiredVersion: deps.react },
    "react-dom": { singleton: true, requiredVersion: deps["react-dom"] },
    "react-router-dom": { singleton: true, requiredVersion: deps["react-router-dom"] },
  },
};
