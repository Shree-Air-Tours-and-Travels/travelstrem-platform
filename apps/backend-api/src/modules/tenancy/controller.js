import mongoose from "mongoose";
import PartnershipRequest from "./models/PartnershipRequest.js";
import Product from "./models/Product.js";
import PartnerAgency from "../auth/models/PartnerAgency.js";
import User from "../auth/models/User.js";
import Invitation from "./models/Invitation.js";
import AgentDeletionRequest from "./models/AgentDeletionRequest.js";
import AgencyCustomer from "./models/AgencyCustomer.js";
import AuditLog from "./models/AuditLog.js";
import Notification from "./models/Notification.js";
import Role from "./models/Role.js";
import ProductAccessRequest from "./models/ProductAccessRequest.js";
import Tour from "../tours/models/Tour.js";
import TrevioTrip from "../trevio/models/TrevioTrip.js";
import Booking from "../bookings/models/Booking.js";
import RefreshToken from "../auth/models/RefreshToken.js";
import { audit } from "./audit.service.js";
import { inviteUser, activateInvitation, revokeSessions, renewInvitation } from "./tenancy.service.js";
import { sendInvitationEmail, sendTenantNotificationEmail } from "../../services/email.service.js";
import config from "../../config/index.js";
import { PERMISSIONS, ROLE_PERMISSIONS } from "./permissions.js";
import { normalizeProductKeys } from "./productCatalog.js";

const ok = (res, data, message = "OK", status = 200) => res.status(status).json({ status: "success", message, componentData: { data } });
const fail = (res, error, fallback = "Request failed") => res.status(error.status || 500).json({ status: "error", message: error.status ? error.message : fallback });
const escapeRegex = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const page = (req) => ({ skip: Math.max(0, Number(req.query.skip) || 0), limit: Math.min(100, Math.max(1, Number(req.query.limit) || 20)) });
const agencyRef = (name) => `partner-${String(name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${Math.random().toString(36).slice(2, 6)}`;
const fileData = (file) => ({ name: file.originalname, url: file.secure_url || file.path || file.url, mimeType: file.mimetype, size: file.size });
const uploadedFiles = (req, field) => Array.isArray(req.files) ? (field === "documents" ? req.files : []) : (req.files?.[field] || []);
const publicRequest = (record) => ({ ...record, documents: (record.documents || []).map(({ _id, name, mimeType, size }) => ({ _id, name, mimeType, size })) });
const notifyByEmail = (payload) => sendTenantNotificationEmail(payload).catch((error) => ({ success: false, message: error.message }));

export async function submitPartnershipRequest(req, res) {
  try {
    let body;
    try { body = typeof req.body.payload === "string" ? JSON.parse(req.body.payload) : req.body; }
    catch { throw Object.assign(new Error("Partnership request payload must be valid JSON."), { status: 400 }); }
    const companyEmail = String(body.companyEmail || "").trim().toLowerCase();
    const contactEmail = String(body.primaryContact?.email || "").trim().toLowerCase();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phonePattern = /^\+?[0-9][0-9\s()-]{6,19}$/;
    if (!body.agencyName || !companyEmail || !body.primaryContact?.fullName || !contactEmail) return res.status(400).json({ status: "error", message: "Agency name, company email, and primary contact are required." });
    if (!emailPattern.test(companyEmail) || !emailPattern.test(contactEmail)) return res.status(400).json({ status: "error", message: "Enter valid company and primary-contact email addresses." });
    if (body.companyPhone && !phonePattern.test(String(body.companyPhone))) return res.status(400).json({ status: "error", message: "Enter a valid company phone number." });
    if (body.primaryContact.mobile && !phonePattern.test(String(body.primaryContact.mobile))) return res.status(400).json({ status: "error", message: "Enter a valid primary-contact mobile number." });
    const duplicate = await PartnershipRequest.exists({ status: { $nin: ["rejected", "converted"] }, $or: [{ companyEmail }, ...["registrationNumber", "gstNumber", "panNumber"].filter((key) => body[key]).map((key) => ({ [key]: String(body[key]).trim().toUpperCase() }))] });
    if (duplicate) return res.status(409).json({ status: "error", message: "An active partnership request already exists for this business." });
    const request = await PartnershipRequest.create({
      agencyName: String(body.agencyName).trim(), legalName: String(body.legalName || "").trim(), registrationNumber: String(body.registrationNumber || "").trim(),
      gstNumber: String(body.gstNumber || "").trim(), panNumber: String(body.panNumber || "").trim(), website: String(body.website || "").trim(),
      companyEmail, companyPhone: String(body.companyPhone || "").trim(), address: body.address || {}, logo: uploadedFiles(req, "logo")[0] ? fileData(uploadedFiles(req, "logo")[0]).url : "",
      yearsInBusiness: Number(body.yearsInBusiness) || 0, numberOfEmployees: Number(body.numberOfEmployees) || 0, approximateCustomerBase: Number(body.approximateCustomerBase) || 0,
      servicesOffered: (body.servicesOffered || []).map((value) => String(value).trim()).filter(Boolean), requestedProducts: [], notes: String(body.notes || "").trim(),
      primaryContact: { fullName: String(body.primaryContact.fullName).trim(), designation: String(body.primaryContact.designation || "").trim(), email: contactEmail, mobile: String(body.primaryContact.mobile || "").trim() },
      documents: uploadedFiles(req, "documents").map(fileData), status: "submitted", history: [{ status: "submitted", note: "Partnership request submitted." }],
    });
    await audit(req, { action: "partnership_request.submitted", entityType: "PartnershipRequest", entityId: request._id, after: request.toObject() });
    void notifyByEmail({ to: companyEmail, recipientName: request.primaryContact.fullName, title: "Partnership request received", message: `We received the partnership request for ${request.agencyName}. Our team will review it and contact you with the next step.` });
    return ok(res, { requestId: request.id, status: request.status }, "Partnership request submitted.", 201);
  } catch (error) { return fail(res, error, "Failed to submit partnership request."); }
}

