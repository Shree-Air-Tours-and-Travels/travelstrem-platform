export const DEFAULT_AUTH_ROLES = [
  {
    value: "member",
    title: "Member",
    subtitle: "Book trips and manage your journeys",
    descriptor: "Customer",
  },
  {
    value: "agent",
    title: "Agent",
    subtitle: "Manage tours, quotes, and customer requests",
    descriptor: "Operations",
    requiresSecret: true,
  },
  {
    value: "admin",
    title: "Admin",
    subtitle: "Full platform access and controls",
    descriptor: "Platform",
    requiresSecret: true,
  },
];

export const filterRoles = (roles, allowedRoles) => {
  if (!Array.isArray(allowedRoles) || allowedRoles.length === 0) return roles;
  const allowed = new Set(allowedRoles);
  return roles.filter((role) => allowed.has(role.value));
};
