import express from "express";
import dotenv from "dotenv";
import { connect } from "mongoose";
import { connectDB } from "./config/db.js";
import bucketRoutes from "./routes/bucket.route.js";
import cors from "cors";
import path from "path";
import { ClerkExpressWithAuth } from "@clerk/clerk-sdk-node";

const app = express();

app.use(express.json());

// Middleware to protect routes

dotenv.config();

const __dirname = path.resolve();

if (process.env.NODE_ENV === "development") {
  app.use(
    cors({
      origin: "http://localhost:5173", // Allow requests from React app
      methods: ["GET", "POST", "PUT", "DELETE"], // Allowed HTTP methods
      allowedHeaders: ["Content-Type"], // Allowed headers
      credentials: true, // Enable credentials
    })
  );
}
app.use((req, res, next) => {
  const clerkMiddleware = ClerkExpressWithAuth({
    onError: (err) => {
      console.error("Clerk Auth Error:", err.message);
    },
  });
  clerkMiddleware(req, res, (err) => {
    if (err) {
      console.error("Clerk Middleware Failed:", err.message);
      return res
        .status(500)
        .json({ error: "Auth middleware failed", details: err.message });
    }
    next(); // Ensure next() is always called
  });
});

console.log(process.env.MONGO_URI); //  process.env.MONGO_URI;

app.use("/api/buckets", bucketRoutes);

if (process.env.NODE_ENV === "production") {
  console.log(__dirname);
  app.use(express.static(path.join(__dirname, "/frontend/dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
  });
}

app.listen(process.env.PORT, () => {
  connectDB();
  console.log("Server is running on port 3000");
});