export async function listPartnershipRequests(req, res) {
  try { const { skip, limit } = page(req); const query = {}; if (req.query.status) query.status = req.query.status; if (req.query.search) query.$or = ["agencyName", "companyEmail", "gstNumber", "panNumber"].map((key) => ({ [key]: new RegExp(escapeRegex(req.query.search), "i") })); const [items, total] = await Promise.all([PartnershipRequest.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(), PartnershipRequest.countDocuments(query)]); return ok(res, { items: items.map(publicRequest), total, skip, limit }); } catch (error) { return fail(res, error); }
}

export async function getPartnershipRequest(req, res) { try { const record = await PartnershipRequest.findById(req.params.id).lean(); if (!record) return res.status(404).json({ status: "error", message: "Partnership request not found." }); return ok(res, publicRequest(record)); } catch (error) { return fail(res, error); } }
export async function downloadPartnershipDocument(req, res) { try { const record = await PartnershipRequest.findById(req.params.id).lean(); const document = record?.documents?.find((item) => String(item._id) === String(req.params.documentId)); if (!document?.url) return res.status(404).json({ status: "error", message: "Document not found." }); const target = new URL(document.url); if (target.protocol !== "https:" && target.protocol !== "http:") return res.status(400).json({ status: "error", message: "Document location is invalid." }); await audit(req, { action: "partnership_document.viewed", entityType: "PartnershipRequest", entityId: record._id }); return res.redirect(302, target.toString()); } catch (error) { return fail(res, error); } }

const requestTransitions = { submitted: ["under_review"], under_review: ["additional_information_required", "approved", "rejected"], additional_information_required: ["submitted", "under_review"], approved: ["converted"] };
export async function reviewPartnershipRequest(req, res) {
  try { const record = await PartnershipRequest.findById(req.params.id); if (!record) return res.status(404).json({ status: "error", message: "Partnership request not found." }); const next = String(req.body.status || ""); if (!(requestTransitions[record.status] || []).includes(next)) return res.status(409).json({ status: "error", message: `Cannot move request from ${record.status} to ${next}.` }); if (next === "rejected" && !String(req.body.reason || "").trim()) return res.status(400).json({ status: "error", message: "A rejection reason is required." }); const before = record.toObject(); record.status = next; if (next === "rejected") record.rejectionReason = String(req.body.reason || ""); if (req.body.internalNote) record.internalNotes.push({ note: req.body.internalNote, createdBy: req.access.user._id }); record.history.push({ status: next, note: req.body.reason || req.body.message || "", changedBy: req.access.user._id }); await record.save(); await audit(req, { action: `partnership_request.${next}`, entityType: "PartnershipRequest", entityId: record._id, before, after: record.toObject() }); const titles = { additional_information_required: "Additional partnership information required", approved: "Partnership request approved", rejected: "Partnership request update" }; if (titles[next]) void notifyByEmail({ to: record.companyEmail, recipientName: record.primaryContact.fullName, title: titles[next], message: req.body.message || req.body.reason || `Your partnership request for ${record.agencyName} is now ${next.replaceAll("_", " ")}.` }); return ok(res, publicRequest(record.toObject()), "Partnership request updated."); } catch (error) { return fail(res, error); }
}

export async function convertPartnershipRequest(req, res) {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const request = await PartnershipRequest.findOne({ _id: req.params.id, status: "approved", convertedAgency: null }).session(session);
      if (!request) throw Object.assign(new Error("Only an approved, unconverted request can be converted."), { status: 409 });
      const products = normalizeProductKeys(req.body.products);
      if (!products.length) throw Object.assign(new Error("Assign at least one active product before creating the agency."), { status: 400 });
      const validProducts = await Product.find({ key: { $in: products }, status: "active" }).session(session).lean();
      if (validProducts.length !== products.length) {
        const validKeys = new Set(validProducts.map((product) => product.key));
        const invalidKeys = products.filter((key) => !validKeys.has(key));
        throw Object.assign(new Error(`These products are unavailable or inactive: ${invalidKeys.join(", ")}.`), { status: 400 });
      }
      const [agency] = await PartnerAgency.create([{ agencyName: req.body.agencyName || request.agencyName, legalName: req.body.legalName || request.legalName, partnerAgencyRef: agencyRef(request.agencyName), contactName: request.primaryContact.fullName, contactEmail: request.companyEmail, contactPhone: request.companyPhone, website: request.website, gstNumber: request.gstNumber, panNumber: request.panNumber, registrationNumber: request.registrationNumber, address: request.address, logo: request.logo, productAccess: products, settings: req.body.settings || {}, status: "active", approvedBy: req.access.user._id, approvedAt: new Date(), convertedFromRequest: request._id }], { session });
      const admin = req.body.partnerAdmin || { name: request.primaryContact.fullName, email: request.primaryContact.email, phone: request.primaryContact.mobile, designation: request.primaryContact.designation };
      const adminProducts = normalizeProductKeys(admin.products?.length ? admin.products : products);
      if (adminProducts.some((key) => !products.includes(key))) throw Object.assign(new Error("Partner Admin products must be assigned to the agency."), { status: 400 });
      const delegable = new Set(ROLE_PERMISSIONS.partner_admin);
      const adminPermissions = [...new Set((admin.permissions || []).map((value) => String(value).trim()))];
      if (adminPermissions.some((value) => !delegable.has(value))) throw Object.assign(new Error("One or more Partner Admin permissions cannot be delegated."), { status: 400 });
      const invited = await inviteUser({ agency, actorId: req.access.user._id, name: admin.name, email: admin.email, phone: admin.phone, designation: admin.designation, agencyRole: "partner_admin", productKeys: adminProducts, permissions: adminPermissions, session });
      request.status = "converted"; request.convertedAgency = agency._id; request.convertedAt = new Date(); request.history.push({ status: "converted", note: "Converted to active agency.", changedBy: req.access.user._id }); await request.save({ session });
      result = { agency, partnerAdmin: invited.user, invitation: { id: invited.invitation.id, emailSent: invited.emailSent, rawToken: invited.rawToken } };
    });
    const activationUrl = `${String(config.PARTNER_URL || config.AUTH_APP_URL || config.SHELL_URL || "").replace(/\/$/, "")}/activate?token=${encodeURIComponent(result.invitation.rawToken || "")}`;
    const email = await sendInvitationEmail({ to: result.partnerAdmin.email, recipientName: result.partnerAdmin.name, agencyName: result.agency.agencyName, roleLabel: "Partner Admin", activationUrl, expiresInHours: config.INVITATION_TTL_HOURS || 48 });
    result.invitation.emailSent = email.success; delete result.invitation.rawToken;
    await audit(req, { action: "agency.created", entityType: "PartnerAgency", entityId: result.agency._id, agencyId: result.agency._id, after: result.agency.toObject() });
    return ok(res, result, "Agency created and Partner Admin invited.", 201);
  } catch (error) { return fail(res, error, "Agency conversion failed and was rolled back."); } finally { await session.endSession(); }
}

