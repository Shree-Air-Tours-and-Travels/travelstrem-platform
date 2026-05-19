export default {
  "status": "success",
  "message": "Header and route config loaded",
  "componentData": {
    "version": 2,
    "brand": {
      "label": "TravelsTREM",
      "logoSrc": "/logo-images/travelsTrem-header-logo.png",
      "homePath": "/"
    },
    "leftSection": {
      "welcome": true,
      "showLogout": true,
      "showStatus": true,
      "showNotifications": true
    },
    "menu": [
      {
        "label": "Home",
        "type": "internal",
        "path": "/",
        "disabled": false
      },
      {
        "label": "About",
        "type": "internal",
        "path": "/about",
        "disabled": false
      },
      {
        "label": "Services",
        "type": "dropdown",
        "disabled": false,
        "items": [
          {
            "label": "Tours & Packages",
            "app": "toursTREM",
            "path": "/tours",
            "disabled": false
          },
          {
            "label": "Flights",
            "app": "flightsTREM",
            "path": "/flights",
            "disabled": true
          },
          {
            "label": "Hotels",
            "app": "hotelsTREM",
            "path": "/hotels",
            "disabled": true
          },
          {
            "label": "Cab",
            "app": "cabTREM",
            "path": "/cab",
            "disabled": true
          },
          {
            "label": "Visa & Passport",
            "app": "visaTREM",
            "path": "/visa",
            "disabled": true
          }
        ]
      },
      {
        "label": "Dashboard",
        "app": "customer-shell",
        "path": "/dashboard",
        "disabled": false
      },
      {
        "label": "Favorites",
        "app": "customer-shell",
        "path": "/favorites",
        "disabled": false,
        "access": "authenticated"
      },
      {
        "label": "Admin",
        "app": "adminTREM",
        "type": "internal",
        "path": "/admin",
        "access": "roles",
        "roles": ["admin"],
        "disabled": false
      }
    ],
    "navigation": [
      { "id": "home", "label": "Home", "path": "/", "access": "public" },
      { "id": "about", "label": "About", "path": "/about", "access": "public" },
      { "id": "tours", "label": "Tours & Packages", "path": "/tours", "access": "authenticated" },
      { "id": "favorites", "label": "Favorites", "path": "/favorites", "access": "authenticated" },
      { "id": "dashboard", "label": "Dashboard", "path": "/dashboard", "access": "authenticated" }
    ],
    "authActions": {
      "login": { "label": "Login", "path": "/login" },
      "logout": { "label": "Logout", "eventName": "USER_LOGOUT", "redirectTo": "/login" }
    },
    "remotes": {
      "toursTREM": {
        "key": "toursTREM",
        "label": "ToursTREM",
        "routeBase": "/tours",
        "remoteUrlEnv": "REACT_APP_TOURS_REMOTE_URL",
        "defaultRemoteUrl": "http://localhost:3001",
        "module": "toursTREM/ToursApp",
        "exportName": "ToursApp",
        "remoteProps": { "embedded": true, "basename": "/tours", "basePath": "/tours" }
      },
      "adminTREM": {
        "key": "adminTREM",
        "label": "AdminTREM",
        "routeBase": "/admin",
        "remoteUrlEnv": "REACT_APP_ADMIN_REMOTE_URL",
        "defaultRemoteUrl": "http://localhost:3002",
        "module": "adminTREM/AdminApp",
        "exportName": "AdminApp",
        "remoteProps": { "embedded": true, "basename": "/admin", "basePath": "/admin" }
      }
    },
    "routeMap": {
      "/": "shell",
      "/about": "shell",
      "/tours": "toursTREM",
      "/favorites": "shell",
      "/dashboard": "shell",
      "/admin": "adminTREM",
      "/checkout": "shell"
    },
    "routes": [
      { "id": "home", "path": "/", "component": "home", "access": "public" },
      { "id": "about", "path": "/about", "component": "about", "access": "public" },
      { "id": "search", "path": "/search", "component": "search", "access": "public" },
      { "id": "login", "path": "/login", "component": "auth", "access": "publicOnly", "authenticatedRedirect": "/" },
      { "id": "auth", "path": "/auth", "component": "auth", "access": "publicOnly", "authenticatedRedirect": "/" },
      { "id": "tours", "path": "/tours/*", "remote": "toursTREM", "component": "remote.toursTREM", "access": "authenticated", "preserveState": true },
      { "id": "checkout", "path": "/checkout/:bookingId", "component": "checkout", "access": "authenticated", "preserveState": true },
      { "id": "favorites", "path": "/favorites", "component": "favorites", "access": "authenticated" },
      { "id": "dashboard", "path": "/dashboard", "component": "dashboard", "access": "authenticated" },
      { "id": "admin", "path": "/admin/*", "remote": "adminTREM", "component": "remote.adminTREM", "access": "roles", "roles": ["admin"], "preserveState": true }
    ],
    "fallbacks": {
      "authenticated": "/",
      "anonymous": "/login",
      "unauthorized": "/"
    }
  }
};
