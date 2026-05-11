import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema(
    {
        id: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },

        label: {
            type: String,
            required: true,
            trim: true,
        },

        shortDescription: {
            type: String,
            required: true,
            trim: true,
        },

        description: {
            type: String,
            required: true,
            trim: true,
        },

        fullDescription: {
            type: String,
            required: true,
            trim: true,
        },

        image: {
            type: String,
            required: true,
            trim: true,
        },

        coverImage: {
            type: String,
            required: true,
            trim: true,
        },

        features: [
            {
                type: String,
                trim: true,
            },
        ],

        highlights: [
            {
                type: String,
                trim: true,
            },
        ],

        cta: {
            label: {
                type: String,
                trim: true,
            },

            href: {
                type: String,
                trim: true,
            },
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model(
    "Service",
    serviceSchema
);