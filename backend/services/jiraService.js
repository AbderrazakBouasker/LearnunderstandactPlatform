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

      // The host comes with protocol from the Organization model
      // Strip the protocol since jira-client expects just the hostname
      const hostWithoutProtocol = jiraConfig.host
        .replace(/^https?:\/\//, "")
        .replace(/\/$/, "");

      const jiraClient = new JiraApi({
        host: hostWithoutProtocol, // Remove protocol as jira-client adds it automatically
        username: jiraConfig.username,
        password: jiraConfig.apiToken,
        apiVersion: "2",
        strictSSL: true,
      });

      // Cache the client with cleaned hostname
      this.jiraClients.set(organizationId, {
        client: jiraClient,
        config: jiraConfig,
        organization: organization,
        cleanHost: hostWithoutProtocol, // Store cleaned hostname for URL construction
      });

      logger.info("Jira client created for organization", {
        organizationId,
        host: hostWithoutProtocol, // Log the cleaned hostname
        originalHost: jiraConfig.host, // Log the original for debugging
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

      const { client, config, cleanHost } = jiraConnection;

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
        // Log the issue data for debugging
        logger.info("Creating Jira issue with data", {
          organizationId: clusterAnalysis.organization,
          projectKey: config.projectKey,
          issueType: config.issueType || "Task",
          summary: issueData.fields.summary,
          hasPriority: !!issueData.fields.priority,
        });

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
          // Re-throw the error for proper handling in the outer catch
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
        ticketUrl: `https://${cleanHost}/browse/${issue.key}`,
        issue: issue,
      };
    } catch (error) {
      // Parse the error message to provide better insights
      let errorDetails = {
        error: error.message,
        stack: error.stack,
        clusterLabel: clusterAnalysis.clusterLabel,
        formId: clusterAnalysis.formId,
        organization: clusterAnalysis.organization,
      };

      // Add specific guidance based on error type
      if (error.message && error.message.includes("permission")) {
        errorDetails.errorType = "PERMISSION_ERROR";
        errorDetails.troubleshooting = [
          "This was working before, so likely a temporary issue",
          "Try refreshing the API token",
          "Check if Jira project permissions changed recently",
          "Verify if the user account is still active",
        ];
      } else if (error.message && error.message.includes("project")) {
        errorDetails.errorType = "PROJECT_ERROR";
        errorDetails.troubleshooting = [
          "Check if project key is still valid",
          "Verify project still exists and is accessible",
          "Ensure issue type is available in the project",
        ];
      } else if (error.message && error.message.includes("authentication")) {
        errorDetails.errorType = "AUTH_ERROR";
        errorDetails.troubleshooting = [
          "API token may have expired",
          "Generate a new API token",
          "Verify username is correct",
        ];
      } else {
        errorDetails.errorType = "UNKNOWN_ERROR";
        errorDetails.troubleshooting = [
          "Check Jira server status",
          "Verify network connectivity",
          "Review Jira logs for more details",
        ];
      }

      logger.error("Failed to create Jira ticket", errorDetails);
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

      const { client, config } = jiraConnection;

      // Test basic connection
      const serverInfo = await client.getServerInfo();

      // Test project access and permissions
      let projectAccessible = false;
      let createPermission = false;
      let projectInfo = null;

      try {
        // Check if project exists and is accessible
        projectInfo = await client.getProject(config.projectKey);
        projectAccessible = true;

        // Check create permission by getting user permissions for the project
        const permissions = await client.getPermissions({
          projectKey: config.projectKey,
        });

        // Check if user has CREATE_ISSUES permission
        createPermission =
          permissions.permissions?.CREATE_ISSUES?.havePermission || false;
      } catch (projError) {
        logger.warn("Project access test failed", {
          organizationId,
          projectKey: config.projectKey,
          error: projError.message,
        });
      }

      return {
        success: true,
        message: "Connection successful",
        serverInfo: {
          version: serverInfo.version,
          buildNumber: serverInfo.buildNumber,
          serverTitle: serverInfo.serverTitle,
        },
        projectAccess: {
          accessible: projectAccessible,
          projectKey: config.projectKey,
          projectName: projectInfo?.name || "Unknown",
          createPermission: createPermission,
        },
        recommendations: projectAccessible
          ? createPermission
            ? []
            : [
                "User lacks CREATE_ISSUES permission",
                "Contact Jira admin to grant proper permissions",
                "Ensure user is in appropriate project role",
              ]
          : [
              "Project not accessible or doesn't exist",
              "Verify project key is correct",
              "Check if user has project access",
            ],
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        recommendations: [
          "Check API token validity",
          "Verify Jira host URL",
          "Ensure network connectivity to Jira instance",
        ],
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
