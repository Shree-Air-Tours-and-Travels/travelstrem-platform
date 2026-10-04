import mongoose from "mongoose";
import ApiError from "../../shared/errors/ApiError.js";

// Applied before model compilation, so HTTP requests and background jobs use
// the same entitlement gate. Database roles additionally cover raw-driver access.
export function partnerAccessPlugin(schema) {
    async function requirePartnerAccess() {
        if (!process.env.TENANT_CLIENT_ID) return;
        const connection = this.db || this.model?.db || this.constructor?.db || this._model?.db;
        const client = await connection.db.collection("tenantconfigurations").findOne({
            _id: new mongoose.Types.ObjectId(process.env.TENANT_CLIENT_ID),
            status: "active",
            partnerEnabled: true,
        }, { projection: { _id: 1 } });
        if (!client) throw new ApiError(403, "Partner access is not enabled for this tenant.");
    }
    schema.pre(/^(find|count|estimatedDocumentCount|distinct|update|replace|delete)/, requirePartnerAccess);
    schema.pre("save", requirePartnerAccess);
    schema.pre("aggregate", requirePartnerAccess);
    schema.pre("insertMany", requirePartnerAccess);
    schema.pre("bulkWrite", requirePartnerAccess);
    schema.pre("deleteOne", { document: true, query: false }, requirePartnerAccess);
}
