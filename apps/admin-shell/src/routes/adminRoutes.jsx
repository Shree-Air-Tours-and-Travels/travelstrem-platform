import React from "react";
import AdminApp from "../App";

export const adminRouteDefinitions = [
    { path: "/admin/tours", roles: ["admin"], element: <AdminApp /> },
    { path: "/agent/tours", roles: ["agent"], element: <AdminApp /> },
    { path: "/manage/tours", roles: ["admin", "agent"], element: <AdminApp /> },
];
