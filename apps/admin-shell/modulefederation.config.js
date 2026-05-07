const deps = require("./package.json").dependencies;

module.exports = {
    name: "adminTREM",
    filename: "remoteEntry.js",
    exposes: {
        "./AdminApp": "./src/App.jsx",
    },
    shared: {
        react: {
            singleton: true,
            requiredVersion: deps.react,
        },
        "react-dom": {
            singleton: true,
            requiredVersion: deps["react-dom"],
        },
        "react-router-dom": {
            singleton: true,
            requiredVersion: deps["react-router-dom"],
        },
    },
};
