import JiraApi from "jira-client";
import logger from "../logger.js";
import Organization from "../models/Organization.js";

class JiraService {
  constructor() {
    this.jiraClients = new Map(); // Cache Jira clients by organization
  }

  // Get or create Jira client for an organization
  async getJiraClient(organizationId) {
    try {
      // Check if we have a cached client
      if (this.jiraClients.has(organizationId)) {
        return this.jiraClients.get(organizationId);
      }

      // Fetch organization with Jira configuration
      const organization = await Organization.findOne({
        identifier: organizationId,
      });

      if (!organization) {
        logger.warn("Organization not found for Jira integration", {
          organizationId,
        });
        return null;
      }

      const { jiraConfig } = organization;

      if (
        !jiraConfig?.enabled ||
        !jiraConfig.host ||
        !jiraConfig.username ||
        !jiraConfig.apiToken
      ) {
        logger.warn("Jira integration not configured for organization", {
          organizationId,
          hasHost: !!jiraConfig?.host,
          hasUsername: !!jiraConfig?.username,
          hasToken: !!jiraConfig?.apiToken,
          enabled: jiraConfig?.enabled,
        });
        return null;
      }

      // Clean the host to remove any protocol and ensure it's just the hostname
      let cleanHost = jiraConfig.host;
      if (cleanHost.startsWith("https://")) {
        cleanHost = cleanHost.replace("https://", "");
      }
      if (cleanHost.startsWith("http://")) {
        cleanHost = cleanHost.replace("http://", "");
      }
      // Remove any trailing slashes
      cleanHost = cleanHost.replace(/\/$/, "");

      // Create new Jira client
      const jiraClient = new JiraApi({
        protocol: "https",
        host: cleanHost,
        username: jiraConfig.username,
        password: jiraConfig.apiToken,
        apiVersion: "2",
        strictSSL: true,
      });

      // Cache the client
      this.jiraClients.set(organizationId, {
        client: jiraClient,
        config: jiraConfig,
        organization: organization,
      });

      logger.info("Jira client created for organization", {
        organizationId,
        host: jiraConfig.host,
      });

      return this.jiraClients.get(organizationId);
    } catch (error) {
      logger.error("Failed to create Jira client for organization", {
        error: error.message,
        stack: error.stack,
        organizationId,
      });
      return null;
    }
  }

  async createTicket(clusterAnalysis) {
    try {
      const jiraConnection = await this.getJiraClient(
        clusterAnalysis.organization
      );

      if (!jiraConnection) {
        logger.warn(
          "Cannot create Jira ticket - Jira not configured for organization",
          {
            organization: clusterAnalysis.organization,
          }
        );
        return null;
      }

      const { client, config } = jiraConnection;

      if (!config.projectKey) {
        logger.error("Cannot create Jira ticket - project key not configured", {
          organization: clusterAnalysis.organization,
        });
        return null;
      }

      const issueData = {
        fields: {
          project: {
            key: config.projectKey,
          },
          summary: `User Feedback Cluster: ${clusterAnalysis.clusterLabel}`,
          description: this.formatDescription(clusterAnalysis),
          issuetype: {
            name: config.issueType || "Task",
          },
          labels: [
            "user-feedback",
            "ai-recommendation",
            `sentiment-${Math.round(clusterAnalysis.sentimentPercentage)}pct`,
            `impact-${clusterAnalysis.impact || "unknown"}`,
            `urgency-${clusterAnalysis.urgency || "unknown"}`,
          ],
        },
      };

      // Add priority if impact is available and organization supports priority
      if (clusterAnalysis.impact && config.supportsPriority !== false) {
        issueData.fields.priority = {
          name: this.mapImpactToPriority(clusterAnalysis.impact),
        };
      }

      let issue;
      try {
        // Try to create issue with all fields
        issue = await client.addNewIssue(issueData);
      } catch (error) {
        // If priority field is not available, retry without priority
        if (
          error.message &&
          error.message.includes("priority") &&
          issueData.fields.priority
        ) {
          logger.warn(
            "Priority field not available in Jira configuration, retrying without priority",
            {
              organization: clusterAnalysis.organization,
              projectKey: config.projectKey,
              issueType: config.issueType,
            }
          );

          // Remove priority and retry
          delete issueData.fields.priority;
          issue = await client.addNewIssue(issueData);

          // Update organization setting to avoid this issue in the future
          this.updateOrganizationPrioritySupport(
            clusterAnalysis.organization,
            false
          );
        } else {
          // Re-throw if it's a different error
          throw error;
        }
      }

      logger.info("Jira ticket created successfully", {
        issueKey: issue.key,
        clusterLabel: clusterAnalysis.clusterLabel,
        formId: clusterAnalysis.formId,
        organization: clusterAnalysis.organization,
      });

      return {
        ticketId: issue.key,
        ticketUrl: `https://${config.host}/browse/${issue.key}`,
        issue: issue,
      };
    } catch (error) {
      logger.error("Failed to create Jira ticket", {
        error: error.message,
        stack: error.stack,
        clusterLabel: clusterAnalysis.clusterLabel,
        formId: clusterAnalysis.formId,
        organization: clusterAnalysis.organization,
      });
      return null;
    }
  }

