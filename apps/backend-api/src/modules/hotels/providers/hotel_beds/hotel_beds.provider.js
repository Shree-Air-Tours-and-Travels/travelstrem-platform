import HotelProvider from "../../../../providers/travel/contracts/HotelProvider.js";
import ProviderRequestGovernor from "../../../../providers/travel/runtime/ProviderRequestGovernor.js";
import { assertHotelProviderCredentials, createHotelProviderConfig } from "../provider.config.js";
import HotelBedsAdapter from "./hotel_beds.adapter.js";
import HotelBedsClient from "./hotel_beds.client.js";

export default class HotelBedsProvider extends HotelProvider {
    constructor({
        config = createHotelProviderConfig("hotelbeds"),
        client,
        adapter,
        governor,
    } = {}) {
        const providerConfig = assertHotelProviderCredentials(config);
        super({ name: "hotelbeds", config: providerConfig });
        this.client = client || new HotelBedsClient(providerConfig);
        this.adapter = adapter || new HotelBedsAdapter();
        this.governor = governor || new ProviderRequestGovernor(providerConfig);
    }

    async searchHotels(input) {
        this.assertEnabled("searchHotels");
        const request = this.adapter.adaptSearchRequest(input);
        const response = await this.governor.run(() => this.client.searchHotels(request));
        let content = null;
        try {
            const codes = this.adapter.hotelCodes(response);
            if (codes.length)
                content = await this.governor.run(() => this.client.getHotelContents(codes, "ENG"));
        } catch {
            // Availability remains usable when optional cover-image content is unavailable.
        }
        return this.adapter.adaptSearch(response, input, content);
    }

    async getHotelDetails({ hotelId, providerReference, input }) {
        this.assertEnabled("getHotelDetails");
        const request = this.adapter.adaptDetailsRequest({ hotelId, providerReference, input });
        const availability = await this.governor.run(() =>
            this.client.searchHotels(request.availability),
        );
        let content = null;
        try {
            content = await this.governor.run(() =>
                this.client.getHotelContent(request.hotelCode, request.language),
            );
        } catch {
            // Dynamic availability is still valid when optional static content is unavailable.
        }
        return this.adapter.adaptHotel({ availability, content });
    }

    async checkRates(rateKeys) {
        this.assertEnabled("checkRates");
        const request = this.adapter.adaptCheckRatesRequest(rateKeys);
        const response = await this.governor.run(() => this.client.checkRates(request));
        return this.adapter.adaptCheckRates(response);
    }
}