export async function activate(req, res) { try { const user = await activateInvitation(req.body); await audit(req, { action: "user.activated", entityType: "User", entityId: user._id, agencyId: user.agencyId }); return ok(res, { email: user.email, accountStatus: user.accountStatus }, "Account activated."); } catch (error) { return fail(res, error); } }

export async function listAgencies(req, res) { try { const { skip, limit } = page(req); const q = {}; if (req.query.status) q.status = req.query.status; if (req.query.search) q.$or = [{ agencyName: new RegExp(escapeRegex(req.query.search), "i") }, { contactEmail: new RegExp(escapeRegex(req.query.search), "i") }]; const [items, total] = await Promise.all([PartnerAgency.find(q).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(), PartnerAgency.countDocuments(q)]); return ok(res, { items, total, skip, limit }); } catch (error) { return fail(res, error); } }
export async function getAgency(req, res) { try { const id = req.access.isMaster ? req.params.id : req.access.agencyId; const agency = await PartnerAgency.findById(id).lean(); if (!agency) return res.status(404).json({ status: "error", message: "Agency not found." }); const [admins, agents, trips, bookings, customers] = await Promise.all([User.countDocuments({ agencyId: id, agencyRole: "partner_admin" }), User.countDocuments({ agencyId: id, agencyRole: "partner_agent" }), TrevioTrip.countDocuments({ agencyId: id }), Booking.countDocuments({ agencyId: id }), AgencyCustomer.countDocuments({ agencyId: id })]); return ok(res, { agency, stats: { admins, agents, trips, bookings, customers } }); } catch (error) { return fail(res, error); } }
export async function updateAgency(req, res) { try {
  const id = req.access.isMaster ? req.params.id : req.access.agencyId;
  const allowed = req.access.isMaster ? ["agencyName", "legalName", "contactName", "contactEmail", "contactPhone", "website", "address", "logo", "productAccess", "settings", "status"] : ["agencyName", "contactName", "contactPhone", "website", "address", "logo"];
  const update = Object.fromEntries(allowed.filter((key) => req.body[key] !== undefined).map((key) => [key, req.body[key]]));
  const before = await PartnerAgency.findById(id).lean();
  if (!before) return res.status(404).json({ status: "error", message: "Agency not found." });
  if (update.status) {
    const transitions = { pending: ["active", "rejected"], approved: ["active", "rejected"], active: ["suspended", "deactivated"], suspended: ["active", "deactivated"], deactivated: ["active"], rejected: [] };
    if (update.status !== before.status && !(transitions[before.status] || []).includes(update.status)) return res.status(409).json({ status: "error", message: `Cannot move agency from ${before.status} to ${update.status}.` });
  }
  if (update.productAccess) {
    update.productAccess = [...new Set(update.productAccess.map((key) => String(key).trim().toLowerCase()))];
    const validCount = await Product.countDocuments({ key: { $in: update.productAccess }, status: "active" });
    if (validCount !== update.productAccess.length) return res.status(400).json({ status: "error", message: "One or more assigned products are invalid." });
  }
  const agency = await PartnerAgency.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true });
  if (["suspended", "deactivated"].includes(agency.status) && agency.status !== before.status) {
    const userIds = await User.find({ agencyId: agency._id }).distinct("_id");
    await Promise.all([User.updateMany({ agencyId: agency._id }, { $inc: { tokenVersion: 1 } }), RefreshToken.deleteMany({ userId: { $in: userIds } })]);
    const admins = await User.find({ agencyId: agency._id, agencyRole: "partner_admin" }).select("_id email name").lean();
    if (admins.length) await Notification.insertMany(admins.map((admin) => ({ userId: admin._id, agencyId: agency._id, type: "agency_status", title: `Agency ${agency.status}`, message: `Your agency workspace is ${agency.status}.` })));
    admins.forEach((admin) => void notifyByEmail({ to: admin.email, recipientName: admin.name, title: `Agency ${agency.status}`, message: `Your TravelsTREM agency workspace has been ${agency.status}. Contact platform support if you need assistance.` }));
  }
  const action = update.status && update.status !== before.status ? `agency.${agency.status}` : update.productAccess ? "agency.products_updated" : "agency.updated";
  await audit(req, { action, entityType: "PartnerAgency", entityId: agency._id, agencyId: agency._id, before, after: agency.toObject() });
  return ok(res, agency, "Agency updated.");
} catch (error) { return fail(res, error); } }

