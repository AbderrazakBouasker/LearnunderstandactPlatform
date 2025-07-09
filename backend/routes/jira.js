import express from "express";
import jiraService from "../services/jiraService.js";
import ClusterAnalysis from "../models/ClusterAnalysis.js";
import Organization from "../models/Organization.js";
import logger from "../logger.js";

const router = express.Router();

// Test Jira connection for an organization
router.get("/test-connection/:organizationId", async (req, res) => {
  try {
    const { organizationId } = req.params;
    const result = await jiraService.testConnection(organizationId);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    logger.error("Error testing Jira connection", {
      error: error.message,
      stack: error.stack,
      organizationId: req.params.organizationId,
    });
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get Jira ticket status for a cluster analysis
router.get("/ticket/:clusterAnalysisId", async (req, res) => {
  try {
    const { clusterAnalysisId } = req.params;

    const clusterAnalysis = await ClusterAnalysis.findById(clusterAnalysisId);
    if (!clusterAnalysis) {
      return res.status(404).json({
        success: false,
        message: "Cluster analysis not found",
      });
    }

    if (!clusterAnalysis.jiraTicketId) {
      return res.status(404).json({
        success: false,
        message: "No Jira ticket associated with this cluster",
      });
    }

    const ticket = await jiraService.getTicket(
      clusterAnalysis.organization,
      clusterAnalysis.jiraTicketId
    );

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Jira ticket not found",
      });
    }

    res.status(200).json({
      success: true,
      ticket: {
        id: ticket.key,
        summary: ticket.fields.summary,
        status: ticket.fields.status.name,
        priority: ticket.fields.priority?.name,
        assignee: ticket.fields.assignee?.displayName,
        created: ticket.fields.created,
        updated: ticket.fields.updated,
        url: clusterAnalysis.jiraTicketUrl,
      },
    });
  } catch (error) {
    logger.error("Error getting Jira ticket", {
      error: error.message,
      stack: error.stack,
      clusterAnalysisId: req.params.clusterAnalysisId,
    });
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Manually create a Jira ticket for a cluster analysis
router.post("/create-ticket/:clusterAnalysisId", async (req, res) => {
  try {
    const { clusterAnalysisId } = req.params;

    const clusterAnalysis = await ClusterAnalysis.findById(clusterAnalysisId);
    if (!clusterAnalysis) {
      return res.status(404).json({
        success: false,
        message: "Cluster analysis not found",
      });
    }

    if (clusterAnalysis.jiraTicketId) {
      return res.status(400).json({
        success: false,
        message: "Jira ticket already exists for this cluster",
        ticketId: clusterAnalysis.jiraTicketId,
        ticketUrl: clusterAnalysis.jiraTicketUrl,
      });
    }

    const jiraResult = await jiraService.createTicket(clusterAnalysis);

    if (jiraResult) {
      // Update the cluster analysis with Jira ticket information
      clusterAnalysis.jiraTicketId = jiraResult.ticketId;
      clusterAnalysis.jiraTicketUrl = jiraResult.ticketUrl;
      clusterAnalysis.jiraTicketStatus = "Open";
      clusterAnalysis.ticketCreated = true;
      clusterAnalysis.lastTicketDate = new Date();
      await clusterAnalysis.save();

      res.status(201).json({
        success: true,
        message: "Jira ticket created successfully",
        ticket: {
          id: jiraResult.ticketId,
          url: jiraResult.ticketUrl,
        },
      });
    } else {
      res.status(500).json({
        success: false,
        message:
          "Failed to create Jira ticket. Check organization Jira configuration.",
      });
    }
  } catch (error) {
    logger.error("Error creating Jira ticket", {
      error: error.message,
      stack: error.stack,
      clusterAnalysisId: req.params.clusterAnalysisId,
    });
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get all clusters with Jira tickets for an organization
router.get("/tickets/:organizationId", async (req, res) => {
  try {
    const { organizationId } = req.params;
    const { formId } = req.query;

    const filter = {
      organization: organizationId,
      jiraTicketId: { $exists: true, $ne: null },
    };

    if (formId) {
      filter.formId = formId;
    }

    const clustersWithTickets = await ClusterAnalysis.find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("insightIds", "feedbackDescription sentiment keywords");

    const ticketsInfo = clustersWithTickets.map((cluster) => ({
      clusterAnalysisId: cluster._id,
      formId: cluster.formId,
      organization: cluster.organization,
      clusterLabel: cluster.clusterLabel,
      clusterSummary: cluster.clusterSummary,
      impact: cluster.impact,
      urgency: cluster.urgency,
      recommendation: cluster.recommendation,
      jiraTicket: {
        id: cluster.jiraTicketId,
        url: cluster.jiraTicketUrl,
        status: cluster.jiraTicketStatus,
      },
      createdAt: cluster.createdAt,
      lastTicketDate: cluster.lastTicketDate,
    }));

    res.status(200).json({
      success: true,
      tickets: ticketsInfo,
      total: ticketsInfo.length,
    });
  } catch (error) {
    logger.error("Error getting clusters with Jira tickets", {
      error: error.message,
      stack: error.stack,
      organizationId: req.params.organizationId,
    });
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Update organization Jira configuration
router.put("/config/:organizationId", async (req, res) => {
  try {
    const { organizationId } = req.params;
    const { jiraConfig } = req.body;

    if (!jiraConfig) {
      return res.status(400).json({
        success: false,
        message: "Jira configuration is required",
      });
    }

    // Validate required fields if enabled
    if (
      jiraConfig.enabled &&
      (!jiraConfig.host ||
        !jiraConfig.username ||
        !jiraConfig.apiToken ||
        !jiraConfig.projectKey)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Host, username, API token, and project key are required when Jira is enabled",
      });
    }

    const organization = await Organization.findOne({
      identifier: organizationId,
    });
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: "Organization not found",
      });
    }

    organization.jiraConfig = jiraConfig;
    await organization.save();

    // Clear the cached Jira client to force recreation with new config
    jiraService.clearClientCache(organizationId);

    res.status(200).json({
      success: true,
      message: "Jira configuration updated successfully",
      jiraConfig: organization.jiraConfig,
    });
  } catch (error) {
    logger.error("Error updating Jira configuration", {
      error: error.message,
      stack: error.stack,
      organizationId: req.params.organizationId,
    });
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get organization Jira configuration
router.get("/config/:organizationId", async (req, res) => {
  try {
    const { organizationId } = req.params;

    const organization = await Organization.findOne({
      identifier: organizationId,
    });
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: "Organization not found",
      });
    }

    // Don't send sensitive information like API tokens
    const safeConfig = {
      ...organization.jiraConfig,
      apiToken: organization.jiraConfig?.apiToken ? "***HIDDEN***" : null,
    };

    res.status(200).json({
      success: true,
      jiraConfig: safeConfig,
    });
  } catch (error) {
    logger.error("Error getting Jira configuration", {
      error: error.message,
      stack: error.stack,
      organizationId: req.params.organizationId,
    });
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;
