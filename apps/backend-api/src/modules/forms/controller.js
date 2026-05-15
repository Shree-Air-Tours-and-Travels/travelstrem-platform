// modules/forms/controller.js
import ContactLead from "./models/ContactLead.js";
import Tour from "../tours/models/Tour.js"; // optional: if you have a Tour model
import axios from "axios";

// Default Contact Agent Form structure
const DefaultForm = {
    title: "Contact Agent",
    description:
        "Fill this form and our agent will contact you about the selected tour.",
    data: [], // will contain the tour (if any)
    structure: {
        fields: [
            { name: "name", label: "Full name", type: "text", value: "" },
            { name: "email", label: "Email", type: "email", value: "" },
            { name: "phone", label: "Phone", type: "text", value: "" },
        ],
        submitText: "Send Request",
    },
    config: {},
};

export const getForm = async (req, res) => {
    try {
        const { form, tourId } = req.query;

        // Only supporting contact-agent for now
        if (form !== "contact-agent") {
            return res.status(400).json({
                status: "error",
                message: "Unknown form requested",
                componentData: {
                    title: "Form",
                    description: "",
                    data: [],
                    structure: {},
                    config: {},
                },
            });
        }

        // try fetch tour details if tourId provided (optional)
        let tour = null;
        if (tourId) {
            try {
                if (Tour) {
                    tour = await Tour.findById(tourId).lean();
                }
            } catch (e) {
                // ignore and fall back to minimal tour object
                tour = null;
            }
        }

        // simulate slight delay like Hero controller
        const responseData = {
            ...DefaultForm,
            data: [tour || (tourId ? { _id: tourId, title: "Selected tour" } : {})],
        };

        return res.status(200).json({
            status: "success",
            message: "Contact form fetched",
            componentData: responseData,
        });
    } catch (err) {
        console.error("getForm error:", err);
        return res.status(500).json({
            status: "error",
            message: "Failed to fetch form",
            componentData: {
                title: "Contact Form",
                description: "",
                data: [],
                structure: {},
                config: {},
            },
            error: err?.message,
        });
    }
};

export const submitForm = async (req, res) => {
    try {
        // Expect body: { tourId, tourTitle, url, fields: { name, email, phone }, createdAt? }
        const {
            tourId = null,
            tourTitle = null,
            url = null,
            fields = {},
        } = req.body || {};

        // Create and save lead
        const newLead = new ContactLead({
            form: "contact-agent",
            fields,
            tourId,
            tourTitle,
            url,
            createdAt: req.body.createdAt ? new Date(req.body.createdAt) : undefined,
        });

        const savedLead = await newLead.save();

        // Notify agent via webhook if provided in env
        const webhookUrl = process.env.AGENT_WEBHOOK_URL;
        let notified = false;
        if (webhookUrl) {
            try {
                const notifyPayload = {
                    title: `New lead: ${tourTitle || "Tour inquiry"}`,
                    name: fields.name,
                    email: fields.email,
                    phone: fields.phone,
                    tourId,
                    tourTitle,
                    url,
                    createdAt: savedLead.createdAt,
                };
                // best-effort notify (don't fail the whole request if notify fails)
                await axios.post(webhookUrl, notifyPayload, { timeout: 6000 });
                savedLead.notified = true;
                await savedLead.save();
                notified = true;
            } catch (notifyErr) {
                console.error(
                    "Agent webhook notify failed:",
                    notifyErr?.message || notifyErr
                );
            }
        }

        // respond with your JSON contract & componentData
        return res.status(200).json({
            status: "success",
            message: "Request submitted successfully",
            componentData: {
                title: "Submitted",
                description: "We saved your request",
                data: [
                    {
                        id: savedLead._id,
                        fields: savedLead.fields,
                        tourId: savedLead.tourId,
                        tourTitle: savedLead.tourTitle,
                        url: savedLead.url,
                        createdAt: savedLead.createdAt,
                        notified: savedLead.notified || notified,
                    },
                ],
                structure: { notified: savedLead.notified || notified },
                config: {},
            },
        });
    } catch (err) {
        console.error("submitForm error:", err);
        return res.status(500).json({
            status: "error",
            message: "Failed to submit contact request",
            componentData: {
                title: "Submit Form",
                description: "",
                data: [],
                structure: {},
                config: {},
            },
            error: err?.message,
        });
    }
};

// Optional: admin endpoint to fetch leads
export const getLeads = async (req, res) => {
    try {
        const leads = await ContactLead.find()
            .sort({ createdAt: -1 })
            .limit(200)
            .lean();

        return res.status(200).json({
            status: "success",
            message: "Leads fetched",
            componentData: {
                title: "Contact Leads",
                description: "Recent contact leads",
                data: leads.map((l) => ({
                    id: l._id,
                    fields: l.fields,
                    tourId: l.tourId,
                    tourTitle: l.tourTitle,
                    url: l.url,
                    createdAt: l.createdAt,
                    notified: l.notified,
                })),
                structure: {},
                config: {},
            },
        });
    } catch (err) {
        console.error("getLeads error:", err);
        return res.status(500).json({
            status: "error",
            message: "Failed to fetch leads",
            componentData: {
                title: "Leads",
                description: "",
                data: [],
                structure: {},
                config: {},
            },
            error: err?.message,
        });
    }
};