export async function listAgents(req, res) { try { const agencyId = req.access.isMaster ? req.params.agencyId : req.access.agencyId; const { skip, limit } = page(req); const q = { agencyId, agencyRole: { $in: ["partner_admin", "partner_agent"] } }; if (req.query.status) q.accountStatus = req.query.status; const [items, total] = await Promise.all([User.find(q).select("name email phone designation agencyRole accountStatus productAccess permissionGrants createdAt activatedAt").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(), User.countDocuments(q)]); return ok(res, { items, total, skip, limit }); } catch (error) { return fail(res, error); } }
export async function inviteAgent(req, res) { try {
  const agencyId = req.access.isMaster ? req.params.agencyId : req.access.agencyId;
  const agency = await PartnerAgency.findById(agencyId);
  if (!agency || agency.status !== "active") return res.status(409).json({ status: "error", message: "Agency is not active." });
  const agencyRole = req.body.agencyRole === "partner_admin" && req.access.isMaster ? "partner_admin" : "partner_agent";
  const requestedProducts = [...new Set((req.body.productKeys || []).map((key) => String(key).trim().toLowerCase()))];
  const invalidProducts = requestedProducts.filter((key) => !agency.productAccess.includes(key));
  if (invalidProducts.length) return res.status(400).json({ status: "error", message: `Products are not enabled for this agency: ${invalidProducts.join(", ")}.` });
  if (agencyRole === "partner_agent" && Number(agency.settings?.agentLimit) > 0) {
    const currentAgents = await User.countDocuments({ agencyId, agencyRole: "partner_agent", accountStatus: { $ne: "anonymized" } });
    if (currentAgents >= Number(agency.settings.agentLimit)) return res.status(409).json({ status: "error", message: "This agency has reached its agent limit." });
  }
  const delegable = new Set(ROLE_PERMISSIONS.partner_admin);
  const requestedPermissions = [...new Set((req.body.permissions || []).map((value) => String(value).trim()))];
  if (requestedPermissions.some((value) => !delegable.has(value) || (!req.access.isMaster && !req.access.permissions.has(value)))) return res.status(400).json({ status: "error", message: "One or more permissions cannot be delegated." });
  const result = await inviteUser({ agency, actorId: req.access.user._id, ...req.body, permissions: requestedPermissions, agencyRole, productKeys: requestedProducts });
  await Notification.create({ userId: result.user._id, agencyId, type: "invitation", title: "Welcome to your agency workspace", message: `Your ${agencyRole === "partner_admin" ? "Partner Admin" : "Partner Agent"} account has been created.` });
  await audit(req, { action: "user.invited", entityType: "User", entityId: result.user._id, agencyId });
  return ok(res, { user: result.user, invitation: { id: result.invitation.id, emailSent: result.emailSent } }, "Invitation created.", 201);
} catch (error) { return fail(res, error); } }
export async function updateAgent(req, res) { try {
  const agent = await User.findOne({ _id: req.params.id, agencyId: req.access.isMaster ? { $exists: true } : req.access.agencyId, ...(!req.access.isMaster ? { agencyRole: "partner_agent" } : {}) });
  if (!agent) return res.status(404).json({ status: "error", message: "Agent not found." });
  const before = agent.toObject();
  const agency = await PartnerAgency.findById(agent.agencyId).lean();
  if (req.body.productAccess !== undefined) {
    const products = [...new Set(req.body.productAccess.map((key) => String(key).trim().toLowerCase()))];
    if (products.some((key) => !agency.productAccess.includes(key))) return res.status(400).json({ status: "error", message: "A user cannot receive a product that is not assigned to the agency." });
    agent.productAccess = products;
  }
  const knownPermissions = new Set(Object.values(PERMISSIONS));
  const delegablePermissions = new Set(ROLE_PERMISSIONS.partner_admin);
  for (const key of ["permissionGrants", "permissionDenials"]) if (req.body[key] !== undefined) {
    const values = [...new Set(req.body[key].map((value) => String(value).trim()))];
    if (values.some((value) => !knownPermissions.has(value) || !delegablePermissions.has(value) || (!req.access.isMaster && !req.access.permissions.has(value)))) return res.status(400).json({ status: "error", message: "One or more permissions cannot be delegated." });
    agent[key] = values;
  }
  for (const key of ["name", "phone", "designation"]) if (req.body[key] !== undefined) agent[key] = req.body[key];
  if (req.body.accountStatus && ["active", "suspended", "deactivated"].includes(req.body.accountStatus)) {
    if (agent.accountStatus === "invited" && req.body.accountStatus === "active") return res.status(409).json({ status: "error", message: "Invited users must activate their account using the invitation link." });
    agent.accountStatus = req.body.accountStatus;
    if (req.body.accountStatus !== "active") { agent.deactivatedAt = new Date(); await revokeSessions(agent); }
    else agent.deactivatedAt = null;
  }
  await agent.save();
  await audit(req, { action: before.accountStatus !== agent.accountStatus ? `agent.${agent.accountStatus}` : "agent.updated", entityType: "User", entityId: agent._id, agencyId: agent.agencyId, before, after: agent.toObject() });
  return ok(res, agent, "Agent updated.");
} catch (error) { return fail(res, error); } }
export async function resendInvitation(req, res) { try { const user = await User.findById(req.params.id); if (!user || (!req.access.isMaster && (String(user.agencyId) !== req.access.agencyId || user.agencyRole !== "partner_agent"))) return res.status(404).json({ status: "error", message: "Pending invitation not found." }); const agency = await PartnerAgency.findById(user.agencyId); const result = await renewInvitation({ user, agency, actorId: req.access.user._id }); await audit(req, { action: "user.invitation_resent", entityType: "User", entityId: user._id, agencyId: user.agencyId }); return ok(res, { invitationId: result.invitation.id, emailSent: result.emailSent }, "Invitation resent."); } catch (error) { return fail(res, error); } }

