import Insight from "../models/Insight.js";
import Feedback from "../models/Feedback.js";
import ClusterAnalysis from "../models/ClusterAnalysis.js";
import Organization from "../models/Organization.js";
import mongoose from "mongoose";
import logger from "../logger.js";
import { GoogleGenAI } from "@google/genai";
import {
  generateEmbedding,
  clusterEmbeddings,
  determineOptimalClusters,
} from "../services/clusteringService.js";
import jiraService from "../services/jiraService.js";
import emailService from "../services/emailService.js";

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
              Users are complaining about: "${clusterSummary}"
              
              Cluster theme: "${clusterLabel}"
              
              Suggest a product or UX improvement. Estimate the impact (high/medium/low) and urgency (immediate/soon/later).
              
              Guidelines:
              - High impact: Affects core functionality, revenue, or user retention
              - Medium impact: Affects user experience but not critical
              - Low impact: Nice-to-have improvements
              
              - Immediate: Fix within 1-2 weeks (critical issues)
              - Soon: Fix within 1-2 months (important improvements)
              - Later: Fix when resources allow (minor issues)

              Respond in JSON format:
              {
                "recommendation": "specific actionable recommendation with technical details",
                "impact": "high | medium | low",
                "urgency": "immediate | soon | later",
                "cluster_summary": "concise summary of what users are complaining about"
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

    // Get organization data for recommendation threshold
    let organizationData = null;
    if (insightsWithEmbeddings.length > 0) {
      const organizationIdentifier = insightsWithEmbeddings[0].organization;
      organizationData = await Organization.findOne({
        identifier: organizationIdentifier,
      });
    }

    // Use organization's recommendation threshold or default to 50%
    const recommendationThreshold = organizationData?.recommendationThreshold
      ? organizationData.recommendationThreshold * 100 // Convert from 0-1 to 0-100
      : 50;

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
        if (
          clusterInsights.length >= 5 &&
          sentimentPercentage >= recommendationThreshold
        ) {
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
            // Check if ticket was created within the organization's delay period
            const ticketDelay = organizationData?.ticketCreationDelay || 7; // Default to 7 days
            const delayDaysAgo = new Date();
            delayDaysAgo.setDate(delayDaysAgo.getDate() - ticketDelay);

            const recentTicket = await ClusterAnalysis.findOne({
              formId,
              clusterLabel,
              ticketCreated: true,
              lastTicketDate: { $gte: delayDaysAgo },
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

        // Create Jira ticket if needed
        if (shouldCreateTicket) {
          logger.info("Creating Jira ticket for cluster", {
            formId,
            clusterLabel,
            impact: aiAnalysis.impact,
            urgency: aiAnalysis.urgency,
            organization: clusterInsights[0].organization,
          });

          const jiraResult = await jiraService.createTicket(clusterAnalysis);

          if (jiraResult) {
            // Update the cluster analysis with Jira ticket information
            clusterAnalysis.jiraTicketId = jiraResult.ticketId;
            clusterAnalysis.jiraTicketUrl = jiraResult.ticketUrl;
            clusterAnalysis.jiraTicketStatus = "Open";
            await clusterAnalysis.save();

            logger.info("Jira ticket created and linked to cluster analysis", {
              formId,
              clusterLabel,
              ticketId: jiraResult.ticketId,
              ticketUrl: jiraResult.ticketUrl,
            });
          } else {
            logger.warn("Failed to create Jira ticket for cluster", {
              formId,
              clusterLabel,
              organization: clusterInsights[0].organization,
            });
          }
        }

        // Send email notification if sentiment threshold is exceeded
        const notificationThreshold =
          organizationData?.notificationThreshold || 0.7; // Default to 70%
        const sentimentThresholdExceeded =
          sentimentPercentage >= notificationThreshold * 100;

        if (sentimentThresholdExceeded && organizationData?.email) {
          logger.info("Sending cluster notification email", {
            formId,
            clusterLabel,
            sentimentPercentage,
            notificationThreshold: notificationThreshold * 100,
            organization: clusterInsights[0].organization,
          });

          const clusterData = {
            clusterLabel,
            clusterSize: clusterInsights.length,
            recommendation: aiAnalysis?.recommendation,
            impact: aiAnalysis?.impact,
            urgency: aiAnalysis?.urgency,
            jiraTicket: clusterAnalysis.jiraTicketId
              ? {
                  ticketId: clusterAnalysis.jiraTicketId,
                  ticketUrl: clusterAnalysis.jiraTicketUrl,
                  status: clusterAnalysis.jiraTicketStatus,
                }
              : null,
          };

          const emailSent = await emailService.sendClusterNotificationEmail(
            organizationData.email,
            organizationData.name,
            clusterData,
            sentimentPercentage
          );

          if (emailSent) {
            // Update cluster analysis to track email notification
            clusterAnalysis.emailNotificationSent = true;
            clusterAnalysis.emailNotificationDate = new Date();
            await clusterAnalysis.save();

            logger.info("Cluster notification email sent successfully", {
              formId,
              clusterLabel,
              organizationEmail: organizationData.email,
            });
          }
        } else if (sentimentThresholdExceeded && !organizationData?.email) {
          logger.warn(
            "Sentiment threshold exceeded but no organization email configured",
            {
              formId,
              clusterLabel,
              sentimentPercentage,
              organization: clusterInsights[0].organization,
            }
          );
        }

        return {
          clusterId,
          clusterLabel,
          insights: clusterInsights,
          sentimentPercentage,
          clusterSize: clusterInsights.length,
          analysis: aiAnalysis,
          shouldCreateTicket,
          emailNotificationSent: clusterAnalysis.emailNotificationSent || false,
          jiraTicket: clusterAnalysis.jiraTicketId
            ? {
                ticketId: clusterAnalysis.jiraTicketId,
                ticketUrl: clusterAnalysis.jiraTicketUrl,
                status: clusterAnalysis.jiraTicketStatus,
              }
            : null,
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
      .populate({
        path: "insightIds",
        select: "-embedding", // Exclude embedding field from insights
      });

    if (clusterAnalyses.length === 0) {
      logger.info("No cluster analyses found for form", { formId });
      return res.status(404).json({
        message:
          "No cluster analyses found for this form. Run clustering first.",
      });
    }

    // Format clusters with creation dates
    const clustersWithDates = clusterAnalyses.map((analysis) => ({
      ...analysis.toObject(),
      creationDate: analysis.createdAt,
      formattedDate: analysis.createdAt.toLocaleString(),
    }));

    res.status(200).json({
      formId,
      totalAnalyses: clusterAnalyses.length,
      clusters: clustersWithDates,
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

// Get cluster analysis for an organization
export const getClusterAnalysisByOrganization = async (req, res) => {
  try {
    const { organization } = req.params;

    if (!organization) {
      logger.warn("No organization ID provided for cluster analysis");
      return res.status(400).json({ message: "Organization ID is required" });
    }

    // Get recent cluster analyses for the organization
    const clusterAnalyses = await ClusterAnalysis.find({ organization })
      .sort({ createdAt: -1 })
      .limit(50) // Get last 50 analyses across all forms
      .populate({
        path: "insightIds",
        select: "-embedding", // Exclude embedding field from insights
      });

    if (clusterAnalyses.length === 0) {
      logger.info("No cluster analyses found for organization", {
        organization,
      });
      return res.status(404).json({
        message:
          "No cluster analyses found for this organization. Run clustering first.",
      });
    }

    // Group analyses by form for better organization
    const analysesByForm = {};
    clusterAnalyses.forEach((analysis) => {
      const formId = analysis.formId.toString();
      if (!analysesByForm[formId]) {
        analysesByForm[formId] = [];
      }
      analysesByForm[formId].push({
        ...analysis.toObject(),
        creationDate: analysis.createdAt,
        formattedDate: analysis.createdAt.toLocaleString(),
      });
    });

    // Calculate summary statistics
    const totalClusters = clusterAnalyses.length;
    const formsWithClusters = Object.keys(analysesByForm).length;
    const clustersWithTickets = clusterAnalyses.filter(
      (analysis) => analysis.ticketCreated
    ).length;
    const highImpactClusters = clusterAnalyses.filter(
      (analysis) => analysis.impact === "high"
    ).length;
    const urgentClusters = clusterAnalyses.filter(
      (analysis) => analysis.urgency === "immediate"
    ).length;

    res.status(200).json({
      organization,
      summary: {
        totalClusters,
        formsWithClusters,
        clustersWithTickets,
        highImpactClusters,
        urgentClusters,
      },
      analysesByForm,
      allAnalyses: clusterAnalyses.map((analysis) => ({
        ...analysis.toObject(),
        creationDate: analysis.createdAt,
        formattedDate: analysis.createdAt.toLocaleString(),
      })),
    });
  } catch (error) {
    logger.error("Error retrieving cluster analysis by organization", {
      error: error.message,
      stack: error.stack,
      organization: req.params.organization,
    });
    res.status(500).json({ message: error.message });
  }
};
