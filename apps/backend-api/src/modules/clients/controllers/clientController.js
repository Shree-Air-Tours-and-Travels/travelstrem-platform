import Client from "../models/Client.js";
import User from "../../auth/models/User.js";
import { withTenantDatabase } from "../tenantDatabase.service.js";
import { inviteUser, renewInvitation } from "../../tenancy/tenancy.service.js";

const sendJson = (res, statusCode, body) => res.status(statusCode).json(body);

const masterViewer = async (req) => {
    const user = await User.findById(req.user?.sub || req.user?.id)
        .select("role adminLevel accountStatus tokenVersion")
        .lean();
    return (
        user?.role === "admin" &&
        user.adminLevel === "master" &&
        (user.accountStatus || "active") === "active" &&
        Number(user.tokenVersion || 0) === Number(req.user?.tokenVersion || 0)
    );
};

export const listClientMembers = async (req, res, next) => {
    try {
        if (!(await masterViewer(req))) return sendJson(res, 403, { status: "error", message: "Access denied" });
        const client = await Client.findById(req.params.id);
        if (!client) return sendJson(res, 404, { status: "error", message: "Client not found" });
        const members = await withTenantDatabase(client, ({ User: TenantUser }) => TenantUser.find({ clientId: client._id, clientRole: { $in: ["client_master_admin", "client_admin", "client_agent"] } }).select("name email clientRole accountStatus").sort({ name: 1 }).lean());
        return sendJson(res, 200, { status: "success", componentData: { data: { members } } });
    } catch (error) { next(error); }
};

export const assignClientMember = async (req, res, next) => {
    try {
        if (!(await masterViewer(req))) return sendJson(res, 403, { status: "error", message: "Access denied" });
        const clientRole = req.body?.clientRole;
        const email = String(req.body?.email || "").trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !["client_master_admin", "client_admin", "client_agent"].includes(clientRole))
            return sendJson(res, 400, { status: "error", message: "A valid email and client role are required." });
        const client = await Client.findOne({ _id: req.params.id, status: "active" });
        if (!client) return sendJson(res, 404, { status: "error", message: "Active client not found." });
        const result = await withTenantDatabase(client, async (models) => {
            let user = await models.User.findOne({ email });
            if (!user) {
                const invitation = await inviteUser({ client, clientRole, models, actorId: req.user.sub, name: req.body.name || email.split("@")[0], email, productKeys: client.productAccess, authUrl: client.domains.auth });
                return { emailSent: invitation.emailSent };
            }
            if (String(user.clientId) !== String(client._id) || user.agencyId || user.adminLevel === "master")
                throw Object.assign(new Error("This account belongs to another scope."), { status: 409 });
            if (!["active", "invited"].includes(user.accountStatus))
                throw Object.assign(new Error("This account must be reactivated before assigning access."), { status: 409 });
            user.clientRole = clientRole; user.role = ["client_master_admin", "client_admin"].includes(clientRole) ? "admin" : "member";
            user.adminLevel = ["client_master_admin", "client_admin"].includes(clientRole) ? "standard" : "none";
            user.adminApprovalStatus = ["client_master_admin", "client_admin"].includes(clientRole) ? "approved" : "not_required";
            user.productAccess = client.productAccess; user.tokenVersion = (user.tokenVersion || 0) + 1;
            await user.save();
            return user.accountStatus === "invited" ? renewInvitation({ user, client, models, actorId: req.user.sub, authUrl: client.domains.auth }) : { alreadyActive: true };
        });
        return sendJson(res, 200, { status: "success", componentData: { data: { emailSent: result.emailSent, alreadyActive: result.alreadyActive } } });
    } catch (error) { next(error); }
};

