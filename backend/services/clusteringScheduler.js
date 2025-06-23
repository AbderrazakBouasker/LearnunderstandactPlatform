import cron from "node-cron";
import logger from "../logger.js";
import Form from "../models/Form.js";
import Feedback from "../models/Feedback.js";
import Insight from "../models/Insight.js";
import ClusterAnalysis from "../models/ClusterAnalysis.js";
import { clusterInsightsByForm } from "../controllers/insight.js";

class ClusteringScheduler {
  constructor() {
    this.isRunning = false;
    this.cronJob = null;
  }

  // Initialize and start the scheduler
  start() {
    const cronExpression = process.env.INSIGHT_CLUSTERING_TIMER || "0 * * * *"; // Default: every hour

    if (!cron.validate(cronExpression)) {
      logger.error("Invalid cron expression for clustering timer", {
        expression: cronExpression,
      });
      return;
    }

    logger.info("Starting clustering scheduler", {
      cronExpression,
      description: this.describeCronExpression(cronExpression),
    });

    this.cronJob = cron.schedule(
      cronExpression,
      async () => {
        await this.runScheduledClustering();
      },
      {
        scheduled: false, // Don't start immediately
        timezone: "UTC",
      }
    );

    this.cronJob.start();
    this.isRunning = true;

    logger.info("Clustering scheduler started successfully");
  }

  // Stop the scheduler
  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob.destroy();
      this.cronJob = null;
    }
    this.isRunning = false;
    logger.info("Clustering scheduler stopped");
  }

  // Get scheduler status
  getStatus() {
    return {
      isRunning: this.isRunning,
      cronExpression: process.env.INSIGHT_CLUSTERING_TIMER,
      nextRun: this.cronJob ? this.cronJob.getNextExecution() : null,
    };
  }

  // Main clustering execution function
  async runScheduledClustering() {
    if (this.isRunning === "processing") {
      logger.warn("Clustering already in progress, skipping this run");
      return;
    }

    this.isRunning = "processing";
    const startTime = Date.now();

    try {
      logger.info("Starting scheduled clustering run");

      // Find forms with recent activity (insights created in last 24 hours)
      const activeForms = await this.findActiveForms();

      if (activeForms.length === 0) {
        logger.info("No active forms found for clustering");
        return;
      }

      logger.info("Found active forms for clustering", {
        count: activeForms.length,
        formIds: activeForms.map((f) => f._id),
      });

      // Process each active form
      const results = await Promise.allSettled(
        activeForms.map((form) => this.clusterFormInsights(form._id))
      );

      // Log results
      const successful = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;

      logger.info("Scheduled clustering completed", {
        duration: Date.now() - startTime,
        totalForms: activeForms.length,
        successful,
        failed,
        errors: results
          .filter((r) => r.status === "rejected")
          .map((r) => r.reason?.message),
      });
    } catch (error) {
      logger.error("Error during scheduled clustering", {
        error: error.message,
        stack: error.stack,
        duration: Date.now() - startTime,
      });
    } finally {
      this.isRunning = true; // Reset to running state
    }
  }

  // Find forms that have recent insights activity
  async findActiveForms() {
    try {
      // Find insights created in the last 24 hours
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      // Get unique form IDs from recent feedback
      const recentFeedbacks = await Feedback.find({
        createdAt: { $gte: twentyFourHoursAgo },
      }).distinct("formId");

      if (recentFeedbacks.length === 0) {
        return [];
      }

      // Get the actual forms
      const activeForms = await Form.find({
        _id: { $in: recentFeedbacks },
      });

      return activeForms;
    } catch (error) {
      logger.error("Error finding active forms", {
        error: error.message,
        stack: error.stack,
      });
      return [];
    }
  }

  // Cluster insights for a specific form
  async clusterFormInsights(formId) {
    try {
      logger.info("Processing scheduled clustering for form", { formId });

      // Check if clustering was recently done (within last 6 hours)
      const sixHoursAgo = new Date();
      sixHoursAgo.setHours(sixHoursAgo.getHours() - 6);

      const recentClustering = await ClusterAnalysis.findOne({
        formId,
        createdAt: { $gte: sixHoursAgo },
      });

      if (recentClustering) {
        logger.info("Clustering recently performed for form, skipping", {
          formId,
          lastClustering: recentClustering.createdAt,
        });
        return { skipped: true, reason: "recent_clustering" };
      }

      // Check if form has enough insights to cluster
      const feedbacks = await Feedback.find({ formId });
      const feedbackIds = feedbacks.map((feedback) => feedback._id);
      const insightCount = await Insight.countDocuments({
        feedbackId: { $in: feedbackIds },
      });

      if (insightCount < 2) {
        logger.info("Form has insufficient insights for clustering", {
          formId,
          insightCount,
        });
        return { skipped: true, reason: "insufficient_insights" };
      }

      // Create mock request/response for clustering function
      const mockReq = { params: { formId: formId.toString() } };
      const mockRes = {
        status: (code) => ({
          json: (data) => {
            logger.info("Scheduled clustering completed for form", {
              formId,
              statusCode: code,
              clustersFound: data.clusters?.length || 0,
              totalInsights: data.totalInsights || 0,
            });
            return data;
          },
        }),
      };

      // Execute clustering
      await clusterInsightsByForm(mockReq, mockRes);

      return { success: true, formId };
    } catch (error) {
      logger.error("Error clustering form insights", {
        error: error.message,
        stack: error.stack,
        formId,
      });
      throw error;
    }
  }

  // Helper to describe cron expression in human-readable format
  describeCronExpression(expression) {
    const descriptions = {
      "0 * * * *": "Every hour",
      "*/30 * * * *": "Every 30 minutes",
      "0 */2 * * *": "Every 2 hours",
      "0 */6 * * *": "Every 6 hours",
      "0 8,20 * * *": "Twice daily (8 AM and 8 PM)",
      "0 2 * * *": "Daily at 2 AM",
    };

    return descriptions[expression] || `Custom: ${expression}`;
  }
}

// Export singleton instance
export default new ClusteringScheduler();
