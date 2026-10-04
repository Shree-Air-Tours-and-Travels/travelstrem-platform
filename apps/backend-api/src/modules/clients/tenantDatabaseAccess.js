import { tenantModelNames } from "./tenantModels.js";

const runtimeActions = [
    "find",
    "insert",
    "update",
    "remove",
    "createIndex",
    "listIndexes",
    "createCollection",
];

export function tenantDatabasePrivileges(client, connection) {
    const collections = new Set(["tenantconfigurations"]);
    for (const name of tenantModelNames(client)) {
        const model = connection.models[name];
        if (model)
            collections.add(name === "Client" ? "tenantconfigurations" : model.collection.name);
    }
    if (client.productAccess?.length) collections.add("enquirytrash");
    if (client.productAccess?.includes("trehub") && client.modules?.trehub?.includes("hotels"))
        collections.add("hotelbookings");
    return [...collections].sort().map((collection) => ({
        resource: { db: connection.name, collection },
        actions: [...runtimeActions],
    }));
}

// Check effective grants, not role names: readWrite on a whole tenant database
// still grants access to unlicensed collections and is not an acceptable runtime role.
export async function assertTenantDatabaseAccess(client, connection) {
    const expected = tenantDatabasePrivileges(client, connection);
    const allowed = new Set(expected.map(({ resource }) => resource.collection));
    const { authInfo } = await connection.db.command({ connectionStatus: 1, showPrivileges: true });
    if (
        !authInfo?.authenticatedUsers?.length ||
        !Array.isArray(authInfo.authenticatedUserPrivileges)
    )
        throw new Error(
            "Tenant MongoDB requires authenticated, collection-scoped runtime credentials.",
        );
    for (const { resource, actions } of authInfo.authenticatedUserPrivileges) {
        if (!actions.length) continue;
        if (
            resource.db !== connection.name ||
            !allowed.has(resource.collection) ||
            actions.some((action) => !runtimeActions.includes(action))
        )
            throw new Error(
                "Tenant MongoDB privileges exceed enrolled collections. Configure a dedicated collection-scoped runtime role; keep provisioning credentials on the platform.",
            );
    }
}
