import express from "express";
import {
  getFeedbackCountOverTimeByOrg,
  getFeedbackCountOverTimeByForm,
  getTotalFeedbackByForm,
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
  getFeedbackCountOverTimeByOrg
);

// Route to get feedback count over time for a specific form
router.get(
  "/form/:formId/feedback-count",
  rateLimiter(1, 100),
  verifyToken,
  getFeedbackCountOverTimeByForm
);

// Route to get total feedback count grouped by form for an organization
router.get(
  "/:organization/feedback-total-by-form",
  rateLimiter(1, 100),
  verifyToken,
  getTotalFeedbackByForm
);

// Route to get the count of opinions for a specific form
router.get(
  "/form/:formId/opinion-counts",
  rateLimiter(1, 100),
  verifyToken,
  getOpinionCountsByForm
);

export default router;