export async function createDeletionRequest(req, res) { try {
  const reason = String(req.body.reason || "").trim();
  if (reason.length < 10) return res.status(400).json({ status: "error", message: "Please provide a deletion reason of at least 10 characters." });
  const agent = await User.findOne({ _id: req.params.id, agencyId: req.access.agencyId, agencyRole: "partner_agent", accountStatus: { $ne: "anonymized" } });
  if (!agent) return res.status(404).json({ status: "error", message: "Agent not found." });
  if (await AgentDeletionRequest.exists({ agentId: agent._id, status: "pending" })) return res.status(409).json({ status: "error", message: "A deletion request is already pending for this agent." });
  const record = await AgentDeletionRequest.create({ agencyId: req.access.agencyId, agentId: agent._id, requestedBy: req.access.user._id, reason });
  const masters = await User.find({ role: "admin", adminLevel: "master", adminApprovalStatus: "approved" }).select("_id").lean();
  if (masters.length) await Notification.insertMany(masters.map((master) => ({ userId: master._id, agencyId: record.agencyId, type: "agent_deletion_request", title: "Agent deletion approval required", message: `${agent.name} has a pending permanent-deletion request.`, data: { requestId: record._id, agentId: agent._id } })));
  await audit(req, { action: "agent.deletion_requested", entityType: "AgentDeletionRequest", entityId: record._id, agencyId: record.agencyId });
  return ok(res, record, "Permanent deletion request submitted.", 201);
} catch (error) { return fail(res, error); } }
export async function decideDeletionRequest(req, res) { try {
  const record = await AgentDeletionRequest.findById(req.params.id);
  if (!record || record.status !== "pending") return res.status(404).json({ status: "error", message: "Pending deletion request not found." });
  const decision = req.body.status;
  if (!["approved", "rejected"].includes(decision)) return res.status(400).json({ status: "error", message: "Decision must be approved or rejected." });
  record.status = decision; record.decisionBy = req.access.user._id; record.decisionNotes = req.body.notes; record.decisionDate = new Date();
  if (decision === "approved") {
    const [user, booking, trevioTrip, tour, customer] = await Promise.all([
      User.findById(record.agentId), Booking.exists({ assignedAgent: record.agentId }), TrevioTrip.exists({ ownerAgent: record.agentId }),
      Tour.exists({ ownerAgent: record.agentId }), AgencyCustomer.exists({ ownerAgent: record.agentId }),
    ]);
    if (!user) return res.status(404).json({ status: "error", message: "Agent account no longer exists." });
    if (booking || trevioTrip || tour || customer) {
      user.name = "Former agent"; user.email = `anonymized-${user._id}@invalid.local`; user.phone = "";
      user.designation = ""; user.productAccess = []; user.permissionGrants = []; user.permissionDenials = [];
      user.accountStatus = "anonymized"; user.deactivatedAt = new Date(); await revokeSessions(user);
    } else {
      await Promise.all([Invitation.deleteMany({ userId: user._id }), RefreshToken.deleteMany({ userId: user._id }), User.deleteOne({ _id: user._id })]);
    }
    record.status = "completed";
  }
  await record.save();
  await Notification.create({ userId: record.requestedBy, agencyId: record.agencyId, type: "agent_deletion_decision", title: `Agent deletion ${record.status}`, message: req.body.notes || `The deletion request is ${record.status}.`, data: { requestId: record._id } });
  await audit(req, { action: `agent.deletion_${record.status}`, entityType: "AgentDeletionRequest", entityId: record._id, agencyId: record.agencyId });
  return ok(res, record, "Deletion request updated.");
} catch (error) { return fail(res, error); } }

function customerScope(req, extra = {}) { const scope = { ...extra, agencyId: req.access.agencyId }; if (req.access.role === "partner_agent" && !req.access.agency?.settings?.sharedCustomers) scope.ownerAgent = req.access.user._id; return scope; }
export async function listCustomers(req, res) { try { const { skip, limit } = page(req); const q = customerScope(req, { deletedAt: null }); const [items, total] = await Promise.all([AgencyCustomer.find(q).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(), AgencyCustomer.countDocuments(q)]); return ok(res, { items, total, skip, limit }); } catch (error) { return fail(res, error); } }
export async function createCustomer(req, res) { try { const customer = await AgencyCustomer.create({ ...req.body, agencyId: req.access.agencyId, ownerAgent: req.body.ownerAgent && req.access.role === "partner_admin" ? req.body.ownerAgent : req.access.user._id, createdBy: req.access.user._id, updatedBy: req.access.user._id }); await audit(req, { action: "customer.created", entityType: "AgencyCustomer", entityId: customer._id, agencyId: customer.agencyId }); return ok(res, customer, "Customer created.", 201); } catch (error) { return fail(res, error); } }
export async function updateCustomer(req, res) { try { const customer = await AgencyCustomer.findOne(customerScope(req, { _id: req.params.id, deletedAt: null })); if (!customer) return res.status(404).json({ status: "error", message: "Customer not found." }); for (const key of ["name", "email", "phone", "notes"]) if (req.body[key] !== undefined) customer[key] = req.body[key]; if (req.body.ownerAgent && req.access.role === "partner_admin") customer.ownerAgent = req.body.ownerAgent; customer.updatedBy = req.access.user._id; await customer.save(); await audit(req, { action: "customer.updated", entityType: "AgencyCustomer", entityId: customer._id, agencyId: customer.agencyId }); return ok(res, customer, "Customer updated."); } catch (error) { return fail(res, error); } }

