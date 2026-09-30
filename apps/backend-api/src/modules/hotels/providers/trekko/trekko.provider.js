import HotelProvider from "../../../../providers/travel/contracts/HotelProvider.js";
import ProviderRequestGovernor from "../../../../providers/travel/runtime/ProviderRequestGovernor.js";
import { assertHotelProviderCredentials, createHotelProviderConfig } from "../provider.config.js";
import TrekkoAdapter from "./trekko.adapter.js";
import TrekkoClient from "./trekko.client.js";

export default class TrekkoProvider extends HotelProvider {
    constructor({ config = createHotelProviderConfig("trekko"), client, adapter, governor } = {}) {
        const providerConfig = assertHotelProviderCredentials(config);
        super({ name: "trekko", config: providerConfig });
        this.client = client || new TrekkoClient(providerConfig);
        this.adapter = adapter || new TrekkoAdapter();
        this.governor = governor || new ProviderRequestGovernor(providerConfig);
    }

    async searchHotels(input) {
        this.assertEnabled("searchHotels");
        const lookup = await this.governor.run(() =>
            this.client.searchDestinations(this.adapter.adaptDestinationRequest(input)));
        const destinations = this.adapter.adaptDestinations(lookup);
        const outcomes = await Promise.allSettled(destinations.map(async (destination) => {
            const request = this.adapter.adaptAvailabilityRequest(input, destination.search_by_id);
            const response = await this.governor.run(() => this.client.getAvailability(request));
            return response ? this.adapter.adaptHotel(response, input, destination) : null;
        }));
        return outcomes.flatMap((outcome) =>
            outcome.status === "fulfilled" && outcome.value?.rooms?.length ? [outcome.value] : []);
    }

    async getHotelDetails({ hotelId, providerReference, input }) {
        this.assertEnabled("getHotelDetails");
        const request = this.adapter.adaptDetailsRequest({ hotelId, providerReference, input });
        const response = await this.governor.run(() => this.client.getAvailability(request));
        return response ? this.adapter.adaptHotel(response, input, providerReference?.destination) : null;
    }
}
