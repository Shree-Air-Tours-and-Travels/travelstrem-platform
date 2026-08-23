import BaseTravelProvider from "./BaseTravelProvider.js";

export default class HotelProvider extends BaseTravelProvider {
    searchHotels() {
        return this.unsupported("searchHotels");
    }

    getHotelDetails() {
        return this.unsupported("getHotelDetails");
    }

    createHold() {
        return this.unsupported("createHold");
    }

    confirmBooking() {
        return this.unsupported("confirmBooking");
    }

    cancelBooking() {
        return this.unsupported("cancelBooking");
    }
}
