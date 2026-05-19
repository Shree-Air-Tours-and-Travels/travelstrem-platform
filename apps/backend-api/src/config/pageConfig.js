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
      "/dashboard": "dashboard"
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
            "source": "shell"
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
      "dashboard": {
        "page": "dashboard",
        "title": "Customer Dashboard",
        "description": "Track trips, quote requests, payments, and traveller details.",
        "widgets": [
          {
            "type": "dashboard",
            "source": "shell",
            "props": {
              "variant": "customer",
              "title": "Your trips, quotes, and payments",
              "description": "Track every journey from quote request to final confirmation.",
              "refreshLabel": "Refresh",
              "emptyTitle": "No bookings found",
              "emptyDescription": "Your upcoming trips and quote requests will appear here."
            }
          }
        ]
      }
    }
  }
};
