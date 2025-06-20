import Insight from "../models/Insight.js";
import Feedback from "../models/Feedback.js";
import ClusterAnalysis from "../models/ClusterAnalysis.js";
import mongoose from "mongoose";
import logger from "../logger.js";
import { GoogleGenAI } from "@google/genai";
import {
  generateEmbedding,
  clusterEmbeddings,
  determineOptimalClusters,
} from "../services/clusteringService.js";

// Initialize Google GenAI
const genAIClient = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY });

// Helper function to analyze cluster with AI
const analyzeClusterWithAI = async (clusterInsights, clusterLabel) => {
  try {
    const modelName = process.env.AI_MODEL;
    const generationConfig = {
      responseMimeType: "application/json",
    };

    const clusterSummary = clusterInsights
      .map((insight) => insight.feedbackDescription)
      .join("; ");

    const requestPayloadContents = [
      {
        role: "user",
        parts: [
          {
            text: `
              Analyze this cluster of user feedback: "${clusterSummary}"
              
              The cluster is labeled as: "${clusterLabel}"
              
              Based on the feedback patterns, provide:
              1. A product or UX improvement recommendation
              2. Impact assessment (high/medium/low) 
              3. Urgency level (immediate/soon/later)
              4. A brief summary of the cluster theme

              Respond in JSON format:
              {
                "recommendation": "specific actionable recommendation",
                "impact": "high | medium | low",
                "urgency": "immediate | soon | later",
                "cluster_summary": "brief description of the cluster theme"
              }
            `,
          },
        ],
      },
    ];

    const result = await genAIClient.models.generateContent({
      model: modelName,
      config: generationConfig,
      contents: requestPayloadContents,
    });

    const textResponse = result.text;
    return JSON.parse(textResponse);
  } catch (error) {
    logger.error("Error analyzing cluster with AI", {
      error: error.message,
      clusterLabel,
    });
    return null;
  }
};

// Cluster insights for a form
export const clusterInsightsByForm = async (req, res) => {
  try {
    const { formId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(formId)) {
      logger.warn("Invalid form ID provided for clustering", { formId });
      return res.status(400).json({ message: "Invalid form ID" });
    }

    // Get all insights for the form
    const feedbacks = await Feedback.find({ formId });
    const feedbackIds = feedbacks.map((feedback) => feedback._id);
    const insights = await Insight.find({ feedbackId: { $in: feedbackIds } });

    if (insights.length < 2) {
      logger.info("Not enough insights for clustering", {
        formId,
        count: insights.length,
      });
      return res.status(200).json({
        message: "Not enough insights for clustering (minimum 2 required)",
        clusters: [],
      });
    }

    // Generate embeddings for insights that don't have them
    const insightsWithEmbeddings = await Promise.all(
      insights.map(async (insight) => {
        if (!insight.embedding || insight.embedding.length === 0) {
          const textToEmbed = `${
            insight.feedbackDescription
          } ${insight.keywords.join(" ")}`;
          const embedding = await generateEmbedding(textToEmbed);

          // Update the insight with the embedding
          await Insight.findByIdAndUpdate(insight._id, { embedding });
          insight.embedding = embedding;
        }
        return insight;
      })
    );

    // Extract embeddings for clustering
    const embeddings = insightsWithEmbeddings.map(
      (insight) => insight.embedding
    );

    // Determine optimal number of clusters
    const optimalK = determineOptimalClusters(insights.length);

    // Perform clustering
    const clusterAssignments = clusterEmbeddings(embeddings, optimalK);

    // Group insights by cluster
    const clusters = {};
    insightsWithEmbeddings.forEach((insight, index) => {
      const clusterId = clusterAssignments[index];
      if (!clusters[clusterId]) {
        clusters[clusterId] = [];
      }
      clusters[clusterId].push(insight);
    });

    // Analyze each cluster
    const clusterAnalyses = await Promise.all(
      Object.entries(clusters).map(async ([clusterId, clusterInsights]) => {
        // Calculate sentiment percentage
        const negativeCount = clusterInsights.filter(
          (insight) =>
            insight.sentiment === "very dissatisfied" ||
            insight.sentiment === "dissatisfied"
        ).length;
        const sentimentPercentage =
          (negativeCount / clusterInsights.length) * 100;

        // Generate cluster label from common keywords
        const allKeywords = clusterInsights.flatMap(
          (insight) => insight.keywords
        );
        const keywordCounts = {};
        allKeywords.forEach((keyword) => {
          keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
        });
        const topKeywords = Object.entries(keywordCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3)
          .map(([keyword]) => keyword);
        const clusterLabel =
          topKeywords.join(", ") || `Cluster ${parseInt(clusterId) + 1}`;

        let aiAnalysis = null;
        let shouldCreateTicket = false;

        // Check if cluster meets criteria for AI analysis
        if (clusterInsights.length >= 5 && sentimentPercentage >= 60) {
          aiAnalysis = await analyzeClusterWithAI(
            clusterInsights,
            clusterLabel
          );

          // Check if we should create a ticket
          if (
            aiAnalysis &&
            aiAnalysis.impact === "high" &&
            (aiAnalysis.urgency === "immediate" ||
              aiAnalysis.urgency === "soon")
          ) {
            // Check if ticket was created in last 7 days
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const recentTicket = await ClusterAnalysis.findOne({
              formId,
              clusterLabel,
              ticketCreated: true,
              lastTicketDate: { $gte: sevenDaysAgo },
            });

            shouldCreateTicket = !recentTicket;
          }
        }

        // Save cluster analysis
        const clusterAnalysis = new ClusterAnalysis({
          formId,
          organization: clusterInsights[0].organization,
          clusterLabel,
          clusterSummary:
            aiAnalysis?.cluster_summary ||
            `Cluster of ${clusterInsights.length} insights about ${clusterLabel}`,
          insightIds: clusterInsights.map((insight) => insight._id),
          sentimentPercentage,
          clusterSize: clusterInsights.length,
          recommendation: aiAnalysis?.recommendation,
          impact: aiAnalysis?.impact,
          urgency: aiAnalysis?.urgency,
          ticketCreated: shouldCreateTicket,
          lastTicketDate: shouldCreateTicket ? new Date() : null,
        });

        await clusterAnalysis.save();

        if (shouldCreateTicket) {
          logger.info("Ticket should be created for cluster", {
            formId,
            clusterLabel,
            impact: aiAnalysis.impact,
            urgency: aiAnalysis.urgency,
          });
          // TODO: Integrate with Jira/Trello API here
        }

        return {
          clusterId,
          clusterLabel,
          insights: clusterInsights,
          sentimentPercentage,
          clusterSize: clusterInsights.length,
          analysis: aiAnalysis,
          shouldCreateTicket,
        };
      })
    );

    logger.info("Clustering completed successfully", {
      formId,
      totalInsights: insights.length,
      clustersFound: clusterAnalyses.length,
    });

    res.status(200).json({
      formId,
      totalInsights: insights.length,
      clusters: clusterAnalyses,
    });
  } catch (error) {
    logger.error("Error clustering insights", {
      error: error.message,
      stack: error.stack,
      formId: req.params.formId,
    });
    res.status(500).json({ message: error.message });
  }
};

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