export async function reports(req, res) { try {
  const agencyId = req.access.isMaster ? req.query.agencyId : req.access.agencyId;
  if (!agencyId || !mongoose.isValidObjectId(agencyId)) return res.status(400).json({ status: "error", message: "A valid agencyId is required." });
  const agentScope = req.access.role === "partner_agent" ? { ownerAgent: req.access.user._id } : {};
  const bookingScope = req.access.role === "partner_agent" ? { assignedAgent: req.access.user._id } : {};
  const customerQuery = req.access.isMaster ? { agencyId, deletedAt: null } : customerScope(req, { deletedAt: null });
  const [activeAgents, inactiveAgents, totalTrips, publishedTrips, totalBookings, bookingStatuses, customers] = await Promise.all([
    User.countDocuments({ agencyId, agencyRole: "partner_agent", accountStatus: "active" }),
    User.countDocuments({ agencyId, agencyRole: "partner_agent", accountStatus: { $ne: "active" } }),
    TrevioTrip.countDocuments({ agencyId, ...agentScope }), TrevioTrip.countDocuments({ agencyId, ...agentScope, status: { $in: ["listed", "published"] }, isListed: true }),
    Booking.countDocuments({ agencyId, ...bookingScope }), Booking.aggregate([{ $match: { agencyId: new mongoose.Types.ObjectId(agencyId), ...bookingScope } }, { $group: { _id: "$status", count: { $sum: 1 }, value: { $sum: "$paymentSummary.total" } } }]),
    AgencyCustomer.countDocuments(customerQuery),
  ]);
  return ok(res, { activeAgents, inactiveAgents, totalTrips, publishedTrips, totalBookings, bookingStatuses, customers });
} catch (error) { return fail(res, error); } }
export async function listAudit(req, res) { try { const { skip, limit } = page(req); const q = req.access.isMaster && req.query.agencyId ? { agencyId: req.query.agencyId } : req.access.isMaster ? {} : { agencyId: req.access.agencyId }; const [items, total] = await Promise.all([AuditLog.find(q).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(), AuditLog.countDocuments(q)]); return ok(res, { items, total, skip, limit }); } catch (error) { return fail(res, error); } }
export async function listProducts(req, res) { try { return ok(res, await Product.find({}).sort({ name: 1 }).lean()); } catch (error) { return fail(res, error); } }

export async function listProductAccessRequests(req, res) {
  try {
    const { skip, limit } = page(req);
    const query = req.access.isMaster ? {} : { agencyId: req.access.agencyId };
    if (req.query.status) query.status = req.query.status;
    const [items, total, products] = await Promise.all([
      ProductAccessRequest.find(query).populate("agencyId", "agencyName partnerAgencyRef productAccess").populate("requestedBy", "name email agencyRole").populate("decidedBy", "name email").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      ProductAccessRequest.countDocuments(query),
      Product.find({ status: "active" }).sort({ name: 1 }).lean(),
    ]);
    return ok(res, { items, total, skip, limit, products });
  } catch (error) { return fail(res, error); }
}

export async function createProductAccessRequest(req, res) {
  try {
    if (req.access.isMaster || req.access.role !== "partner_admin") return res.status(403).json({ status: "error", message: "Only a Partner Admin can request products for an agency." });
    const agency = await PartnerAgency.findById(req.access.agencyId).lean();
    if (!agency || agency.status !== "active") return res.status(409).json({ status: "error", message: "Product access can only be requested for an active agency." });
    const requestedProducts = normalizeProductKeys(req.body.requestedProducts).filter((key) => !agency.productAccess.includes(key));
    if (!requestedProducts.length) return res.status(400).json({ status: "error", message: "Select at least one product that is not already enabled." });
    const validProducts = await Product.find({ key: { $in: requestedProducts }, status: "active" }).lean();
    if (validProducts.length !== requestedProducts.length) return res.status(400).json({ status: "error", message: "One or more requested products are unavailable." });
    const existing = await ProductAccessRequest.exists({ agencyId: agency._id, status: "pending", requestedProducts: { $in: requestedProducts } });
    if (existing) return res.status(409).json({ status: "error", message: "A pending request already includes one of these products." });
    const reason = String(req.body.reason || "").trim();
    if (reason.length < 10) return res.status(400).json({ status: "error", message: "Briefly explain how your agency plans to use the requested products." });
    const record = await ProductAccessRequest.create({ agencyId: agency._id, requestedBy: req.access.user._id, currentProducts: agency.productAccess, requestedProducts, reason });
    await Notification.create({ userId: req.access.user._id, agencyId: agency._id, type: "product_access", title: "Product request submitted", message: `Your request for ${requestedProducts.join(", ")} is awaiting TravelsTREM review.` });
    await audit(req, { action: "agency.product_access_requested", entityType: "ProductAccessRequest", entityId: record._id, agencyId: agency._id, after: record.toObject() });
    return ok(res, record, "Product access request submitted.", 201);
  } catch (error) { return fail(res, error); }
}

