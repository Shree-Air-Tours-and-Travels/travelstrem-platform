import Client from "../models/Client.js";

const sendJson = (res, statusCode, body) => res.status(statusCode).json(body);

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
