import express from "express";
import {
  getFeedbackCountOverTime,
  getTotalFeedbackByForm,
  getSumOfOpinionsByFeedback,
  getOpinionCountsByFeedback,
  getOpinionCountsByForm,
} from "../controllers/stats.js";
import { verifyToken } from "../middleware/auth.js";
import { rateLimiter } from "../middleware/ratelimiter.js";

const router = express.Router();

// Route to get feedback count over time for an organization
router.get(
  "/:organization/feedback-count",
  rateLimiter(1, 100),
  verifyToken,
  getFeedbackCountOverTime
);

// Route to get feedback count over time for a specific form
router.get(
  "/form/:formId/feedback-count",
  rateLimiter(1, 100),
  verifyToken,
  getFeedbackCountOverTime
);

// Route to get total feedback count grouped by form for an organization
router.get(
  "/:organization/feedback-total-by-form",
  rateLimiter(1, 100),
  verifyToken,
  getTotalFeedbackByForm
);

// Route to get the sum of opinions grouped by feedback for an organization
router.get(
  "/:organization/opinion-sum-by-feedback",
  rateLimiter(1, 100),
  verifyToken,
  getSumOfOpinionsByFeedback
);

// Route to get the count of opinions grouped by feedback for an organization
router.get(
  "/:organization/opinion-counts-by-feedback",
  rateLimiter(1, 100),
  verifyToken,
  getOpinionCountsByFeedback
);

// Route to get the count of opinions grouped by form for an organization
router.get(
  "/:organization/opinion-counts-by-form",
  rateLimiter(1, 100),
  verifyToken,
  getOpinionCountsByForm
);

export default router;
