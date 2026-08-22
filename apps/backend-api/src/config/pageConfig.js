export default {
  "status": "success",
  "message": "Page config loaded",
  "componentData": {
    "version": 1,
    "defaultPage": "home",
    "pathMap": {
      "/": "home",
      "/about": "about",
      "/app-shell": "app-shell"
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
      "app-shell": {
        "page": "app-shell",
        "title": "Customer Dashboard",
        "description": "Plan trips and manage your travel profile.",
        "widgets": [
          {
            "type": "app-shell",
            "source": "shell",
            "props": {
              "variant": "customer",
              "title": "Your travel dashboard",
              "description": "Explore journeys and keep your travel profile current.",
              "refreshLabel": "Refresh",
              "emptyTitle": "No travel activity yet",
              "emptyDescription": "Saved trips and planning tools will appear here."
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
