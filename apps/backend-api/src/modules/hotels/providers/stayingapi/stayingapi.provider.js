import HotelProvider from "../../../../providers/travel/contracts/HotelProvider.js";
import ProviderRequestGovernor from "../../../../providers/travel/runtime/ProviderRequestGovernor.js";
import { createHotelProviderConfig } from "../provider.config.js";
import StayingApiAdapter from "./stayingapi.adapter.js";
import StayingApiClient from "./stayingapi.client.js";

export default class StayingApiProvider extends HotelProvider {
    constructor({
        config = createHotelProviderConfig("stayingapi"),
        client,
        adapter,
        governor,
    } = {}) {
        if (!config?.credentials?.apiKey)
            throw new Error("Missing credentials for hotel provider stayingapi.");
        super({ name: "stayingapi", config });
        this.client = client || new StayingApiClient(config);
        this.adapter = adapter || new StayingApiAdapter();
        this.governor = governor || new ProviderRequestGovernor(config);
    }

    async searchHotels(input) {
        this.assertEnabled("searchHotels");
        const request = this.adapter.adaptSearchRequest(input);
        const response = await this.governor.run(() => this.client.searchHotels(request));
        return this.adapter.adaptSearch(response, input);
    }

    async getHotelDetails({ providerReference, input }) {
        this.assertEnabled("getHotelDetails");
        const request = this.adapter.adaptDetailsRequest({ providerReference, input });
        const response = await this.governor.run(() => this.client.getHotelDetails(request));
        return this.adapter.adaptDetails(response, input, providerReference.searchProperty);
    }
}
