import Insight from "../models/Insight.js";
import Feedback from "../models/Feedback.js";
import mongoose from "mongoose";
import logger from "../logger.js";

// Get all insights
export const getAllInsights = async (req, res) => {
  try {
    const insights = await Insight.find({});
    res.status(200).json(insights);
  } catch (error) {
    // Log the error with additional context
    logger.error("Error retrieving all insights", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ message: error.message });
  }
};

// Get insight by ID
export const getInsightById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      logger.warn("Invalid insight ID provided", { id });
      return res.status(400).json({ message: "Invalid insight ID" });
    }

    const insight = await Insight.findById(id);

    if (!insight) {
      logger.info("Insight not found", { id });
      return res.status(404).json({ message: "Insight not found" });
    }

    res.status(200).json(insight);
  } catch (error) {
    // Log the error with additional context
    logger.error("Error retrieving insight by ID", {
      error: error.message,
      stack: error.stack,
      insightId: req.params.id,
    });
    res.status(500).json({ message: error.message });
  }
};

// Get insights by feedback ID
export const getInsightsByFeedbackId = async (req, res) => {
  try {
    const { feedbackId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(feedbackId)) {
      logger.warn("Invalid feedback ID provided", { feedbackId });
      return res.status(400).json({ message: "Invalid feedback ID" });
    }

    const insights = await Insight.find({ feedbackId });

    if (insights.length === 0) {
      logger.info("No insights found for feedback", { feedbackId });
      return res
        .status(404)
        .json({ message: "No insights found for this feedback" });
    }

    res.status(200).json(insights);
  } catch (error) {
    // Log the error with additional context
    logger.error("Error retrieving insights by feedback ID", {
      error: error.message,
      stack: error.stack,
      feedbackId: req.params.feedbackId,
    });
    res.status(500).json({ message: error.message });
  }
};

// Get insights by form ID
export const getInsightsByFormId = async (req, res) => {
  try {
    const { formId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(formId)) {
      logger.warn("Invalid form ID provided", { formId });
      return res.status(400).json({ message: "Invalid form ID" });
    }

    // First, find all feedback documents with this form ID
    const feedbacks = await Feedback.find({ formId });

    if (feedbacks.length === 0) {
      logger.info("No feedback found for form", { formId });
      return res
        .status(404)
        .json({ message: "No feedback found for this form" });
    }

    // Extract the feedback IDs
    const feedbackIds = feedbacks.map((feedback) => feedback._id);

    // Then find all insights with these feedback IDs
    const insights = await Insight.find({ feedbackId: { $in: feedbackIds } });

    if (insights.length === 0) {
      logger.info("No insights found for form", { formId });
      return res
        .status(404)
        .json({ message: "No insights found for this form" });
    }

    res.status(200).json(insights);
  } catch (error) {
    // Log the error with additional context
    logger.error("Error retrieving insights by form ID", {
      error: error.message,
      stack: error.stack,
      formId: req.params.formId,
    });
    res.status(500).json({ message: error.message });
  }
};

// Delete insight
export const deleteInsight = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      logger.warn("Invalid insight ID provided for deletion", { id });
      return res.status(400).json({ message: "Invalid insight ID" });
    }

    const deletedInsight = await Insight.findByIdAndDelete(id);

    if (!deletedInsight) {
      logger.info("Attempted to delete non-existent insight", { id });
      return res.status(404).json({ message: "Insight not found" });
    }

    logger.info("Insight deleted successfully", { id });
    res.status(200).json({ message: "Insight deleted successfully" });
  } catch (error) {
    // Log the error with additional context
    logger.error("Error deleting insight", {
      error: error.message,
      stack: error.stack,
      insightId: req.params.id,
    });
    res.status(500).json({ message: error.message });
  }
};
