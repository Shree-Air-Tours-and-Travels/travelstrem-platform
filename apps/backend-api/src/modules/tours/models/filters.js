// server/models/filters.js
import Joi from "joi";

/**
 * Joi schema to validate query params sent to GET /api/filters
 * Exported as FiltersQuery (named export)
 */
const FiltersQueryModel = Joi.object({
  search: Joi.string().allow("").trim(),
  city: Joi.string().allow("").trim(),

  // price & days
  minPrice: Joi.alternatives().try(Joi.number().min(0), Joi.string().allow("")).allow(null),
  maxPrice: Joi.alternatives().try(Joi.number().min(0), Joi.string().allow("")).allow(null),
  minDays: Joi.alternatives().try(Joi.number().min(0), Joi.string().allow("")).allow(null),
  maxDays: Joi.alternatives().try(Joi.number().min(0), Joi.string().allow("")).allow(null),

  // booleans & rating
  featured: Joi.string().valid("true", "false", "").default(""),
  rating: Joi.alternatives().try(Joi.number().valid(1, 2, 3, 4, 5), Joi.string().allow("")).allow(null),

  // travelers
  adults: Joi.alternatives().try(Joi.number().min(1).max(20), Joi.string().allow("")).default(2),
  children: Joi.alternatives().try(Joi.number().min(0).max(20), Joi.string().allow("")).default(0),
  infants: Joi.alternatives().try(Joi.number().min(0).max(10), Joi.string().allow("")).default(0),

  // dates (accept iso date string or empty)
  arrivalDate: Joi.alternatives().try(Joi.date().iso(), Joi.string().allow("")).allow(null),
  returnDate: Joi.alternatives().try(Joi.date().iso(), Joi.string().allow("")).allow(null),

  // optional extras
  transport: Joi.string().allow("").trim(),
  mealPlan: Joi.string().allow("").trim(),
}).unknown(true);

export default FiltersQueryModel;