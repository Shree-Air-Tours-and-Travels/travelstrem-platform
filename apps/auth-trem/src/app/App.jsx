import React from "react";
import AuthPage from "../features/auth/AuthPage.jsx";
import { createAuthApi, createAuthService } from "../services/authService.js";

const api = createAuthApi();
const authService = createAuthService(api);

export default function AuthTremApp() {
  return (
    <AuthPage
      api={api}
      authService={authService}
      appName="authTREM"
      defaultRole="member"
      allowedRoles={["member"]}
      afterAuthPath="/"
    />
  );
}
