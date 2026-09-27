import Client from "../models/Client.js";
import User from "../../auth/models/User.js";

const sendJson = (res, statusCode, body) => res.status(statusCode).json(body);

const masterViewer = async (req) => {
    const user = await User.findById(req.user?.sub || req.user?.id)
        .select("role adminLevel accountStatus tokenVersion")
        .lean();
    return user?.role === "admin" && user.adminLevel === "master" &&
        (user.accountStatus || "active") === "active" &&
        Number(user.tokenVersion || 0) === Number(req.user?.tokenVersion || 0);
};

export const listClientMembers = async (req, res) => {
    if (!await masterViewer(req)) return sendJson(res, 403, { status: "error", message: "Access denied" });
    const client = await Client.findById(req.params.id).select("_id").lean();
    if (!client) return sendJson(res, 404, { status: "error", message: "Client not found" });
    const members = await User.find({ clientId: client._id })
        .select("name email clientRole accountStatus")
        .sort({ name: 1 })
        .lean();
    return sendJson(res, 200, { status: "success", componentData: { data: { members } } });
};

export const assignClientMember = async (req, res) => {
    if (!await masterViewer(req)) return sendJson(res, 403, { status: "error", message: "Access denied" });
    const role = req.body?.clientRole;
    const email = String(req.body?.email || "").trim().toLowerCase();
    if (!email || !["client_admin", "client_agent"].includes(role))
        return sendJson(res, 400, { status: "error", message: "Enter an existing user email and a client role." });
    const client = await Client.findOne({ _id: req.params.id, status: "active" }).select("_id").lean();
    if (!client) return sendJson(res, 404, { status: "error", message: "Active client not found" });
    const user = await User.findOne({ email });
    if (!user || (user.accountStatus || "active") !== "active" || user.role !== "member" || user.agencyId)
        return sendJson(res, 404, { status: "error", message: "Eligible member account not found" });
    if (user.clientId && String(user.clientId) !== String(client._id))
        return sendJson(res, 409, { status: "error", message: "This user already belongs to another client." });
    user.clientId = client._id;
    user.clientRole = role;
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();
    return sendJson(res, 200, { status: "success", componentData: { data: { member: { id: user.id, name: user.name, email: user.email, clientRole: role } } } });
};

export const removeClientMember = async (req, res) => {
    if (!await masterViewer(req)) return sendJson(res, 403, { status: "error", message: "Access denied" });
    const user = await User.findOne({ _id: req.params.userId, clientId: req.params.id });
    if (!user) return sendJson(res, 404, { status: "error", message: "Client member not found" });
    user.clientId = null;
    user.clientRole = "none";
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();
    return sendJson(res, 200, { status: "success" });
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

export const createClient = async (req, res) => {
    try {
        const { name, slug, contactEmail, contactPhone, website, branding, globalBrand } = req.body;
        if (!name || !slug) {
            return sendJson(res, 400, { status: "error", message: "name and slug are required" });
        }
        const existing = await Client.findOne({ slug: slug.toLowerCase().trim() });
        if (existing) {
            return sendJson(res, 409, {
                status: "error",
                message: `Client with slug "${slug}" already exists`,
            });
        }
        const client = await Client.create({
            name: name.trim(),
            slug: slug.toLowerCase().trim(),
            contactEmail: contactEmail || "",
            contactPhone: contactPhone || "",
            website: website || "",
            branding: branding || undefined,
            globalBrand: globalBrand || undefined,
        });
        return sendJson(res, 201, {
            status: "success",
            componentData: { data: { client } },
            message: "Client created",
        });
    } catch (error) {
        return sendJson(res, 500, {
            status: "error",
            message: "Failed to create client",
            error: error.message,
        });
    }
};

export const updateClient = async (req, res) => {
    try {
        const { name, slug, status, contactEmail, contactPhone, website, branding, globalBrand } =
            req.body;
        const update = {};
        if (name !== undefined) update.name = name.trim();
        if (slug !== undefined) update.slug = slug.toLowerCase().trim();
        if (status !== undefined) update.status = status;
        if (contactEmail !== undefined) update.contactEmail = contactEmail;
        if (contactPhone !== undefined) update.contactPhone = contactPhone;
        if (website !== undefined) update.website = website;
        if (branding !== undefined) update.branding = branding;
        if (globalBrand !== undefined) update.globalBrand = globalBrand;

        const client = await Client.findByIdAndUpdate(
            req.params.id,
            { $set: update },
            { new: true, runValidators: true },
        ).lean();
        if (!client) return sendJson(res, 404, { status: "error", message: "Client not found" });
        return sendJson(res, 200, {
            status: "success",
            componentData: { data: { client } },
            message: "Client updated",
        });
    } catch (error) {
        return sendJson(res, 500, {
            status: "error",
            message: "Failed to update client",
            error: error.message,
        });
    }
};

export const deleteClient = async (req, res) => {
    try {
        const client = await Client.findByIdAndDelete(req.params.id);
        if (!client) return sendJson(res, 404, { status: "error", message: "Client not found" });
        await User.updateMany(
            { clientId: client._id },
            { $set: { clientId: null, clientRole: "none" }, $inc: { tokenVersion: 1 } },
        );
        return sendJson(res, 200, { status: "success", message: "Client deleted" });
    } catch (error) {
        return sendJson(res, 500, {
            status: "error",
            message: "Failed to delete client",
            error: error.message,
        });
    }
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
        const updatePath = `branding.${product}.logoSrc`;
        const client = await Client.findByIdAndUpdate(
            id,
            { $set: { [updatePath]: url } },
            { new: true },
        ).lean();
        if (!client) return sendJson(res, 404, { status: "error", message: "Client not found" });

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
        const client = await Client.findOne({ slug: req.params.slug, status: "active" }).lean();
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