export async function decideProductAccessRequest(req, res) {
  const session = await mongoose.startSession();
  try {
    if (!req.access.isMaster) return res.status(403).json({ status: "error", message: "Only a Master Admin can decide product access requests." });
    const decision = String(req.body.status || "");
    if (!["approved", "rejected"].includes(decision)) return res.status(400).json({ status: "error", message: "Decision must be approved or rejected." });
    let result;
    await session.withTransaction(async () => {
      const record = await ProductAccessRequest.findOne({ _id: req.params.id, status: "pending" }).session(session);
      if (!record) throw Object.assign(new Error("Pending product request not found."), { status: 404 });
      const agency = await PartnerAgency.findById(record.agencyId).session(session);
      if (!agency) throw Object.assign(new Error("Agency not found."), { status: 404 });
      if (decision === "approved") {
        agency.productAccess = [...new Set([...agency.productAccess, ...record.requestedProducts])];
        await agency.save({ session });
        await User.updateMany({ agencyId: agency._id, agencyRole: "partner_admin", accountStatus: { $nin: ["deactivated", "suspended"] } }, { $addToSet: { productAccess: { $each: record.requestedProducts } } }, { session });
      }
      record.status = decision; record.decisionNote = String(req.body.decisionNote || "").trim(); record.decidedBy = req.access.user._id; record.decidedAt = new Date();
      await record.save({ session });
      result = { record, agency };
    });
    const admins = await User.find({ agencyId: result.agency._id, agencyRole: "partner_admin", accountStatus: { $nin: ["deactivated", "suspended"] } }).select("_id name email").lean();
    if (admins.length) await Notification.insertMany(admins.map((admin) => ({ userId: admin._id, agencyId: result.agency._id, type: "product_access", title: `Product request ${decision}`, message: decision === "approved" ? `Access enabled for ${result.record.requestedProducts.join(", ")}.` : `Your product request was not approved${result.record.decisionNote ? `: ${result.record.decisionNote}` : "."}` })));
    await audit(req, { action: `agency.product_access_${decision}`, entityType: "ProductAccessRequest", entityId: result.record._id, agencyId: result.agency._id, after: result.record.toObject() });
    return ok(res, { request: result.record, agency: result.agency }, `Product request ${decision}.`);
  } catch (error) { return fail(res, error); } finally { await session.endSession(); }
}

export async function listDeletionRequests(req, res) { try { const { skip, limit } = page(req); const q = req.access.isMaster ? (req.query.agencyId ? { agencyId: req.query.agencyId } : {}) : { agencyId: req.access.agencyId }; if (req.query.status) q.status = req.query.status; const [items, total] = await Promise.all([AgentDeletionRequest.find(q).populate("agentId", "name email accountStatus").populate("requestedBy", "name email").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(), AgentDeletionRequest.countDocuments(q)]); return ok(res, { items, total, skip, limit }); } catch (error) { return fail(res, error); } }

export async function cancelDeletionRequest(req, res) { try { const record = await AgentDeletionRequest.findOne({ _id: req.params.id, agencyId: req.access.agencyId, requestedBy: req.access.user._id, status: "pending" }); if (!record) return res.status(404).json({ status: "error", message: "Pending deletion request not found." }); record.status = "cancelled"; record.decisionDate = new Date(); await record.save(); await audit(req, { action: "agent.deletion_cancelled", entityType: "AgentDeletionRequest", entityId: record._id, agencyId: record.agencyId }); return ok(res, record, "Deletion request cancelled."); } catch (error) { return fail(res, error); } }

export async function transferAgentWork(req, res) {
  const session = await mongoose.startSession();
  try {
    const agencyId = req.access.isMaster ? req.params.agencyId : req.access.agencyId;
    const { fromAgentId, toAgentId } = req.body;
    if (!fromAgentId || !toAgentId || fromAgentId === toAgentId) return res.status(400).json({ status: "error", message: "Different source and destination agents are required." });
    let counts;
    await session.withTransaction(async () => {
      const agents = await User.find({ _id: { $in: [fromAgentId, toAgentId] }, agencyId, agencyRole: "partner_agent" }).session(session);
      if (agents.length !== 2 || agents.find((item) => String(item._id) === String(toAgentId))?.accountStatus !== "active") throw Object.assign(new Error("Both agents must belong to the agency and the destination agent must be active."), { status: 409 });
      const [trevio, trevista, bookings, customers] = await Promise.all([
        TrevioTrip.updateMany({ agencyId, ownerAgent: fromAgentId, status: { $nin: ["archived", "cancelled"] } }, { $set: { ownerAgent: toAgentId, updatedBy: req.access.user._id } }, { session }),
        Tour.updateMany({ agencyId, ownerAgent: fromAgentId, status: { $nin: ["archived", "cancelled"] } }, { $set: { ownerAgent: toAgentId, updatedBy: req.access.user._id } }, { session }),
        Booking.updateMany({ agencyId, assignedAgent: fromAgentId, status: { $nin: ["COMPLETED", "CANCELLED", "REFUNDED"] } }, { $set: { assignedAgent: toAgentId, updatedBy: req.access.user._id } }, { session }),
        AgencyCustomer.updateMany({ agencyId, ownerAgent: fromAgentId, deletedAt: null }, { $set: { ownerAgent: toAgentId, updatedBy: req.access.user._id } }, { session }),
      ]);
      counts = { trevioTrips: trevio.modifiedCount, trevistaTrips: trevista.modifiedCount, bookings: bookings.modifiedCount, customers: customers.modifiedCount };
    });
    await audit(req, { action: "agent.work_transferred", entityType: "User", entityId: fromAgentId, agencyId, after: { toAgentId, counts } });
    return ok(res, counts, "Active work transferred.");
  } catch (error) { return fail(res, error, "Work transfer failed and was rolled back."); } finally { await session.endSession(); }
}

export async function getCustomer(req, res) { try { const customer = await AgencyCustomer.findOne(customerScope(req, { _id: req.params.id, deletedAt: null })).lean(); if (!customer) return res.status(404).json({ status: "error", message: "Customer not found." }); const bookings = await Booking.find({ agencyId: customer.agencyId, customerId: customer._id }).sort({ createdAt: -1 }).limit(50).lean(); return ok(res, { customer, bookings }); } catch (error) { return fail(res, error); } }
export async function archiveCustomer(req, res) { try { const customer = await AgencyCustomer.findOne(customerScope(req, { _id: req.params.id, deletedAt: null })); if (!customer) return res.status(404).json({ status: "error", message: "Customer not found." }); customer.deletedAt = new Date(); customer.updatedBy = req.access.user._id; await customer.save(); await audit(req, { action: "customer.archived", entityType: "AgencyCustomer", entityId: customer._id, agencyId: customer.agencyId }); return ok(res, null, "Customer archived."); } catch (error) { return fail(res, error); } }

