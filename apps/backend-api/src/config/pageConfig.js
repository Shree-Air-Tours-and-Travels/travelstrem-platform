export default {
  "status": "success",
  "message": "Page config loaded",
  "componentData": {
    "version": 1,
    "defaultPage": "home",
    "pathMap": {
      "/": "home",
      "/about": "about",
      "/tours": "tours",
      "/bookings": "bookings"
    },
    "pages": {
      "home": {
        "page": "home",
        "widgets": [
          {
            "type": "heroBanner",
            "source": "shell"
          },
          {
            "type": "services",
            "source": "shell"
          },
          {
            "type": "featuredTours",
            "source": "toursTREM"
          }
        ]
      },
      "about": {
        "page": "about",
        "widgets": [
          {
            "type": "aboutContent",
            "source": "shell"
          }
        ]
      },
      "tours": {
        "page": "tours",
        "widgets": [
          {
            "type": "microApp",
            "source": "toursTREM",
            "props": {
              "embedded": true,
              "basename": "/tours",
              "basePath": "/tours"
            }
          }
        ]
      },
      "bookings": {
        "page": "bookings",
        "widgets": [
          {
            "type": "bookingsDashboard",
            "source": "shell"
          }
        ]
      }
    }
  }
};
