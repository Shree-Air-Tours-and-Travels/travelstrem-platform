// import { Routes, Route } from "react-router-dom";
// // import Home from "./pages/Home";
// import Packages from "./pages/Packages/Packages";
// import PackageDetail from "./pages/Packages/PackageDetails";
// // import BookingForm from "./pages/BookingForm";

// function App() {
//   return (
//       <Routes>
//         {/* <Route path="/" element={<Home />} /> */}
//         <Route path="/packages" element={<Packages />} />
//         <Route path="/packages/:id" element={<PackageDetail />} />
//         {/* <Route path="/booking/:id" element={<BookingForm />} /> */}
//       </Routes>
//   );
// }

// export default App;


// // will only show packages if there are any and use for learning purposes

// // import express from "express";
// // import mongoose from "mongoose";
// // import cors from "cors";
// // import dotenv from "dotenv";
// // import packageRoutes from "./routes/Packages.js";

// dotenv.config();

// const app = express();
// app.use(cors());
// app.use(express.json());

// app.use("/api/packages", packageRoutes);

// // MongoDB Connect
// mongoose.connect(process.env.MONGO_URI, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// })
// .then(() => console.log("✅ MongoDB connected"))
// .catch(err => console.log("❌ MongoDB error:", err));

// // Test route
// app.get("/", (req, res) => {
//   res.send("TravelsTREM backend is live 🚀");
// });

// // Start server
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
