export default class FlightProvider {
    async search(_input) { throw new Error("FlightProvider.search must be implemented"); }
    async getOffer(_offerId) { throw new Error("FlightProvider.getOffer must be implemented"); }
    async revalidate(_input) { throw new Error("FlightProvider.revalidate must be implemented"); }
    async getSeatMap(_offerId) { throw new Error("FlightProvider.getSeatMap must be implemented"); }
    async createBooking(_input) { throw new Error("FlightProvider.createBooking must be implemented"); }
    async getBooking(_providerReference) { throw new Error("FlightProvider.getBooking must be implemented"); }
    async cancelBooking(_booking) { throw new Error("FlightProvider.cancelBooking must be implemented"); }
}
