import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { rateLimiter } from "../middleware/ratelimiter.js";
import clusteringScheduler from "../services/clusteringScheduler.js";
import logger from "../logger.js";

const router = express.Router();

// Get scheduler status
router.get(
  "/scheduler/status",
  rateLimiter(1, 100),
  verifyToken,
  (req, res) => {
    try {
      const status = clusteringScheduler.getStatus();
      res.status(200).json({
        status: "success",
        scheduler: status,
        currentTime: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("Error getting scheduler status", {
        error: error.message,
        stack: error.stack,
      });
      res.status(500).json({ message: error.message });
    }
  }
);

// Manually trigger clustering for all active forms
router.post(
  "/scheduler/trigger",
  rateLimiter(1, 5),
  verifyToken,
  async (req, res) => {
    try {
      logger.info("Manual clustering trigger requested", {
        userId: req.user?.id,
        timestamp: new Date().toISOString(),
      });

      // Trigger clustering manually
      await clusteringScheduler.runScheduledClustering();

      res.status(200).json({
        status: "success",
        message: "Clustering triggered successfully",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("Error triggering manual clustering", {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id,
      });
      res.status(500).json({ message: error.message });
    }
  }
);

// Restart scheduler (admin only)
router.post(
  "/scheduler/restart",
  rateLimiter(1, 3),
  verifyToken,
  (req, res) => {
    try {
      logger.info("Scheduler restart requested", {
        userId: req.user?.id,
        timestamp: new Date().toISOString(),
      });

      clusteringScheduler.stop();
      clusteringScheduler.start();

      res.status(200).json({
        status: "success",
        message: "Scheduler restarted successfully",
        scheduler: clusteringScheduler.getStatus(),
      });
    } catch (error) {
      logger.error("Error restarting scheduler", {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id,
      });
      res.status(500).json({ message: error.message });
    }
  }
);

// Stop scheduler (admin only)
router.post("/scheduler/stop", rateLimiter(1, 3), verifyToken, (req, res) => {
  try {
    logger.info("Scheduler stop requested", {
      userId: req.user?.id,
      timestamp: new Date().toISOString(),
    });

    clusteringScheduler.stop();

    res.status(200).json({
      status: "success",
      message: "Scheduler stopped successfully",
    });
  } catch (error) {
    logger.error("Error stopping scheduler", {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
    });
    res.status(500).json({ message: error.message });
  }
});

export default router;
