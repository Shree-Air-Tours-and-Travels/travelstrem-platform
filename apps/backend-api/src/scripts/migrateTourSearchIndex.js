import mongoose from "mongoose";
import config from "../config/index.js";
import Tour from "../modules/tours/models/Tour.js";

const INDEX_NAME = "tour_discovery_text";
const indexFields = {
  title: "text",
  "searchTags.name": "text",
  "city.from": "text",
  "city.to": "text",
  "primaryDestination.cityName": "text",
  "primaryDestination.countryName": "text",
  "address.city": "text",
  "address.state": "text",
  "address.country": "text",
  providerName: "text",
};
const weights = {
  title: 12,
  "city.to": 10,
  "primaryDestination.cityName": 10,
  "address.city": 8,
  "searchTags.name": 6,
  "city.from": 5,
  "primaryDestination.countryName": 4,
  "address.state": 4,
  "address.country": 4,
  providerName: 2,
};

const sameWeights = (left = {}, right = {}) => {
  const keys = Object.keys(right).sort();
  return keys.length === Object.keys(left).length
    && keys.every((key) => Number(left[key]) === Number(right[key]));
};

await mongoose.connect(config.MONGO_URI);

const indexes = await Tour.collection.indexes();
const current = indexes.find((index) => index.name === INDEX_NAME);

if (current && sameWeights(current.weights, weights)) {
  console.log(`${INDEX_NAME} already uses main tour fields only.`);
} else {
  if (current) await Tour.collection.dropIndex(INDEX_NAME);
  await Tour.collection.createIndex(indexFields, {
    name: INDEX_NAME,
    weights,
    default_language: "english",
  });
  console.log(`${INDEX_NAME} rebuilt with title, route, destination, tags, and agency fields.`);
}

const matches = await Tour.find(
  { $text: { $search: "jaipur" }, status: "published", isPublished: { $ne: false } },
  { title: 1 },
).lean();
console.log(`Jaipur verification matches: ${matches.map((tour) => tour.title).join(", ") || "none"}`);

await mongoose.disconnect();
