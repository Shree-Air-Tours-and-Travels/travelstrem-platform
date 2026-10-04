import { tenantRuntimeConfiguration } from "./configuration.js";

export async function migrateTenantConfiguration(connection, tenantId) {
    const db = connection.db;
    const old = await db.listCollections({ name: "clients" }, { nameOnly: true }).toArray();
    if (!old.length) return;
    const records = await db.collection("clients").find({}).limit(2).toArray();
    if (
        records.length !== 1 ||
        String(records[0]._id) !== String(tenantId) ||
        records[0].database?.name !== connection.name
    )
        throw new Error("Refusing to migrate a database containing another client.");
    if (
        (await db.listCollections({ name: "tenantconfigurations" }, { nameOnly: true }).toArray())
            .length
    )
        throw new Error(
            "Both legacy clients and tenant configuration exist; reconcile before startup.",
        );
    await db
        .collection("clients")
        .replaceOne({ _id: records[0]._id }, tenantRuntimeConfiguration(records[0]));
    await db.collection("clients").rename("tenantconfigurations");
}
