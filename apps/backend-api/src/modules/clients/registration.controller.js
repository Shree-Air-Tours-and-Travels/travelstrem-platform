import { applyProcessAction, getProcessSnapshot } from "@packages/trem-process-engine";
import { validateFormFields } from "../../../../../packages/trem-form-engine/src/index.js";
import Client from "./models/Client.js";
import ClientRegistration from "./models/ClientRegistration.js";
import { registrationWorkflow } from "./registration.workflow.js";
import { contentHomePage, contentValues } from "./registration.content.js";
import { provisionClient, tenantDatabaseUri } from "./tenantDatabase.service.js";
import asyncHandler from "../../shared/middleware/asyncHandler.js";
import ApiError from "../../shared/errors/ApiError.js";
import config from "../../config/env.js";
import { ROLE_PERMISSIONS } from "../tenancy/permissions.js";

const reply = (res, data) => res.json({ status: "success", componentData: { data } });
const present = async (record) => {
    const definition = await registrationWorkflow(record.data, record.isUpdate);
    return {
        id: record.id,
        status: record.status,
        revision: record.__v,
        values: record.data,
        definition,
        process: getProcessSnapshot(definition, record.process),
        clientId: record.clientId,
        isUpdate: record.isUpdate,
        emailSent: record.emailSent,
    };
};
const find = async (req) => {
    const record = await ClientRegistration.findById(req.params.registrationId);
    if (!record) throw new ApiError(404, "Registration not found.");
    if (
        record.status === "provisioning" &&
        new Date(record.provisioningStartedAt || record.updatedAt).getTime() <
            Date.now() - 15 * 60 * 1000
    ) {
        record.status = "failed";
        await record.save();
    }
    return record;
};
export const startRegistration = asyncHandler(async (req, res) => {
    const client = req.body.clientId ? await Client.findById(req.body.clientId).lean() : null;
    if (req.body.clientId && !client) throw new ApiError(404, "Client not found.");
    const data = client
        ? {
              name: client.name,
              slug: client.slug,
              ...client.business,
              contactEmail: client.contactEmail,
              contactPhone: client.contactPhone,
              ...contentValues(client.homePage),
              ...Object.assign({}, ...Object.values(client.productConfig || {})),
              productAccess: client.productAccess,
              accountModules: client.accountModules?.filter((key) => key !== "dashboard"),
              ...Object.fromEntries(
                  Object.entries(client.modules || {}).map(([key, value]) => [
                      `modules_${key}`,
                      value,
                  ]),
              ),
              partnerEnabled: client.partnerEnabled ? "yes" : "no",
              logoSrc: client.globalBrand?.logoSrc,
              logoDarkSrc: client.globalBrand?.logoDarkSrc,
              faviconSrc: client.globalBrand?.faviconSrc,
              windowTitle: client.globalBrand?.windowTitle,
              brandName: client.globalBrand?.label,
              ...client.theme, themeMode: client.theme?.mode || "light", themeSwitching: client.theme?.allowSwitching === false ? "no" : "yes",
              partnerUrl: client.domains?.partner,
              website: client.website,
              authUrl: client.domains?.auth,
              adminUrl: client.domains?.admin,
              dashboardUrl: client.domains?.dashboard,
              apiUrl: client.domains?.api,
              databaseSecretRef: client.database?.secretRef,
              databaseName: client.database?.name,
              billingEmail: client.billing?.email,
              billingPlan: client.billing?.plan,
              billingCycle: client.billing?.cycle,
              currency: client.currency,
              locale: client.locale,
              adminName: client.administrator?.name,
              adminEmail: client.administrator?.email,
              adminPermissions:
                  client.roles?.client_master_admin || ROLE_PERMISSIONS.client_master_admin,
          }
        : {
              ...contentValues(),
              adminPermissions: ROLE_PERMISSIONS.client_master_admin,
              currency: "INR",
              locale: "en-IN",
              accountModules: ["bookings", "wishlist", "profile", "notifications", "support"],
          };
    const record = await ClientRegistration.create({
        createdBy: req.user.sub,
        clientId: client?._id || null,
        isUpdate: Boolean(client),
        data,
    });
    reply(res, await present(record));
});
export const listRegistrations = asyncHandler(async (_req, res) =>
    reply(
        res,
        await ClientRegistration.find({ status: { $ne: "completed" } })
            .select("data.name status updatedAt clientId isUpdate")
            .sort({ updatedAt: -1 })
            .lean(),
    ),
);
export const getRegistration = asyncHandler(async (req, res) =>
    reply(res, await present(await find(req))),
);
export const deleteRegistration = asyncHandler(async (req, res) => {
    const record = await find(req);
    if (!["draft", "failed"].includes(record.status))
        throw new ApiError(409, "Only unsubmitted registrations can be deleted.");
    if (record.clientId && !record.isUpdate)
        throw new ApiError(409, "This registration has already created a client.");
    await record.deleteOne();
    reply(res, { id: record.id });
});
export const saveRegistration = asyncHandler(async (req, res) => {
    const record = await find(req);
    if (!["draft", "failed"].includes(record.status))
        throw new ApiError(409, "Registration cannot be changed in its current state.");
    if (req.body.revision !== record.__v)
        throw new ApiError(409, "This registration has changed. Reopen it to continue.");
    const definition = await registrationWorkflow(record.data, record.isUpdate);
    const state = getProcessSnapshot(definition, record.process);
    const nodeId = state.currentNodeId;
    const action = req.body.action || "SUBMIT_AND_NEXT";
    if (!["SAVE", "SUBMIT_AND_NEXT", "BACK", "GO_TO"].includes(action))
        throw new ApiError(400, "Unsupported process action.");
    if (action === "GO_TO" && !state.completedStageIds.includes(req.body.targetNodeId))
        throw new ApiError(409, "Complete earlier steps first.");
    const step = definition.steps.find((s) => s.id === nodeId);
    let data = record.data;
    if (!["BACK", "GO_TO"].includes(action)) {
        const validated = validateFormFields(step.fields, req.body.values || {});
        if (!validated.valid)
            return res.status(422).json({
                status: "error",
                message: "Complete the required fields.",
                componentData: { data: { errors: validated.errors } },
            });
        data = { ...data, ...validated.data };
    }
    const updatedDefinition = await registrationWorkflow(data, record.isUpdate);
    // Editing an earlier step invalidates subsequent checkpoints.
    const index = updatedDefinition.steps.findIndex((s) => s.id === nodeId);
    const previous = ["BACK", "GO_TO"].includes(action)
        ? record.process
        : {
              ...record.process,
              completedStageIds: (record.process.completedStageIds || []).filter(
                  (id) => updatedDefinition.steps.findIndex((s) => s.id === id) < index,
              ),
              completedNodeIds: (record.process.completedNodeIds || []).filter(
                  (id) => updatedDefinition.steps.findIndex((s) => s.id === id) < index,
              ),
          };
    const transition = applyProcessAction(updatedDefinition, previous, {
        nodeId,
        action,
        targetNodeId: req.body.targetNodeId,
        data,
    });
    if (!transition.ok) throw new ApiError(422, "Complete this step before continuing.");
    record.data = data;
    record.process = transition.process;
    record.status = "draft";
    await record.save();
    reply(res, await present(record));
});
const origin = (value) => {
    let parsed;
    try {
        parsed = new URL(value);
    } catch {
        throw new ApiError(400, "Enter a valid domain origin.");
    }
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname);
    if (
        parsed.username ||
        parsed.password ||
        parsed.search ||
        parsed.hash ||
        parsed.pathname !== "/" ||
        (parsed.protocol !== "https:" &&
            !(config.IS_DEVELOPMENT && local && parsed.protocol === "http:"))
    )
        throw new ApiError(
            400,
            "Domains must be HTTPS origins (local HTTP is allowed in development).",
        );
    return parsed.origin;
};
export const finishRegistration = asyncHandler(async (req, res) => {
    const record = await find(req);
    if (record.status === "completed") return reply(res, await present(record));
    if (req.body.revision !== record.__v)
        throw new ApiError(409, "Reopen this registration before provisioning.");
    const definition = await registrationWorkflow(record.data, record.isUpdate);
    const errors = definition.steps.flatMap((step) =>
        Object.values(validateFormFields(step.fields, record.data).errors),
    );
    if (errors.length) throw new ApiError(422, errors.join(" "));
    if (getProcessSnapshot(definition, record.process).status !== "COMPLETED")
        throw new ApiError(409, "Complete every registration step and confirm the review first.");
    const lock = await ClientRegistration.updateOne(
        { _id: record._id, __v: record.__v, status: { $in: ["draft", "failed"] } },
        { $set: { status: "provisioning", provisioningStartedAt: new Date() }, $inc: { __v: 1 } },
    );
    if (!lock.modifiedCount) throw new ApiError(409, "Provisioning is already in progress.");
    record.__v += 1;
    record.status = "provisioning";
    record.provisioningStartedAt = new Date();
    try {
        const d = record.data;
        const domains = {
            website: origin(d.website),
            auth: origin(d.authUrl),
            admin: origin(d.adminUrl),
            dashboard: origin(d.dashboardUrl),
            api: origin(d.apiUrl),
            ...(d.partnerEnabled === "yes" &&
            d.productAccess.some((key) => ["trevio", "trevista"].includes(key))
                ? { partner: origin(d.partnerUrl) }
                : {}),
        };
        const duplicate = await Client.findOne({
            _id: { $ne: record.clientId },
            $or: [
                { slug: d.slug },
                ...Object.values(domains).map((value) => ({
                    $or: Object.keys(domains).map((key) => ({ [`domains.${key}`]: value })),
                })),
                { "database.secretRef": d.databaseSecretRef, "database.name": d.databaseName },
            ],
        }).lean();
        if (duplicate)
            throw new ApiError(
                409,
                "The tenant identifier, website, or database is already assigned.",
            );
        const modules = Object.fromEntries(
            d.productAccess.map((key) => [key, d[`modules_${key}`] || []]),
        );
        const editing = record.isUpdate;
        const client = record.clientId ? await Client.findById(record.clientId) : new Client();
        if (!client) throw new ApiError(404, "Client no longer exists.");
        if (
            client.database?.secretRef &&
            (client.database.secretRef !== d.databaseSecretRef ||
                client.database.name !== d.databaseName)
        )
            throw new ApiError(
                409,
                "Changing an existing tenant database requires a separate data migration.",
            );
        Object.assign(client, {
            name: d.name,
            slug: d.slug,
            status: editing ? client.status : "inactive",
            contactEmail: d.contactEmail,
            contactPhone: d.contactPhone,
            website: domains.website,
            domains,
            business: {
                legalName: d.legalName,
                registrationNumber: d.registrationNumber,
                taxNumber: d.taxNumber,
                address: d.address,
            },
            database: { secretRef: d.databaseSecretRef, name: d.databaseName },
            productAccess: d.productAccess,
            modules,
            accountModules: [...new Set(["dashboard", ...(d.accountModules || [])])],
            partnerEnabled:
                d.productAccess.some((key) => ["trevio", "trevista"].includes(key)) &&
                d.partnerEnabled === "yes",
            branding: Object.fromEntries(
                d.productAccess.map((key) => [key, { name: d.brandName, logoSrc: d.logoSrc }]),
            ),
            globalBrand: { label: d.brandName, logoSrc: d.logoSrc, logoDarkSrc: d.logoDarkSrc || d.logoSrc, faviconSrc: d.faviconSrc, windowTitle: d.windowTitle },
            homePage: contentHomePage(client.homePage?.toObject() || {}, d),
            configVersion: (client.configVersion || 0) + 1,
            theme: { primaryColor: d.primaryColor, darkPrimaryColor: d.darkPrimaryColor, mode: d.themeMode || client.theme?.mode || "light", allowSwitching: d.themeSwitching ? d.themeSwitching !== "no" : client.theme?.allowSwitching !== false, light: client.theme?.light, dark: client.theme?.dark },
            roles: {
                client_master_admin: ROLE_PERMISSIONS.client_master_admin,
                client_admin: ROLE_PERMISSIONS.client_admin,
                client_agent: [],
            },
            administrator: { name: d.adminName, email: d.adminEmail.toLowerCase() },
            billing: { email: d.billingEmail, plan: d.billingPlan, cycle: d.billingCycle },
            locale: d.locale,
            currency: d.currency,
            createdBy: record.createdBy,
            updatedBy: req.user.sub,
            productConfig: Object.fromEntries(
                definition.steps
                    .filter((s) => s.id.startsWith("product-"))
                    .map((s) => [
                        s.id.slice(8),
                        Object.fromEntries(s.fields.map((f) => [f.name, d[f.name]])),
                    ]),
            ),
        });
        const candidateUri = new URL(tenantDatabaseUri(client));
        const others = await Client.find({
            _id: { $ne: client._id },
            "database.secretRef": { $exists: true },
        })
            .select("database")
            .lean();
        for (const other of others) {
            const existingUri = new URL(tenantDatabaseUri(other));
            if (
                candidateUri.host === existingUri.host &&
                candidateUri.pathname === existingUri.pathname
            )
                throw new ApiError(409, "This database is already assigned to another tenant.");
        }
        await client.save();
        record.clientId = client._id;
        await record.save();
        const result = await provisionClient(client, req.user.sub, { invite: !editing });
        if (!editing) client.status = "active";
        client.provisioning = { status: "ready", emailSent: editing ? client.provisioning?.emailSent : result.emailSent };
        await client.save();
        await provisionClient(client, req.user.sub, { invite: false });
        record.status = "completed";
        record.emailSent = !editing && result.emailSent;
        await record.save();
        reply(res, {
            ...(await present(record)),
            invitation: {
                emailSent: !editing && result.emailSent,
                alreadyActive: editing || result.alreadyActive || false,
            },
        });
    } catch (error) {
        record.status = "failed";
        await record.save();
        throw new ApiError(
            error.status || 503,
            error.status
                ? error.message
                : "Tenant provisioning failed. Check database connectivity and retry this registration.",
        );
    }
});
