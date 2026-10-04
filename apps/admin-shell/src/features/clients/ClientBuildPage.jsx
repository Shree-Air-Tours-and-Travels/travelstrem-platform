import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AdminRouteFrame from "../../app/AdminRouteFrame";
import ClientForm from "./ClientForm";

export default function ClientBuildPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const clientId = params.get("clientId");
  const exit = () => navigate("/manage/tours?tab=clients");

  return <AdminRouteFrame activeId="clients" currentLabel={clientId ? "Configure client" : "Add client"}>
    <ClientForm clientId={clientId} onComplete={exit} onCancel={exit} />
  </AdminRouteFrame>;
}
