const deps = require("./package.json").dependencies;

module.exports = {
  name: "trevista",
  filename: "remoteEntry.js",
  exposes: {
    "./App": "./src/app/App.jsx",
    "./TrevistaApp": "./src/app/App.jsx",
    "./TourCard": "./src/features/tours/widgets/TourCard/TourCard.jsx",
    "./BookingWidget": "./src/features/tours/widgets/BookingWidget/BookingWidget.jsx",
    "./ReviewWidget": "./src/features/tours/widgets/ReviewWidget/ReviewWidget.jsx",
    "./TourFilters": "./src/features/tours/widgets/TourFilters/TourFilters.jsx",
    "./WidgetRegistry": "./src/widgets/registry/widgetRegistry.jsx",
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
