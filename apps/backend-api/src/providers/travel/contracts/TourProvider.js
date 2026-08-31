import BaseTravelProvider from "./BaseTravelProvider.js";

export default class TourProvider extends BaseTravelProvider {
    searchTours() {
        return this.unsupported("searchTours");
    }

    getTourDetails() {
        return this.unsupported("getTourDetails");
    }

    reserveInventory() {
        return this.unsupported("reserveInventory");
    }

    releaseInventory() {
        return this.unsupported("releaseInventory");
    }
}
