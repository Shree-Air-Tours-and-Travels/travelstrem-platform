// Read-only generator. Apply the output using the database administrator, never
// give the resulting runtime user the provisioning user's inherited roles.
import "../bootstrap/app.js";
import mongoose from "mongoose";
import connectDB from "../config/database.js";
import Client from "../modules/clients/models/Client.js";
import { tenantDatabasePrivileges } from "../modules/clients/tenantDatabaseAccess.js";

if (!process.env.TENANT_CLIENT_ID) throw new Error("Set TENANT_CLIENT_ID and the target tenant MONGO_URI.");
try {
    await connectDB();
    const client = await Client.findById(process.env.TENANT_CLIENT_ID).lean();
    if (!client || client.database?.name !== mongoose.connection.name)
        throw new Error("Provision this tenant configuration before generating its runtime role.");
    console.log(JSON.stringify({
        createRole: `tenant_${client._id}_runtime`,
        privileges: tenantDatabasePrivileges(client, mongoose.connection),
        roles: [],
    }, null, 2));
} finally {
    await mongoose.disconnect();
}
