import mongoose from "mongoose";
import User from "../auth/models/User.js";
import ContactLead from "../forms/models/ContactLead.js";
import AgencyCustomer from "./models/AgencyCustomer.js";
import { PERMISSIONS } from "./permissions.js";

export const CUSTOMER_STATUSES = ["active", "inactive"];
export const CUSTOMER_STAGES = ["lead", "prospect", "active", "repeat", "dormant"];
export const CONTACT_METHODS = ["any", "email", "phone", "whatsapp"];

export const normalizeEmail = (value) => String(value || "").trim().toLowerCase();
export const normalizePhone = (value) => String(value || "").replace(/[^0-9+]/g, "");
export const escapeCustomerRegex = (value = "") =>
    String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const linkedCustomerUserId = (lead) => {
    const candidate = lead?.claimedBy?._id || lead?.claimedBy;
    return mongoose.isValidObjectId(candidate) ? candidate : null;
};

const option = (value, label) => ({ value, label });
const titleCase = (value) =>
    String(value || "")
        .replaceAll("_", " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
const hasPermission = (access, permission) =>
    Boolean(access?.isMaster || access?.permissions?.has(permission));

export function customerDirectoryView(access, owners = []) {
    const canManageAgency = hasPermission(access, PERMISSIONS.CUSTOMER_UPDATE_AGENCY);
    const fields = [
        { name: "name", type: "text", label: "Full name", required: true },
        { name: "email", type: "email", label: "Email address" },
        { name: "phone", type: "tel", label: "Phone number" },
        {
            name: "preferredContact",
            type: "select",
            label: "Preferred contact",
            options: CONTACT_METHODS.map((value) => option(value, titleCase(value))),
        },
        {
            name: "lifecycleStage",
            type: "select",
            label: "Customer stage",
            options: CUSTOMER_STAGES.map((value) => option(value, titleCase(value))),
        },
        {
            name: "status",
            type: "select",
            label: "Account state",
            modes: ["edit"],
            options: CUSTOMER_STATUSES.map((value) => option(value, titleCase(value))),
        },
        ...(canManageAgency
            ? [
                  {
                      name: "ownerAgent",
                      type: "select",
                      label: "Assigned agent",
                      options: owners.map((owner) => option(String(owner._id), owner.name || owner.email)),
                  },
              ]
            : []),
        { name: "followUpAt", type: "datetime-local", label: "Next follow-up" },
        { name: "lastContactedAt", type: "datetime-local", label: "Last contacted" },
        { name: "tags", type: "text", label: "Tags", hint: "Separate tags with commas." },
        { name: "notes", type: "textarea", label: "Private agency notes" },
    ];
    return {
        summaryAriaLabel: "Customer relationship summary",
        hero: {
            eyebrow: canManageAgency ? "Partner Admin Workspace" : "Partner Agent Workspace",
            title: "Customer relationships",
            description:
                "Manage every traveller from first enquiry through follow-up, without leaving your agency workspace.",
        },
        search: { placeholder: "Search by customer, email, phone, tour or enquiry ID" },
        directory: {
            title: "Customer directory",
            description: "Enquiries, ownership and follow-up in one tenant-isolated view.",
            resultLabel: "customers",
            paginationAriaLabel: "Customer directory pages",
        },
        filters: {
            status: [option("", "All account states"), ...CUSTOMER_STATUSES.map((v) => option(v, titleCase(v)))],
            lifecycleStage: [
                option("", "All customer stages"),
                ...CUSTOMER_STAGES.map((v) => option(v, titleCase(v))),
            ],
            ownerAgent: canManageAgency
                ? [option("", "All assigned agents"), ...owners.map((owner) => option(String(owner._id), owner.name || owner.email))]
                : [],
            sort: [
                option("recent_activity", "Recent activity"),
                option("follow_up", "Follow-up due first"),
                option("newest", "Newest customers"),
                option("name", "Customer name"),
            ],
        },
        form: {
            createTitle: "Add a customer",
            editTitle: "Update customer",
            description:
                "Use one reliable customer record for enquiries, assignments and follow-ups. Email or phone is required.",
            fields,
            createLabel: "Save customer",
            updateLabel: "Save changes",
            cancelLabel: "Cancel",
        },
        empty: {
            title: "No customers in this view",
            description:
                "Customers appear automatically when your agency receives an enquiry, or you can add one manually.",
            filteredDescription: "Try clearing the search or filters to see more customers.",
        },
        detail: {
            title: "Customer profile",
            activityTitle: "Journey activity",
            emptyActivity: "No enquiries or bookings are linked to this customer yet.",
            fields: {
                stage: "Stage",
                owner: "Assigned to",
                preferredContact: "Preferred contact",
                followUp: "Next follow-up",
                enquiries: "Enquiries",
                bookings: "Bookings",
                notes: "Agency notes",
            },
        },
        actions: {
            create: "Add customer",
            refresh: "Refresh",
            view: "View journey",
            edit: "Edit",
            editCustomer: "Edit customer",
            archive: "Archive",
            clearFilters: "Clear filters",
            previous: "Previous",
            next: "Next",
        },
        messages: {
            archiveConfirm: "Archive this customer? Their enquiry history will remain available for audit.",
        },
        capabilities: {
            create: hasPermission(access, PERMISSIONS.CUSTOMER_CREATE),
            update: hasPermission(access, PERMISSIONS.CUSTOMER_UPDATE_OWN) || canManageAgency,
            assign: canManageAgency,
            archive: hasPermission(access, PERMISSIONS.CUSTOMER_UPDATE_OWN) || canManageAgency,
        },
    };
}

export async function agencyCustomerOwners(agencyId) {
    if (!agencyId || !mongoose.isValidObjectId(agencyId)) return [];
    return User.find({
        agencyId,
        agencyRole: { $in: ["partner_admin", "partner_agent"] },
        accountStatus: "active",
    })
        .select("name email avatar agencyRole")
        .sort({ name: 1 })
        .lean();
}

export async function upsertAgencyCustomerFromLead({ lead, actorId = null }) {
    if (!lead?.agencyId) return null;
    const email = normalizeEmail(lead.fields?.email);
    const phone = normalizePhone(lead.fields?.phone);
    const linkedUser = linkedCustomerUserId(lead);
    let ownerAgent = lead.ownerAgent || null;
    if (!ownerAgent) {
        const partnerAdmin = await User.findOne({
            agencyId: lead.agencyId,
            agencyRole: "partner_admin",
            accountStatus: "active",
        })
            .select("_id")
            .sort({ createdAt: 1, _id: 1 })
            .lean();
        ownerAgent = partnerAdmin?._id || null;
    }
    const createdBy = ownerAgent || actorId || lead.claimedBy;
    if ((!email && !phone) || !createdBy) return null;

    // Authenticated member identity is authoritative. Contact details remain
    // the fallback for guest and historic enquiries that have no linked user.
    let customer = linkedUser
        ? await AgencyCustomer.findOne({
              agencyId: lead.agencyId,
              linkedUser,
              deletedAt: null,
          })
        : null;
    if (!customer) {
        const identity = [];
        if (email) identity.push({ normalizedEmail: email });
        if (phone) identity.push({ normalizedPhone: phone });
        customer = await AgencyCustomer.findOne({
            agencyId: lead.agencyId,
            deletedAt: null,
            ...(linkedUser ? { linkedUser: { $in: [null, linkedUser] } } : {}),
            $or: [
                ...identity,
                ...(email ? [{ email }] : []),
                ...(lead.fields?.phone ? [{ phone: String(lead.fields.phone).trim() }] : []),
            ],
        });
    }
    if (!customer) {
        customer = new AgencyCustomer({
            agencyId: lead.agencyId,
            ownerAgent,
            createdBy,
            updatedBy: createdBy,
            linkedUser,
            name: String(lead.fields?.name || email || phone).trim(),
            email,
            phone: String(lead.fields?.phone || "").trim(),
            source: "enquiry",
            lifecycleStage: "lead",
        });
    }
    if (!customer.linkedUser && linkedUser) customer.linkedUser = linkedUser;
    if (!customer.ownerAgent && ownerAgent) customer.ownerAgent = ownerAgent;
    if (!customer.email && email) customer.email = email;
    if (!customer.phone && lead.fields?.phone) customer.phone = String(lead.fields.phone).trim();
    if (!customer.name && lead.fields?.name) customer.name = String(lead.fields.name).trim();
    if (lead.enquiryRef && !customer.enquiryRefs.includes(lead.enquiryRef))
        customer.enquiryRefs.push(lead.enquiryRef);
    customer.lastActivityAt = lead.createdAt || new Date();
    customer.updatedBy = createdBy;
    await customer.save();
    if (String(lead.customerId || "") !== String(customer._id)) {
        lead.customerId = customer._id;
        await lead.save();
    }
    return customer;
}

export async function reconcileAgencyCustomers({ agencyId, ownerAgent = null, limit = 500 }) {
    const query = { agencyId, customerId: null };
    if (ownerAgent) query.ownerAgent = ownerAgent;
    const leads = await ContactLead.find(query).sort({ createdAt: -1 }).limit(limit);
    // Sequential reconciliation prevents two historic enquiries for the same
    // traveller from racing to create duplicate customer identities.
    for (const lead of leads) {
        try {
            await upsertAgencyCustomerFromLead({ lead });
        } catch (error) {
            if (error?.code !== 11000) throw error;
            await upsertAgencyCustomerFromLead({ lead });
        }
    }
}

export async function customerActivityMap(customerIds) {
    if (!customerIds.length) return new Map();
    const rows = await ContactLead.aggregate([
        { $match: { customerId: { $in: customerIds.map((id) => new mongoose.Types.ObjectId(id)) } } },
        {
            $group: {
                _id: "$customerId",
                enquiries: { $sum: 1 },
                openEnquiries: {
                    $sum: { $cond: [{ $in: ["$status", ["new", "in_review"]] }, 1, 0] },
                },
                bookings: { $sum: { $cond: [{ $ne: ["$bookingId", null] }, 1, 0] } },
                latestAt: { $max: "$createdAt" },
                latestTour: { $last: "$tourTitle" },
            },
        },
    ]);
    return new Map(rows.map((row) => [String(row._id), row]));
}

export function customerDto(customer, activity = {}) {
    const owner = customer.ownerAgent && typeof customer.ownerAgent === "object" ? customer.ownerAgent : null;
    return {
        id: String(customer._id),
        name: customer.name,
        email: customer.email || "",
        phone: customer.phone || "",
        status: customer.status,
        lifecycleStage: customer.lifecycleStage,
        preferredContact: customer.preferredContact,
        tags: customer.tags || [],
        notes: customer.notes || "",
        source: customer.source,
        followUpAt: customer.followUpAt,
        lastContactedAt: customer.lastContactedAt,
        lastActivityAt: activity.latestAt || customer.lastActivityAt,
        owner: owner
            ? { id: String(owner._id), name: owner.name, email: owner.email, avatar: owner.avatar }
            : null,
        activity: {
            enquiries: activity.enquiries || 0,
            openEnquiries: activity.openEnquiries || 0,
            bookings: activity.bookings || 0,
            latestTour: activity.latestTour || "",
        },
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt,
    };
}
