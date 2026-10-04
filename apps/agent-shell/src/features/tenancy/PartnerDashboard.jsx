import React, { Suspense, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  REALTIME_EVENTS,
  useEnquiryRealtime,
  useRealtimeEvent,
  useRealtimeStatus,
  useTourCatalogRealtime,
} from "@packages/trem-events";

const Dashboard = React.lazy(() => import("dashboard/Dashboard"));

export default function PartnerDashboard({
  data,
  loading,
  error,
  onRefresh,
  onActivityPageChange,
}) {
  const navigate = useNavigate();
  const { isConnected, isReconnecting } = useRealtimeStatus();
  const refreshFromRealtime = useCallback(() => onRefresh?.({ preserveData: true }), [onRefresh]);
  useEnquiryRealtime(refreshFromRealtime);
  useTourCatalogRealtime(refreshFromRealtime);
  useRealtimeEvent(REALTIME_EVENTS.SUPPORT_CONVERSATION_UPDATED, refreshFromRealtime);

  return (
    <Suspense fallback={<div aria-label="Loading dashboard" />}>
      <Dashboard
        role={data?.viewer?.role || "partner_agent"}
        user={{ name: data?.viewer?.name }}
        source={data}
        loading={loading}
        error={error}
        realtime={{ isConnected, isReconnecting }}
        onRefresh={onRefresh}
        onActivityPageChange={onActivityPageChange}
        onTabChange={(target) => target && navigate(target)}
      />
    </Suspense>
  );
}
