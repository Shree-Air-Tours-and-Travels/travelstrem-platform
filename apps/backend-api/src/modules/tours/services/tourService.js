/**
 * Pure helpers and enrichment logic used by controllers.
 * Keeps logic testable and separate from HTTP concerns.
 */

/**
 * Determine handler/role from request user object.
 * Accepts "admin", "agent", "user" , defaults to "user".
 */
export const getHandlerFromReq = (req) => {
    const role = req?.user?.role;
    if (role === "admin" || role === "agent" || role === "user") return role;
    return "user";
};

/**
 * Filter roleActions for the specified handler.
 * Returns a shallow copy of actions with roleActions pruned.
 */
export const filterRoleActionsForHandler = (actions = {}, handler = "user") => {
    if (!actions || !actions.roleActions) return actions || {};
    const filtered = { ...actions };
    const available = {};
    Object.entries(actions.roleActions).forEach(([key, action]) => {
        const allowed = Array.isArray(action.allowedRoles) ? action.allowedRoles : [];
        if (allowed.includes(handler)) available[key] = action;
    });
    filtered.roleActions = available;
    return filtered;
};
