import express from "express";
import { swaggerUi, specs } from "./swagger.js";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";
import formRoutes from "./routes/form.js";
import feedbackRoutes from "./routes/feedback.js";

import { register } from "./controllers/auth.js";
import { createFeedback } from "./controllers/feedbacks.js";
import { verifyToken } from "./middleware/auth.js";
import { rateLimiter } from "./middleware/ratelimiter.js";

// CONFIGURATION
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({path: '.env'});
const app = express();
app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));
app.use(bodyParser.json({ limit: "100mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));
app.use(cors());
app.use("/assets", express.static(path.join(__dirname, "public/assets")));

//FILE STORAGE
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/assets");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage });

// ROUTES WITH FILES
app.post("/api/feedback/:id", rateLimiter(1,5), (req, res, next) => {
  upload.array("pictures", 5)(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: err.message });
    } else if (err) {
      return res.status(500).json({ error: "An unknown error occurred during file upload." });
    }
    next();
  });
}, createFeedback);

//ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/form", formRoutes);
app.use("/api/feedback", feedbackRoutes);

// Swagger UI route
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

// Only connect to MongoDB and start server if this file is run directly, not when imported
if (import.meta.url === `file://${process.argv[1]}`) {
  //MONGOOSE SETUP
  const PORT = process.env.PORT || 6001;
  console.log(process.env.MONGO_URL);
  mongoose
    .connect(process.env.MONGO_URL)
    .then(() => {
      app.listen(PORT, () => {
        console.log(`Server Port: ${PORT}`);
        console.log(`Swagger Docs available at http://localhost:${PORT}/api-docs`);
      });
    })
    .catch((error) => console.log(`${error} did not connect`));
}

// Export the app for testing
export default app;
