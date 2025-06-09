import express from "express";
import { verifyToken } from "../middleware/auth.js";
import {
  getAllInsights,
  getInsightById,
  getInsightsByFeedbackId,
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
  "/form/:formId",
  rateLimiter(1, 100),
  verifyToken,
  getInsightsByFormId
);

// DELETE route
router.delete("/:id/delete", rateLimiter(1, 100), verifyToken, deleteInsight);

export default router;
