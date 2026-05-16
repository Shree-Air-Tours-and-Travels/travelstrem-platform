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
      "dashboard": "/dashboard",
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
    }
  }
};
