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
      },
      "agent-services": {
        "page": "agent-services",
        "title": "Agent Services",
        "description": "Manage agent-owned tours and agency-visible services.",
        "widgets": [
          {
            "type": "agentServices",
            "source": "agent-shell",
            "props": {
              "variant": "agent"
            }
          }
        ]
      },
      "agent-dashboard": {
        "page": "agent-dashboard",
        "title": "Agent Dashboard",
        "description": "View agent profile, approval status, and agency assignment.",
        "widgets": [
          {
            "type": "agentProfile",
            "source": "agent-shell",
            "props": {
              "variant": "agent"
            }
          }
        ]
      },
      "agent-bookings": {
        "page": "agent-bookings",
        "title": "Agent Bookings",
        "description": "Track bookings assigned to this agent or agency.",
        "widgets": [
          {
            "type": "agentBookings",
            "source": "agent-shell",
            "props": {
              "variant": "agent"
            }
          }
        ]
      },
      "agent-agency": {
        "page": "agent-agency",
        "title": "Partner Agency",
        "description": "Apply for or review the partner agency linked to this account.",
        "widgets": [
          {
            "type": "partnerAgency",
            "source": "agent-shell",
            "props": {
              "variant": "agent"
            }
          }
        ]
      }
    }
  }
};
