// Initialize OpenTelemetry
// import './instrumentation.js';
import express from "express";
import { swaggerUi, specs } from "./swagger.js";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
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
import organizationRoutes from "./routes/organization.js";
import stripeRoutes from "./routes/stripe.js";
import statsRoutes from "./routes/stats.js";
import insight from "./routes/insight.js";
import clusterRoutes from "./routes/cluster.js";
import logger from "./logger.js";
import { requestLogger, errorLogger } from "./logging-examples.js";

import { register } from "./controllers/auth.js";
import { createFeedback } from "./controllers/feedbacks.js";
import { verifyToken } from "./middleware/auth.js";
import { rateLimiter } from "./middleware/ratelimiter.js";

// CONFIGURATION
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: ".env" });
const app = express();
app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));
app.use(bodyParser.json({ limit: "100mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));
app.use(cookieParser());
app.use(
  cors({
    origin: "http://luapp",
    methods: ["GET", "POST", "DELETE", "PATCH"],
    credentials: true,
  })
);
app.use("/assets", express.static(path.join(__dirname, "public/assets")));

// Add request logging middleware
app.use(requestLogger);

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
app.post(
  "/api/feedback/:id",
  rateLimiter(1, 5),
  (req, res, next) => {
    upload.array("pictures", 5)(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        logger.error("Multer error during file upload", {
          error: err.message,
          code: err.code,
          field: err.field,
          requestPath: req.path,
        });
        return res.status(400).json({ error: err.message });
      } else if (err) {
        logger.error("Unknown error during file upload", {
          error: err.message,
          stack: err.stack,
          requestPath: req.path,
        });
        return res
          .status(500)
          .json({ error: "An unknown error occurred during file upload." });
      }
      next();
    });
  },
  createFeedback
);

//ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/form", formRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/organization", organizationRoutes);
app.use("/api/stripe", stripeRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/insight", insight);
app.use("/api/cluster", clusterRoutes);

// Swagger UI route
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

// Add global error handler
app.use(errorLogger);

// Only connect to MongoDB and start server if this file is run directly, not when imported
if (import.meta.url === `file://${process.argv[1]}`) {
  //MONGOOSE SETUP
  const PORT = process.env.PORT || 6001;
  logger.info("Connecting to MongoDB", {
    url: `${process.env.MONGO_URL}${process.env.MONGO_DB_NAME}`,
  });

  mongoose
    .connect(process.env.MONGO_URL + process.env.MONGO_DB_NAME)
    .then(() => {
      app.listen(PORT, () => {
        logger.info(`Server started successfully`, {
          port: PORT,
          environment: process.env.NODE_ENV || "development",
          swaggerDocsUrl: `http://localhost:${PORT}/api-docs`,
        });
      });
    })
    .catch((error) => {
      logger.error("Failed to connect to MongoDB", {
        error: error.message,
        stack: error.stack,
        mongoUrl: `${process.env.MONGO_URL}${process.env.MONGO_DB_NAME}`,
      });
    });
}

// Export the app for testing
export default app;
