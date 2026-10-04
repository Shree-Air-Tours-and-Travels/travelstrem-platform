import pageDefinitionService from "../../../services/pageDefinitionService.js";
import HotelService from "../services/hotel.service.js";

const service = new HotelService();
const handle = (fn) => async (req, res, next) => {
    try {
        res.setHeader("Cache-Control", "no-store, private");
        res.json({ status: "success", data: await fn(req) });
    } catch (error) {
        next(error);
    }
};

export const getHotelPage = (_req, res, next) => {
    try {
        const response = pageDefinitionService.buildPageResponse("trehub-remote/hotels/hotels");
        const homeResponse = pageDefinitionService.buildPageResponse("trehub-remote/home");
        const page = response.componentData || response.component;
        const home = homeResponse.componentData || homeResponse.component;
        page.elements.labels = { ...home.elements.labels, ...page.elements.labels };
        page.elements.urls = { ...home.elements.urls, ...page.elements.urls };
        page.dataScope.options = { ...home.dataScope.options, ...page.dataScope.options };
        const source = home.structure.widgets.find((widget) => widget.name === "searchCard");
        page.structure.widgets = page.structure.widgets.map((widget) =>
            widget.type === "HotelSearch"
                ? { ...widget, props: { ...source.props, variant: "hotel", activeService: ["hotel"], overlap: false } }
                : widget,
        );
        res.json(response);
    } catch (error) {
        next(error);
    }
};

export const searchHotels = handle((req) => service.search(req.body, req.user));
export const getHotelResults = handle((req) => service.results(req.params.searchId, req.query, req.user));
export const getHotelDetails = handle((req) => service.details(req.params.searchId, req.params.hotelId, req.user));
export const getHotelDetailWidget = handle((req) => service.detailWidget(req.params.searchId, req.params.hotelId, req.params.widget, req.user));
export const quoteHotelRooms = handle(async (req) => {
    const quote = await service.quoteRooms({
        searchId: req.params.searchId,
        hotelId: req.params.hotelId,
        roomIds: req.body.roomIds,
    }, req.user);
    return {
        lineItems: quote.lineItems.map((item) => ({
            slot: item.slot,
            roomId: item.roomId,
            name: item.name,
            ratePlan: item.ratePlan,
            quantity: item.quantity,
            stayAmount: item.stayAmount,
        })),
        price: {
            subtotal: quote.price.subtotal,
            convenienceFee: quote.price.convenienceFee,
            total: quote.price.total,
            currency: quote.price.currency,
        },
        display: quote.display,
    };
});
export const createHotelEnquiry = handle((req) => service.createEnquiry(req.body, req.user));
