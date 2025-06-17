import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { rateLimiter } from "../middleware/ratelimiter.js";
import {
  getAllInsights,
  getInsightById,
  getInsightsByFeedbackId,
  getInsightsByOrganization,
  getInsightsByFormId,
  deleteInsight,
} from "../controllers/insight.js";

const router = express.Router();

// GET routes
router.get("/", rateLimiter(1, 100), verifyToken, getAllInsights);
router.get("/:id", rateLimiter(1, 100), verifyToken, getInsightById);
router.get(
  "/feedback/:feedbackId",
  rateLimiter(1, 100),
  verifyToken,
  getInsightsByFeedbackId
);
router.get(
  "/organization/:organization",
  rateLimiter(1, 100),
  verifyToken,
  getInsightsByOrganization
);
router.get(
  "/form/:formId",
  rateLimiter(1, 100),
  verifyToken,
  getInsightsByFormId
);

// DELETE route
router.delete("/:id/delete", rateLimiter(1, 100), verifyToken, deleteInsight);

export default router;
