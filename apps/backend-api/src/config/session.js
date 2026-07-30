export default {
  "status": "success",
  "message": "User session config loaded",
  "componentData": {
    "version": 1,
    "storageKeys": {
      "token": "token",
      "tokenAlias": "auth_token",
      "tokenKeyName": "auth_token_key_name",
      "user": "auth_user",
      "returnTo": "return_to_path"
    },
    "eventNames": {
      "logout": "app:logout",
      "sessionReady": "app:session-ready",
      "sessionExpired": "app:session-expired",
      "routeRestored": "app:route-restored"
    },
    "routePaths": {
      "home": "/",
      "auth": "/auth",
      "about": "/about",
      "tours": "/tours",
      "tourDetails": "/tours/:tourRef",
      "app-shell": "/app-shell",
      "checkout": "/checkout/:bookingId",
      "manageTours": "/manage/tours",
      "adminTours": "/admin/tours",
      "agentTours": "/agent/tours",
      "search": "/search"
    },
    "routeState": {
      "preservePathname": true,
      "preserveSearch": true,
      "preserveHash": true,
      "paramKeys": ["id", "tourRef", "bookingId"],
      "redirectStateKey": "from"
    },
    "roles": {
      "public": ["public"],
      "member": ["member"],
      "agent": ["agent"],
      "admin": ["admin"]
    },
    "eventConfig": {
      "data": {
        "contextConfig": {
          "pickKeys": ["tourRef", "bookingId", "activeNav", "filters", "sort", "page"]
        },
        "postLoginUrl": "/",
        "preLoginUrl": "/login",
        "pages": [
          {
            "pageName": "home",
            "event": "navigateToHome",
            "type": "redirect",
            "title": "Home",
            "renderConfig": {},
            "fallback": ""
          },
          {
            "pageName": "about",
            "event": "navigateToAbout",
            "type": "redirect",
            "title": "About",
            "renderConfig": {},
            "fallback": "home"
          },
          {
            "pageName": "loginPage",
            "event": "proceedToLogin",
            "type": "redirect",
            "title": "Login",
            "renderConfig": {},
            "fallback": "home"
          },
          {
            "pageName": "app-shell",
            "event": "navigateToAppShell",
            "title": "Dashboard",
            "renderConfig": {
              "context": {
                "activeNav": "ctx:clear"
              }
            },
            "fallback": "home"
          },
          {
            "pageName": "favorites",
            "event": "navigateToFavorites",
            "type": "redirect",
            "title": "Favorites",
            "renderConfig": {
              "context": {
                "activeNav": "favorites"
              }
            },
            "fallback": "app-shell"
          },
          {
            "pageName": "settings",
            "event": "navigateToSettings",
            "type": "redirect",
            "title": "Settings",
            "renderConfig": {
              "context": {
                "activeNav": "settings"
              }
            },
            "fallback": "app-shell"
          },
          {
            "pageName": "tours",
            "event": "navigateToTours",
            "type": "redirect",
            "title": "Tours",
            "renderConfig": {},
            "fallback": "app-shell"
          },
          {
            "pageName": "tourDetails",
            "event": "navigateToTourDetails",
            "type": "redirect",
            "title": "Tour Details",
            "renderConfig": {
              "context": {
                "tourRef": "${tourRef}"
              }
            },
            "fallback": "tours"
          },
          {
            "pageName": "booking",
            "event": "navigateToBooking",
            "type": "redirect",
            "title": "Booking",
            "renderConfig": {
              "context": {
                "tourRef": "${tourRef}"
              }
            },
            "fallback": "tourDetails"
          },
          {
            "pageName": "bookingSummary",
            "event": "navigateToBookingSummary",
            "type": "redirect",
            "title": "Booking Summary",
            "renderConfig": {
              "context": {
                "bookingId": "${bookingId}"
              }
            },
            "fallback": "app-shell"
          },
          {
            "pageName": "bookingCheckout",
            "event": "navigateToBookingCheckout",
            "type": "redirect",
            "title": "Checkout",
            "renderConfig": {
              "context": {
                "bookingId": "${bookingId}"
              }
            },
            "fallback": "bookingSummary"
          },
          {
            "pageName": "admin",
            "event": "navigateToAdmin",
            "type": "redirect",
            "title": "Admin",
            "renderConfig": {},
            "fallback": "app-shell"
          },
          {
            "pageName": "logout",
            "event": "navigateToLogout",
            "type": "redirect",
            "title": "Logout",
            "renderConfig": {},
            "fallback": "loginPage"
          }
        ]
      },
      "elements": {
        "labels": {},
        "urls": {
          "navigateToHome": "/",
          "navigateToAbout": "/about",
          "proceedToLogin": "/login",
          "navigateToDashboard": "/app-shell",
          "navigateToFavorites": "/app-shell",
          "navigateToSettings": "/app-shell",
          "navigateToTours": "/tours",
          "navigateToTourDetails": "/tours/${tourRef}",
          "navigateToBooking": "/tours/${tourRef}/book",
          "navigateToBookingSummary": "/tours/bookings/${bookingId}",
          "navigateToBookingCheckout": "/tours/bookings/${bookingId}/checkout",
          "navigateToAdmin": "/admin",
          "navigateToLogout": "/login"
        },
        "actions": {},
        "fields": {}
      },
      "structure": {
        "events": [
          {
            "event": "USER_LOGOUT",
            "config": {
              "events": [
                {
                  "name": "navigateToLogout",
                  "type": "redirect"
                }
              ]
            },
            "type": "translation",
            "path": ""
          },
          {
            "event": "navigateToBookingFlow",
            "config": {
              "events": [
                {
                  "name": "navigateToBookingCheckout",
                  "type": "redirect",
                  "triggerIf": {
                    "actualValue": "checkout",
                    "receivedValue": "${step}"
                  },
                  "eventData": {
                    "request": {
                      "context": {
                        "bookingId": "${bookingId}"
                      }
                    }
                  }
                },
                {
                  "name": "navigateToBookingSummary",
                  "type": "redirect",
                  "triggerIf": {
                    "actualValue": "summary",
                    "receivedValue": "${step}"
                  },
                  "eventData": {
                    "request": {
                      "context": {
                        "bookingId": "${bookingId}"
                      }
                    }
                  }
                }
              ]
            },
            "type": "translation",
            "path": ""
          },
          {
            "event": "appShellListingUpdated",
            "config": {
              "events": [
                {
                  "name": "reloadDashboardListing",
                  "type": "reload"
                }
              ]
            },
            "type": "translation",
            "path": ""
          },
          {
            "event": "syncDashboardFilters",
            "config": {
              "events": [
                {
                  "name": "syncDashboardFilters",
                  "type": "sync_update"
                }
              ]
            },
            "type": "translation",
            "path": ""
          },
          {
            "event": "openSupportChat",
            "type": "callback",
            "config": {
              "eventType": "openSupportChat",
              "overlayView": ""
            },
            "eventData": {
              "request": {
                "context": {},
                "data": {}
              }
            }
          }
        ]
      },
      "subscribedEvents": {},
      "authorization": {
        "USER_LOGOUT": true,
        "navigateToHome": true,
        "navigateToAbout": true,
        "proceedToLogin": true,
        "navigateToDashboard": true,
        "navigateToFavorites": true,
        "navigateToSettings": true,
        "navigateToTours": true,
        "navigateToTourDetails": true,
        "navigateToBooking": true,
        "navigateToBookingSummary": true,
        "navigateToBookingCheckout": true,
        "navigateToBookingFlow": true,
        "navigateToAdmin": true,
        "navigateToLogout": true,
        "dashboardListingUpdated": true,
        "reloadDashboardListing": true,
        "syncDashboardFilters": true,
        "openSupportChat": true
      }
    }
  }
};
