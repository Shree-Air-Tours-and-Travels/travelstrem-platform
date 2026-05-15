// server/schemas/filters.schema.js
import Joi from "joi";

export const FiltersQuerySchema = Joi.object({
  search: Joi.string().allow("").optional(),
  city: Joi.string().allow("").optional(),

  // price & days
  minPrice: Joi.number().min(0).optional().allow(""),
  maxPrice: Joi.number().min(0).optional().allow(""),
  minDays: Joi.number().min(0).optional().allow(""),
  maxDays: Joi.number().min(0).optional().allow(""),

  // booleans & rating
  featured: Joi.string().valid("true", "false", "").optional(),
  rating: Joi.number().valid(1, 2, 3, 4, 5).optional().allow(""),

  // travelers
  adults: Joi.number().integer().min(1).max(20).optional().default(2),
  children: Joi.number().integer().min(0).max(20).optional().default(0),
  infants: Joi.number().integer().min(0).max(10).optional().default(0),

  // dates
  arrivalDate: Joi.date().iso().optional().allow(""),
  returnDate: Joi.date().iso().optional().allow(""),

  // optional extra fields
  transport: Joi.string().allow("").optional(),
  mealPlan: Joi.string().allow("").optional(),
});
