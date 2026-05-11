import express from "express";
import Package from "../models/Package.js";

const router = express.Router();

// GET all packages
router.get("/", async (req, res) => {
  try { 
    const packages = await Package.find();
    res.json(packages)
  } catch (err) {
    res.status(500).json({ message: err.message }); 
  }
});

// GET single package by ID
router.get("/:id", async (req, res) => {
  try {
    const pkg = await Package.findById(req.params.id);
    res.json(pkg);
  } catch (err) {
    res.status(404).json({ message: "Package not found" });
  }
});

// TEMPORARY SEED ROUTE - For Development Only
router.post("/seed", async (req, res) => {
  try {
    await Package.deleteMany(); // Clear existing packages

    const sampleData = [
      {
        title: "Goa Beach Escape",
        description: "3 nights, 4 days at luxury beach resort",
        destination: "Goa",
        price: 15000,
        duration: "4 Days",
        imageUrl: "https://source.unsplash.com/400x300/?goa,beach",
        type: "domestic",
      },
      {
        title: "Swiss Alps Adventure",
        description: "7 days exploring the Alps and Swiss cities",
        destination: "Switzerland",
        price: 80000,
        duration: "7 Days",
        imageUrl: "https://source.unsplash.com/400x300/?switzerland,snow",
        type: "international",
      }
    ];

    await Package.insertMany(sampleData);
    res.send("✅ Sample packages seeded successfully");
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


export default router;
