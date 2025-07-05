import express from "express";
import cors from "cors";
import { connectDB } from "./config/index";
import dotenv from "dotenv";
import apiRoutes from "./routes/api";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 6000;

// Enable CORS
app.use(cors({ origin: "*" }));

// Middleware to parse JSON bodies
app.use(express.json());

// Connect to MongoDB
connectDB();

// Root route
app.get("/", (_req, res) => {
  res.send("Hello from backend!");
});

// Mount API routes
app.use("/api", apiRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
