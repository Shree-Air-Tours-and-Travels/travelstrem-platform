import User from "../auth/models/User.js";

export const customerTenantId = (user) =>
    user.clientId
        ? `client:${user.clientId}`
        : user.agencyId
          ? `agency:${user.agencyId}`
          : "travelstrem";

// Existing platform records remain readable; unscoped records are never assigned to a client.
export const customerScopeQuery = (context) =>
    context.tenantId === "travelstrem"
        ? { $or: [{ tenantId: "travelstrem" }, { tenantId: null }] }
        : { tenantId: context.tenantId };

export function customerScopePlugin(schema, { ownerField }) {
    schema.add({ tenantId: { type: String, default: null, immutable: true, index: true } });
    const stamp = async (record) => {
        const ownerId = record[ownerField];
        record.tenantId = process.env.TENANT_CLIENT_ID
            ? `client:${process.env.TENANT_CLIENT_ID}`
            : null;
        if (!ownerId || !/^[a-f0-9]{24}$/i.test(String(ownerId))) return;
        const owner = await User.findById(ownerId).select("clientId agencyId").lean();
        if (
            process.env.TENANT_CLIENT_ID &&
            owner &&
            String(owner.clientId) !== process.env.TENANT_CLIENT_ID
        )
            throw new Error("Record owner does not belong to this tenant.");
        if (owner) record.tenantId = customerTenantId(owner);
    };
    schema.pre("validate", async function () {
        if (this.isNew) await stamp(this);
    });
    schema.pre("insertMany", function (next, records) {
        Promise.all(records.map(stamp)).then(() => next(), next);
    });
}