export async function dashboard(req, res) { try {
  if (req.access.isMaster) {
    const [pendingRequests, approvedAgencies, activeAgencies, suspendedAgencies, partnerAdmins, partnerAgents, trips, tours, bookings, recentApprovals, recentAudit] = await Promise.all([
      PartnershipRequest.countDocuments({ status: { $in: ["submitted", "under_review", "additional_information_required"] } }), PartnerAgency.countDocuments({ status: { $in: ["approved", "active"] } }), PartnerAgency.countDocuments({ status: "active" }), PartnerAgency.countDocuments({ status: "suspended" }), User.countDocuments({ agencyRole: "partner_admin" }), User.countDocuments({ agencyRole: "partner_agent" }), TrevioTrip.countDocuments({}), Tour.countDocuments({}), Booking.countDocuments({}), PartnershipRequest.find({ status: { $in: ["approved", "converted"] } }).sort({ updatedAt: -1 }).limit(8).select("agencyName companyEmail status updatedAt").lean(), AuditLog.find({}).sort({ createdAt: -1 }).limit(10).lean(),
    ]);
    return ok(res, { pendingRequests, approvedAgencies, activeAgencies, suspendedAgencies, partnerAdmins, partnerAgents, totalTrips: trips + tours, totalBookings: bookings, recentApprovals, recentAudit });
  }
  const agencyId = req.access.agencyId; const agent = req.access.role === "partner_agent" ? req.access.user._id : null;
  const tripScope = agent ? { agencyId, ownerAgent: agent } : { agencyId }; const bookingScope = agent ? { agencyId, assignedAgent: agent } : { agencyId };
  const [activeAgents, inactiveAgents, totalTrips, publishedTrips, draftTrips, upcomingTrips, totalBookings, bookingStatuses, pendingCustomerActions, recentTrips, recentBookings, recentCustomers, recentAgentActivity, productUsage] = await Promise.all([
    User.countDocuments({ agencyId, agencyRole: "partner_agent", accountStatus: "active" }), User.countDocuments({ agencyId, agencyRole: "partner_agent", accountStatus: { $ne: "active" } }),
    TrevioTrip.countDocuments(tripScope), TrevioTrip.countDocuments({ ...tripScope, status: "listed", isListed: true }), TrevioTrip.countDocuments({ ...tripScope, status: "draft" }), TrevioTrip.countDocuments({ ...tripScope, startDate: { $gte: new Date() }, status: { $in: ["listed", "pending_approval"] } }),
    Booking.countDocuments(bookingScope), Booking.aggregate([{ $match: { ...bookingScope, agencyId: new mongoose.Types.ObjectId(agencyId) } }, { $group: { _id: "$status", count: { $sum: 1 } } }]), Booking.countDocuments({ ...bookingScope, status: { $in: ["QUOTE_REQUESTED", "CUSTOMER_ACCEPTED", "PAYMENT_PENDING", "AWAITING_TOKEN_PAYMENT"] } }),
    TrevioTrip.find(tripScope).sort({ updatedAt: -1 }).limit(5).lean(), Booking.find(bookingScope).sort({ updatedAt: -1 }).limit(5).lean(), AgencyCustomer.find(customerScope(req, { deletedAt: null })).sort({ updatedAt: -1 }).limit(5).lean(),
    AuditLog.find({ agencyId, ...(agent ? { actorId: agent } : {}) }).sort({ createdAt: -1 }).limit(8).lean(),
    Booking.aggregate([{ $match: { agencyId: new mongoose.Types.ObjectId(agencyId), ...bookingScope } }, { $group: { _id: "$product", bookings: { $sum: 1 }, value: { $sum: "$paymentSummary.total" } } }]),
  ]);
  return ok(res, { activeAgents, inactiveAgents, totalTrips, publishedTrips, draftTrips, upcomingTrips, totalBookings, bookingStatuses, pendingCustomerActions, recentTrips, recentBookings, recentCustomers, recentAgentActivity, productUsage });
} catch (error) { return fail(res, error); } }

export async function listNotifications(req, res) { try { const { skip, limit } = page(req); const q = { userId: req.access.user._id }; if (req.query.unread === "true") q.readAt = null; const [items, total, unread] = await Promise.all([Notification.find(q).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(), Notification.countDocuments(q), Notification.countDocuments({ userId: req.access.user._id, readAt: null })]); return ok(res, { items, total, unread, skip, limit }); } catch (error) { return fail(res, error); } }
export async function readNotification(req, res) { try { const record = await Notification.findOneAndUpdate({ _id: req.params.id, userId: req.access.user._id }, { $set: { readAt: new Date() } }, { new: true }); if (!record) return res.status(404).json({ status: "error", message: "Notification not found." }); return ok(res, record); } catch (error) { return fail(res, error); } }
export async function listRoles(req, res) { try { return ok(res, await Role.find({}).sort({ name: 1 }).lean()); } catch (error) { return fail(res, error); } }
export async function upsertProduct(req, res) { try { const key = String(req.params.key || req.body.key || "").trim().toLowerCase(); if (!key || !req.body.name) return res.status(400).json({ status: "error", message: "Product key and name are required." }); const product = await Product.findOneAndUpdate({ key }, { $set: { name: req.body.name, description: req.body.description || "", status: req.body.status || "active", metadata: req.body.metadata || {} } }, { upsert: true, new: true, runValidators: true }); await audit(req, { action: "product.updated", entityType: "Product", entityId: product._id, after: product.toObject() }); return ok(res, product, "Product saved."); } catch (error) { return fail(res, error); } }
