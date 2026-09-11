import express from "express";
import { authMiddleware } from "../../shared/auth/index.js";
import pageDefinitionService from "../../services/pageDefinitionService.js";
import HotelService from "./hotel.service.js";

const router = express.Router();
const service = new HotelService();
const handle = (fn) => async (req, res, next) => {
    try {
        res.setHeader("Cache-Control", "no-store, private");
        res.json({ status: "success", data: await fn(req) });
    } catch (error) { next(error); }
};
router.get("/page.json", (_req, res, next) => {
    try {
        const response = pageDefinitionService.buildPageResponse("trehub-remote/hotels/hotels");
        const homeResponse = pageDefinitionService.buildPageResponse("trehub-remote/home");
        const page = response.componentData || response.component;
        const home = homeResponse.componentData || homeResponse.component;
        page.elements.labels = { ...home.elements.labels, ...page.elements.labels };
        page.elements.urls = { ...home.elements.urls, ...page.elements.urls };
        page.dataScope.options = { ...home.dataScope.options, ...page.dataScope.options };
        const source = home.structure.widgets.find((widget) => widget.name === "searchCard");
        page.structure.widgets = page.structure.widgets.map((widget) => widget.type === "HotelSearch" ? { ...widget, props: { ...source.props, variant: "hotel", activeService: ["hotel"], overlap: false } } : widget);
        res.json(response);
    } catch (error) { next(error); }
});
router.post("/search", handle((req) => service.search(req.body, req.user)));
router.get("/search/:searchId/results", handle((req) => service.results(req.params.searchId, req.query, req.user)));
router.get("/search/:searchId/hotels/:hotelId", handle((req) => service.details(req.params.searchId, req.params.hotelId, req.user)));
router.post("/enquiries", authMiddleware, handle((req) => service.createEnquiry(req.body, req.user)));
export default router;
