export const PERMISSIONS = Object.freeze({
  PARTNERSHIP_VIEW: "partnership_request.view", PARTNERSHIP_REVIEW: "partnership_request.review",
  PARTNERSHIP_APPROVE: "partnership_request.approve", PARTNERSHIP_REJECT: "partnership_request.reject",
  AGENCY_CREATE: "agency.create", AGENCY_VIEW: "agency.view", AGENCY_UPDATE: "agency.update",
  AGENCY_SUSPEND: "agency.suspend", AGENCY_DELETE: "agency.delete", AGENCY_PRODUCT_MANAGE: "agency.product.manage",
  AGENCY_ADMIN_CREATE: "agency_admin.create", AGENT_CREATE: "agent.create", AGENT_VIEW: "agent.view",
  AGENT_UPDATE: "agent.update", AGENT_DEACTIVATE: "agent.deactivate", AGENT_DELETE_REQUEST: "agent.delete.request",
  AGENT_DELETE_APPROVE: "agent.delete.approve", TRIP_CREATE: "trip.create", TRIP_VIEW_OWN: "trip.view.own",
  TRIP_VIEW_AGENCY: "trip.view.agency", TRIP_UPDATE_OWN: "trip.update.own", TRIP_UPDATE_AGENCY: "trip.update.agency",
  TRIP_ARCHIVE_OWN: "trip.archive.own", TRIP_ARCHIVE_AGENCY: "trip.archive.agency", TRIP_PUBLISH: "trip.publish",
  BOOKING_CREATE: "booking.create", BOOKING_VIEW_OWN: "booking.view.own", BOOKING_VIEW_AGENCY: "booking.view.agency",
  BOOKING_UPDATE_OWN: "booking.update.own", BOOKING_UPDATE_AGENCY: "booking.update.agency", BOOKING_CANCEL: "booking.cancel",
  CUSTOMER_CREATE: "customer.create", CUSTOMER_VIEW_OWN: "customer.view.own", CUSTOMER_VIEW_AGENCY: "customer.view.agency",
  CUSTOMER_UPDATE_OWN: "customer.update.own", CUSTOMER_UPDATE_AGENCY: "customer.update.agency",
  REPORTS_VIEW_AGENCY: "reports.view.agency", AUDIT_VIEW_AGENCY: "audit.view.agency", AUDIT_VIEW_PLATFORM: "audit.view.platform",
});

const all = Object.values(PERMISSIONS);
export const ROLE_PERMISSIONS = Object.freeze({
  master_admin: all,
  partner_admin: all.filter((permission) => ![
    PERMISSIONS.PARTNERSHIP_VIEW, PERMISSIONS.PARTNERSHIP_REVIEW, PERMISSIONS.PARTNERSHIP_APPROVE,
    PERMISSIONS.PARTNERSHIP_REJECT, PERMISSIONS.AGENCY_CREATE, PERMISSIONS.AGENCY_SUSPEND,
    PERMISSIONS.AGENCY_DELETE, PERMISSIONS.AGENT_DELETE_APPROVE, PERMISSIONS.AUDIT_VIEW_PLATFORM,
  ].includes(permission)),
  partner_agent: [
    PERMISSIONS.TRIP_CREATE, PERMISSIONS.TRIP_VIEW_OWN, PERMISSIONS.TRIP_UPDATE_OWN, PERMISSIONS.TRIP_ARCHIVE_OWN,
    PERMISSIONS.BOOKING_CREATE, PERMISSIONS.BOOKING_VIEW_OWN, PERMISSIONS.BOOKING_UPDATE_OWN, PERMISSIONS.BOOKING_CANCEL,
    PERMISSIONS.CUSTOMER_CREATE, PERMISSIONS.CUSTOMER_VIEW_OWN, PERMISSIONS.CUSTOMER_UPDATE_OWN,
  ],
});

export function effectiveRole(user = {}) {
  if (user.role === "admin" && user.adminLevel === "master") return "master_admin";
  if (user.agencyRole === "partner_admin") return "partner_admin";
  if (user.role === "agent") return "partner_agent";
  return "member";
}

export function permissionsFor(user = {}) {
  const base = ROLE_PERMISSIONS[effectiveRole(user)] || [];
  const denied = new Set(user.permissionDenials || []);
  return [...new Set([...base, ...(user.permissionGrants || [])])].filter((permission) => !denied.has(permission));
}
