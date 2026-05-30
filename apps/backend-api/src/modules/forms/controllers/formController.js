// modules/forms/controller.js
import ContactLeadRepository from "../repositories/ContactLeadRepository.js";
import Tour from "../../tours/models/Tour.js";
import User from "../../auth/models/User.js";
import mailer from "../../../core/mailer/index.js";
import axios from "axios";
import pageDefinitionService from "../../../services/pageDefinitionService.js";

export const getForm = async (req, res) => {
    try {
        const { form, tourId } = req.query;

        // Only supporting contact-agent for now
        if (form !== "contact-agent") {
            return res.status(400).json({
                status: "error",
                message: "Unknown form requested",
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

        return res.status(200).json({
            ...pageDefinitionService.buildWidgetResponse("tours-remote/details", "./widgets/contact-agent-form.json", {
                injectData: tour ? { tour } : {},
            }),
            message: "Contact form fetched",
        });
    } catch (err) {
        console.error("getForm error:", err);
        return res.status(500).json({
            status: "error",
            message: "Failed to fetch form",
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

        const createdAt = req.body.createdAt ? new Date(req.body.createdAt) : undefined;
        const validatedCreatedAt = (createdAt && !Number.isNaN(createdAt.getTime())) ? createdAt : undefined;

        const allowedFields = {};
        const knownKeys = ["name", "email", "phone", "message", "preferredContact"];
        if (fields && typeof fields === "object") {
            for (const key of knownKeys) {
                if (fields[key] !== undefined && fields[key] !== null) {
                    allowedFields[key] = String(fields[key]).slice(0, 2000);
                }
            }
        }

        const newLead = ContactLeadRepository.create({
            form: "contact-agent",
            fields: allowedFields,
            tourId: String(tourId || "").slice(0, 100) || null,
            tourTitle: String(tourTitle || "").slice(0, 500) || null,
            url: String(url || "").slice(0, 2000) || null,
            createdAt: validatedCreatedAt,
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

        // Notify agent via email
        if (tourId) {
            try {
                const tour = await Tour.findById(tourId).lean();
                if (tour?.ownerAgent) {
                    const agent = await User.findById(tour.ownerAgent).lean();
                    if (agent?.email) {
                        await mailer.sendMail({
                            to: agent.email,
                            subject: `New lead: ${tourTitle || "Tour inquiry"}`,
                            text: `New contact request from ${fields.name}\n\nName: ${fields.name}\nEmail: ${fields.email}\nPhone: ${fields.phone || "N/A"}\nTour: ${tourTitle || "N/A"}\nURL: ${url || "N/A"}`,
                            html: `<h3>New Contact Request</h3><table><tr><td><strong>Name:</strong></td><td>${fields.name}</td></tr><tr><td><strong>Email:</strong></td><td>${fields.email}</td></tr><tr><td><strong>Phone:</strong></td><td>${fields.phone || "N/A"}</td></tr><tr><td><strong>Tour:</strong></td><td>${tourTitle || "N/A"}</td></tr><tr><td><strong>URL:</strong></td><td>${url || "N/A"}</td></tr></table>`,
                        });
                    }
                }
            } catch (emailErr) {
                console.error("Agent email notification failed:", emailErr?.message || emailErr);
            }
        }

        // respond with your JSON contract & componentData
        return res.status(200).json({
            status: "success",
            message: "Request submitted successfully",
            ...pageDefinitionService.buildWidgetResponse("tours-remote/details", "./widgets/contact-agent-form.json", {
                injectData: {
                    lead: {
                        id: savedLead._id,
                        fields: savedLead.fields,
                        tourId: savedLead.tourId,
                        tourTitle: savedLead.tourTitle,
                        url: savedLead.url,
                        createdAt: savedLead.createdAt,
                        notified: savedLead.notified || notified,
                    },
                },
            }),
        });
    } catch (err) {
        console.error("submitForm error:", err);
        return res.status(500).json({
            status: "error",
            message: "Failed to submit contact request",
            error: err?.message,
        });
    }
};

// Optional: admin endpoint to fetch leads
export const getLeads = async (req, res) => {
    try {
        const leads = await ContactLeadRepository.find()
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
