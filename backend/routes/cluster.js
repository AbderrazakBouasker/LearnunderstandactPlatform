import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { rateLimiter } from "../middleware/ratelimiter.js";
import {
  clusterInsightsByForm,
  getClusterAnalysisByForm,
  getClusterAnalysisByOrganization,
} from "../controllers/insight.js";

const router = express.Router();

// Clustering routes
router.post(
  "/form/:formId/cluster",
  rateLimiter(1, 100),
  verifyToken,
  clusterInsightsByForm
);

router.get(
  "/form/:formId",
  rateLimiter(1, 100),
  verifyToken,
  getClusterAnalysisByForm
);

router.get(
  "/organization/:organization",
  rateLimiter(1, 100),
  verifyToken,
  getClusterAnalysisByOrganization
);

export default router;
