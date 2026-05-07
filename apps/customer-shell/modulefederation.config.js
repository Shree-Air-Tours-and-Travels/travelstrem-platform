const deps = require("./package.json").dependencies;

const remoteUrl = (name, envName, fallbackPort) => {
    const base = process.env[envName] || `http://localhost:${fallbackPort}`;
    return `${name}@${base.replace(/\/$/, "")}/remoteEntry.js`;
};

module.exports = {
    name: "customerShell",
    remotes: {
        toursTREM: remoteUrl("toursTREM", "REACT_APP_TOURS_REMOTE_URL", 3001),
        adminTREM: remoteUrl("adminTREM", "REACT_APP_ADMIN_REMOTE_URL", 3002),
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
