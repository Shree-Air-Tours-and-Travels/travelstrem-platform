// server/models/FiltersQuery.model.js
import mongoose from "mongoose";


const filtersQuerySchema = new mongoose.Schema({
    search: { type: String, default: "", trim: true },
    city: { type: String, default: "", trim: true },

    // price & days
    minPrice: { type: Number, min: 0, default: null },
    maxPrice: { type: Number, min: 0, default: null },
    minDays: { type: Number, min: 0, default: null },
    maxDays: { type: Number, min: 0, default: null },

    // booleans & rating
    featured: { type: String, enum: ["true", "false", ""], default: "" },
    rating: { type: Number, enum: [1, 2, 3, 4, 5], default: null },

    // travelers
    adults: { type: Number, min: 1, max: 20, default: 2 },
    children: { type: Number, min: 0, max: 20, default: 0 },
    infants: { type: Number, min: 0, max: 10, default: 0 },

    // dates
    arrivalDate: { type: Date, default: null },
    returnDate: { type: Date, default: null },

    // optional extras
    transport: { type: String, default: "", trim: true },
    mealPlan: { type: String, default: "", trim: true },
  },
  {
    timestamps: true,
    versionKey: false,
  });

const FiltersQuery = mongoose.model("FiltersQuery", filtersQuerySchema);
export default FiltersQuery ;
