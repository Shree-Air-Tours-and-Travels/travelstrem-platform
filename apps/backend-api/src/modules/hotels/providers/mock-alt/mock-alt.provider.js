import MockHotelProvider from "../mock/mock.provider.js";

// A second independent supplier for exercising cross-provider search and routing.
export default class MockAltHotelProvider extends MockHotelProvider {
    constructor() {
        super();
        this.name = "mock-alt";
    }

    async searchHotels(input) {
        const hotels = await super.searchHotels(input);
        return hotels.slice(0, 3).map((hotel, index) => ({
            ...hotel,
            hotelId: `ALT-HOTEL-${index + 1}`,
            name: `${input.destination} ${["Harbour", "Boutique", "Vista"][index]}`,
            description: "A second supplier's city stay with flexible room and meal options.",
            rooms: hotel.rooms.map((room) => ({
                ...room,
                nightlyAmountMinor: room.nightlyAmountMinor + 45000,
            })),
        }));
    }
}
