import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const directory = path.dirname(fileURLToPath(import.meta.url));
const readJson = (name) => JSON.parse(fs.readFileSync(path.join(directory, name), "utf8"));

export const airports = readJson("airports.json");
export const airlines = readJson("airlines.json");
export const aircraft = readJson("aircraft.json");
export const routePrices = readJson("route-prices.json");

export const airportByCode = new Map(airports.map((airport) => [airport.iataCode, airport]));
export const airlineByCode = new Map(airlines.map((airline) => [airline.code, airline]));
export const aircraftByCode = new Map(aircraft.map((item) => [item.code, item]));
