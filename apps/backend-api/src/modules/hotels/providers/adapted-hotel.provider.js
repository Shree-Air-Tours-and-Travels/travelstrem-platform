import HotelProvider from "../../../providers/travel/contracts/HotelProvider.js";
import { createHotelProviderConfig } from "./provider.config.js";
import ProviderRequestGovernor from "../../../providers/travel/runtime/ProviderRequestGovernor.js";

// The client owns supplier I/O; its adapter owns only that supplier's response shape.
export default class AdaptedHotelProvider extends HotelProvider {
    constructor({ name, client, adapter, config = createHotelProviderConfig(name), governor }) {
        super({ name });
        this.client = client;
        this.adapter = adapter;
        this.config = config;
        this.governor = governor || new ProviderRequestGovernor(config);
    }

    async searchHotels(input) {
        const request = this.adapter.adaptSearchRequest?.(input) ?? input;
        return this.adapter.adaptSearch(await this.governor.run(() => this.client.searchHotels(request)));
    }

    async getHotelDetails({ hotelId, providerReference, input }) {
        const details = {
            hotelId: providerReference?.hotelId || hotelId,
            searchId: providerReference?.searchId,
            input,
        };
        const request = this.adapter.adaptDetailsRequest?.(details) ?? details;
        const response = await this.governor.run(() => this.client.getHotelDetails(request));
        return response ? this.adapter.adaptHotel(response) : null;
    }
}