//Get all by organization
export const getInsightsByOrganization = async (req, res) => {
  try {
    const { organization } = req.params;

    if (!organization) {
      logger.warn("No organization ID provided");
      return res.status(400).json({ message: "Organization ID is required" });
    }

    const insights = await Insight.find({ organization });

    if (insights.length === 0) {
      logger.info("No insights found for organization", { organization });
      return res
        .status(404)
        .json({ message: "No insights found for this organization" });
    }

    res.status(200).json(insights);
  } catch (error) {
    // Log the error with additional context
    logger.error("Error retrieving insights by organization", {
      error: error.message,
      stack: error.stack,
      organization,
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

// Get cluster analysis for a form
export const getClusterAnalysisByForm = async (req, res) => {
  try {
    const { formId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(formId)) {
      logger.warn("Invalid form ID provided for cluster analysis", { formId });
      return res.status(400).json({ message: "Invalid form ID" });
    }

    // Get recent cluster analyses for the form
    const clusterAnalyses = await ClusterAnalysis.find({ formId })
      .sort({ createdAt: -1 })
      .limit(10) // Get last 10 analyses
      .populate("insightIds");

    if (clusterAnalyses.length === 0) {
      logger.info("No cluster analyses found for form", { formId });
      return res.status(404).json({
        message:
          "No cluster analyses found for this form. Run clustering first.",
      });
    }

    // Group by creation date to show latest analysis
    const latestAnalysis = clusterAnalyses.reduce((acc, analysis) => {
      const date = analysis.createdAt.toDateString();
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(analysis);
      return acc;
    }, {});

    res.status(200).json({
      formId,
      totalAnalyses: clusterAnalyses.length,
      latestAnalysis,
      clusters: clusterAnalyses,
    });
  } catch (error) {
    logger.error("Error retrieving cluster analysis", {
      error: error.message,
      stack: error.stack,
      formId: req.params.formId,
    });
    res.status(500).json({ message: error.message });
  }
};
