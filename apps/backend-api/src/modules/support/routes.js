import express from "express";
import { authMiddleware } from "../../shared/auth/index.js";
import {
    createTicket,
    getArticle,
    getCategories,
    getContacts,
    getHome,
    getService,
    getServices,
    getSupportDeskTicket,
    getTicket,
    getTopic,
    listTickets,
    listSupportDeskTickets,
    replyFromSupportDesk,
    replyToTicket,
    searchSupport,
    updateSupportDeskTicket,
} from "./support.controller.js";

const router = express.Router();
router.use(authMiddleware);
router.get("/home", getHome);
router.get("/search", searchSupport);
router.get("/services", getServices);
router.get("/services/:serviceId", getService);
router.get("/topics/:topicId", getTopic);
router.get("/articles/:articleId", getArticle);
router.get("/categories", getCategories);
router.get("/contact-options", getContacts);
router.get("/desk/tickets", listSupportDeskTickets);
router.get("/desk/tickets/:ticketId", getSupportDeskTicket);
router.post("/desk/tickets/:ticketId/messages", replyFromSupportDesk);
router.patch("/desk/tickets/:ticketId", updateSupportDeskTicket);
router.get("/tickets", listTickets);
router.post("/tickets", createTicket);
router.get("/tickets/:ticketId", getTicket);
router.post("/tickets/:ticketId/messages", replyToTicket);
export default router;
