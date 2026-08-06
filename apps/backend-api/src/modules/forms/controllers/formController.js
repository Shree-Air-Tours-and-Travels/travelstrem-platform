// modules/forms/controller.js
import ContactLeadRepository from "../repositories/ContactLeadRepository.js";
import Tour from "../../tours/models/Tour.js";
import User from "../../auth/models/User.js";
import { sendTransactionalEmail } from "../../../services/email.service.js";
import axios from "axios";
import pageDefinitionService from "../../../services/pageDefinitionService.js";
import config from "../../../config/env.js";
import TrevioTrip from "../../trevio/models/TrevioTrip.js";

const escapeHtml = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

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
                if (!tour) tour = await TrevioTrip.findById(tourId).lean();
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
        const knownKeys = ["name", "email", "phone", "message", "preferredContact", "travellerCount", "preferredTravelDate"];
        if (fields && typeof fields === "object") {
            for (const key of knownKeys) {
                if (fields[key] !== undefined && fields[key] !== null) {
                    allowedFields[key] = String(fields[key]).slice(0, 2000);
                }
            }
        }

        const requiredFields = ["name", "email", "phone", "message", "preferredContact", "travellerCount"];
        const missingField = requiredFields.find((key) => !String(allowedFields[key] || "").trim());
        if (missingField) return res.status(400).json({ status: "error", message: `Please provide ${missingField}.` });
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(allowedFields.email)) return res.status(400).json({ status: "error", message: "Please provide a valid email address." });
        if (!/^\+?[0-9][0-9\s-]{6,18}$/.test(allowedFields.phone)) return res.status(400).json({ status: "error", message: "Please provide a valid phone number." });
        const travellerCount = Number(allowedFields.travellerCount);
        if (!Number.isInteger(travellerCount) || travellerCount < 1 || travellerCount > 50) return res.status(400).json({ status: "error", message: "Traveller count must be between 1 and 50." });

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

        // Always notify the TravelsTREM enquiry inbox. An assigned tour agent
        // is included as an additional recipient when one exists.
        try {
            const recipients = new Set();
            if (config.ENQUIRY_EMAIL) recipients.add(config.ENQUIRY_EMAIL);

            if (tourId && Tour.db.base.Types.ObjectId.isValid(tourId)) {
                const tour = await Tour.findById(tourId).lean() || await TrevioTrip.findById(tourId).lean();
                if (tour?.ownerAgent) {
                    const agent = await User.findById(tour.ownerAgent).lean();
                    if (agent?.email) recipients.add(agent.email);
                }
            }

            if (!recipients.size) {
                console.error("Enquiry email notification skipped: ENQUIRY_EMAIL or SUPPORT_EMAIL is not configured");
            } else {
                const customerName = allowedFields.name || "Customer";
                const customerEmail = allowedFields.email || "Not provided";
                const customerPhone = allowedFields.phone || "Not provided";
                const customerMessage = allowedFields.message || "No additional message";
                const preferredContact = allowedFields.preferredContact || "Not provided";
                const travellerSummary = allowedFields.travellerCount || "Not provided";
                const preferredTravelDate = allowedFields.preferredTravelDate || "Flexible";
                const requestedTour = tourTitle || "General Trevio enquiry";
                const enquiryUrl = url || "Not provided";
                const emailResult = await sendTransactionalEmail({
                    to: [...recipients],
                    replyTo: allowedFields.email || undefined,
                    subject: `New TravelsTREM enquiry: ${requestedTour}`,
                    text: `New customer enquiry\n\nName: ${customerName}\nEmail: ${customerEmail}\nPhone: ${customerPhone}\nPreferred contact: ${preferredContact}\nTravellers: ${travellerSummary}\nPreferred date: ${preferredTravelDate}\nTour: ${requestedTour}\nRequest: ${customerMessage}\nPage: ${enquiryUrl}`,
                    html: `<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#172033"><h2 style="color:#173b8f">New customer enquiry</h2><p>A customer has requested help from TravelsTREM.</p><table role="presentation" style="width:100%;border-collapse:collapse"><tr><td style="padding:8px 0;font-weight:700">Name</td><td>${escapeHtml(customerName)}</td></tr><tr><td style="padding:8px 0;font-weight:700">Email</td><td>${escapeHtml(customerEmail)}</td></tr><tr><td style="padding:8px 0;font-weight:700">Phone</td><td>${escapeHtml(customerPhone)}</td></tr><tr><td style="padding:8px 0;font-weight:700">Preferred contact</td><td>${escapeHtml(preferredContact)}</td></tr><tr><td style="padding:8px 0;font-weight:700">Travellers</td><td>${escapeHtml(travellerSummary)}</td></tr><tr><td style="padding:8px 0;font-weight:700">Preferred date</td><td>${escapeHtml(preferredTravelDate)}</td></tr><tr><td style="padding:8px 0;font-weight:700">Tour</td><td>${escapeHtml(requestedTour)}</td></tr><tr><td style="padding:8px 0;font-weight:700">Request</td><td>${escapeHtml(customerMessage)}</td></tr><tr><td style="padding:8px 0;font-weight:700">Page</td><td>${escapeHtml(enquiryUrl)}</td></tr></table><p style="margin-top:24px;color:#667085">Reply to this email to contact the customer directly.</p></div>`,
                });
                if (emailResult.success) {
                    savedLead.notified = true;
                    await savedLead.save();
                    notified = true;
                } else {
                    console.error("Enquiry email notification failed:", emailResult.message, emailResult.code || "");
                }
            }
        } catch (emailErr) {
            console.error("Enquiry email notification failed:", emailErr?.message || emailErr);
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