export const removeClientMember = async (req, res, next) => {
    try {
        if (!(await masterViewer(req))) return sendJson(res, 403, { status: "error", message: "Access denied" });
        const client = await Client.findById(req.params.id);
        if (!client) return sendJson(res, 404, { status: "error", message: "Client not found." });
        await withTenantDatabase(client, async ({ User: TenantUser }) => {
            const user = await TenantUser.findOne({ _id: req.params.userId, clientId: client._id });
            if (!user) throw Object.assign(new Error("Client member not found."), { status: 404 });
            user.accountStatus = "deactivated"; user.tokenVersion = (user.tokenVersion || 0) + 1;
            await user.save();
        });
        return sendJson(res, 200, { status: "success" });
    } catch (error) { next(error); }
};

export const getClients = async (req, res) => {
    try {
        const clients = await Client.find().sort({ createdAt: -1 }).lean();
        return sendJson(res, 200, {
            status: "success",
            componentData: { data: { clients } },
            message: "Clients fetched successfully",
        });
    } catch (error) {
        return sendJson(res, 500, {
            status: "error",
            message: "Failed to fetch clients",
            error: error.message,
        });
    }
};

export const getClient = async (req, res) => {
    try {
        const client = await Client.findById(req.params.id).lean();
        if (!client) return sendJson(res, 404, { status: "error", message: "Client not found" });
        return sendJson(res, 200, {
            status: "success",
            componentData: { data: { client } },
            message: "Client fetched",
        });
    } catch (error) {
        return sendJson(res, 500, {
            status: "error",
            message: "Failed to fetch client",
            error: error.message,
        });
    }
};

export const deleteClient = async (req, res, next) => {
    try {
        const client = await Client.findById(req.params.id);
        if (!client) return sendJson(res, 404, { status: "error", message: "Client not found" });
        if (client.database?.secretRef) await withTenantDatabase(client, async (models) => {
            await models.Client.updateOne({ _id: client._id }, { $set: { status: "inactive" } });
            await models.User.updateMany({ clientId: client._id }, { $inc: { tokenVersion: 1 } });
        });
        client.status = "inactive"; await client.save();
        return sendJson(res, 200, { status: "success", message: "Client deactivated; tenant records retained." });
    } catch (error) { next(error); }
};

export const uploadClientLogo = async (req, res) => {
    try {
        const { id } = req.params;
        const { product } = req.query;
        if (!product)
            return sendJson(res, 400, {
                status: "error",
                message: "product query param is required (e.g. ?product=trevio)",
            });

        if (!req.file) return sendJson(res, 400, { status: "error", message: "No file uploaded" });

        const url = req.file?.secure_url || req.file?.url || req.file?.path;
        const existing = await Client.findById(id);
        if (!existing || !existing.productAccess.includes(product)) return sendJson(res, 400, { status: "error", message: "Product is not assigned to this client." });
        const updatePath = `branding.${product}.logoSrc`;
        const client = await Client.findByIdAndUpdate(
            id,
            { $set: { [updatePath]: url } },
            { new: true },
        ).lean();
        if (!client) return sendJson(res, 404, { status: "error", message: "Client not found" });
        if (client.database?.secretRef) await withTenantDatabase(client, (models) => models.Client.updateOne({ _id: client._id }, { $set: { [updatePath]: url } }));

        return sendJson(res, 200, {
            status: "success",
            componentData: { data: { client, url } },
            message: `${product} logo uploaded`,
        });
    } catch (error) {
        return sendJson(res, 500, {
            status: "error",
            message: "Logo upload failed",
            error: error.message,
        });
    }
};

export const getClientBySlug = async (req, res) => {
    try {
        const client = await Client.findOne({ slug: req.params.slug, status: "active" }).select("name slug branding globalBrand theme website domains productAccess modules accountModules partnerEnabled contactEmail contactPhone business.address homePage heroImages").lean();
        if (!client) return sendJson(res, 404, { status: "error", message: "Client not found" });
        return sendJson(res, 200, {
            status: "success",
            componentData: { data: { client } },
            message: "Client fetched",
        });
    } catch (error) {
        return sendJson(res, 500, {
            status: "error",
            message: "Failed to fetch client",
            error: error.message,
        });
    }
};
