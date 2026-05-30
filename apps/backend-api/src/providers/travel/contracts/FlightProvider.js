import BaseTravelProvider from "./BaseTravelProvider.js";

export default class FlightProvider extends BaseTravelProvider {
  searchFlights() {
    return this.unsupported("searchFlights");
  }

  priceItinerary() {
    return this.unsupported("priceItinerary");
  }

  createHold() {
    return this.unsupported("createHold");
  }

  issueTicket() {
    return this.unsupported("issueTicket");
  }

  cancelTicket() {
    return this.unsupported("cancelTicket");
  }
}