  formatDescription(clusterAnalysis) {
    return `
*Cluster Analysis Report*

*Summary:* ${clusterAnalysis.clusterSummary}

*Details:*
• Cluster Size: ${clusterAnalysis.clusterSize} insights
• Negative Sentiment: ${clusterAnalysis.sentimentPercentage.toFixed(1)}%
• Impact Level: ${clusterAnalysis.impact || "Not analyzed"}
• Urgency: ${clusterAnalysis.urgency || "Not analyzed"}

*AI Recommendation:*
${clusterAnalysis.recommendation || "No recommendation available"}

*Form ID:* ${clusterAnalysis.formId}
*Organization:* ${clusterAnalysis.organization}
*Analysis Date:* ${clusterAnalysis.createdAt}

This ticket was automatically generated based on user feedback clustering and AI analysis.
    `.trim();
  }

  mapImpactToPriority(impact) {
    switch (impact) {
      case "high":
        return "High";
      case "medium":
        return "Medium";
      case "low":
        return "Low";
      default:
        return "Medium";
    }
  }

  async updateTicket(organizationId, ticketId, updates) {
    try {
      const jiraConnection = await this.getJiraClient(organizationId);

      if (!jiraConnection) {
        logger.warn("Cannot update Jira ticket - Jira not configured");
        return null;
      }

      const { client } = jiraConnection;
      const issue = await client.updateIssue(ticketId, updates);

      logger.info("Jira ticket updated successfully", {
        ticketId,
        organizationId,
        updates,
      });

      return issue;
    } catch (error) {
      logger.error("Failed to update Jira ticket", {
        error: error.message,
        stack: error.stack,
        ticketId,
        organizationId,
      });
      return null;
    }
  }

  async getTicket(organizationId, ticketId) {
    try {
      const jiraConnection = await this.getJiraClient(organizationId);

      if (!jiraConnection) {
        logger.warn("Cannot get Jira ticket - Jira not configured");
        return null;
      }

      const { client } = jiraConnection;
      const issue = await client.findIssue(ticketId);
      return issue;
    } catch (error) {
      logger.error("Failed to get Jira ticket", {
        error: error.message,
        stack: error.stack,
        ticketId,
        organizationId,
      });
      return null;
    }
  }

  async testConnection(organizationId) {
    try {
      const jiraConnection = await this.getJiraClient(organizationId);

      if (!jiraConnection) {
        return {
          success: false,
          message: "Jira not configured for this organization",
        };
      }

      const { client } = jiraConnection;
      const serverInfo = await client.getServerInfo();

      return {
        success: true,
        message: "Connection successful",
        serverInfo,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  // Clear cached client when organization config changes
  clearClientCache(organizationId) {
    if (this.jiraClients.has(organizationId)) {
      this.jiraClients.delete(organizationId);
      logger.info("Cleared Jira client cache for organization", {
        organizationId,
      });
    }
  }

  // Update organization priority support setting
  async updateOrganizationPrioritySupport(organizationId, supportsPriority) {
    try {
      await Organization.findOneAndUpdate(
        { identifier: organizationId },
        { "jiraConfig.supportsPriority": supportsPriority }
      );

      // Clear cache to force reloading with new settings
      this.clearClientCache(organizationId);

      logger.info("Updated organization priority support setting", {
        organizationId,
        supportsPriority,
      });
    } catch (error) {
      logger.error("Failed to update organization priority support setting", {
        error: error.message,
        organizationId,
        supportsPriority,
      });
    }
  }
}

// Create singleton instance
const jiraService = new JiraService();
export default jiraService;
