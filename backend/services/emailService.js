import { Resend } from "resend";
import logger from "../logger.js";

// Initialize Resend with API key
let resend = null;
if (
  process.env.RESEND_API_KEY &&
  process.env.RESEND_API_KEY !== "your_actual_resend_api_key_here"
) {
  resend = new Resend(process.env.RESEND_API_KEY);
} else {
  logger.warn("Resend API key not configured properly");
}

// Track last email sent time to implement delay
let lastEmailSentTime = 0;
const EMAIL_DELAY_MS = 1500; // 1.5 seconds

// Helper function to add delay between emails
const waitForEmailDelay = async () => {
  const now = Date.now();
  const timeSinceLastEmail = now - lastEmailSentTime;

  if (timeSinceLastEmail < EMAIL_DELAY_MS) {
    const delayNeeded = EMAIL_DELAY_MS - timeSinceLastEmail;
    logger.info(`Waiting ${delayNeeded}ms before sending next email`);
    await new Promise((resolve) => setTimeout(resolve, delayNeeded));
  }

  lastEmailSentTime = Date.now();
};

// Email template for cluster notifications
const createClusterNotificationEmail = (
  organizationName,
  clusterData,
  sentimentPercentage
) => {
  const {
    clusterLabel,
    clusterSize,
    recommendation,
    impact,
    urgency,
    jiraTicket,
  } = clusterData;

  const impactColor = {
    high: "#ff4444",
    medium: "#ffaa00",
    low: "#44ff44",
  };

  const urgencyColor = {
    immediate: "#ff0000",
    soon: "#ff8800",
    later: "#0088ff",
  };

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">🚨 High Sentiment Alert</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">${organizationName}</p>
      </div>
      
      <div style="background: #f8f9fa; padding: 20px; border-left: 4px solid #667eea;">
        <h2 style="color: #333; margin: 0 0 15px 0;">Cluster Analysis Summary</h2>
        
        <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
          <h3 style="color: #555; margin: 0 0 10px 0;">📊 Cluster Details</h3>
          <ul style="list-style: none; padding: 0; margin: 0;">
            <li style="margin: 8px 0;"><strong>Cluster Topic:</strong> ${clusterLabel}</li>
            <li style="margin: 8px 0;"><strong>Number of Insights:</strong> ${clusterSize}</li>
            <li style="margin: 8px 0;"><strong>Negative Sentiment:</strong> 
              <span style="background: #ff4444; color: white; padding: 2px 8px; border-radius: 12px; font-weight: bold;">
                ${sentimentPercentage.toFixed(1)}%
              </span>
            </li>
          </ul>
        </div>

        ${
          recommendation
            ? `
        <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
          <h3 style="color: #555; margin: 0 0 10px 0;">💡 AI Recommendation</h3>
          <p style="margin: 0; color: #666; line-height: 1.5;">${recommendation}</p>
        </div>

        <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
          <h3 style="color: #555; margin: 0 0 10px 0;">📈 Priority Assessment</h3>
          <div style="display: flex; gap: 20px; align-items: center;">
            <div>
              <span style="background: ${
                impactColor[impact] || "#666"
              }; color: white; padding: 4px 12px; border-radius: 16px; font-size: 12px; font-weight: bold; text-transform: uppercase;">
                ${impact} Impact
              </span>
            </div>
            <div>
              <span style="background: ${
                urgencyColor[urgency] || "#666"
              }; color: white; padding: 4px 12px; border-radius: 16px; font-size: 12px; font-weight: bold; text-transform: uppercase;">
                ${urgency} Urgency
              </span>
            </div>
          </div>
        </div>
        `
            : ""
        }

        ${
          jiraTicket
            ? `
        <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
          <h3 style="color: #555; margin: 0 0 10px 0;">🎫 Jira Ticket Created</h3>
          <p style="margin: 0;">
            <a href="${jiraTicket.ticketUrl}" style="color: #0052cc; text-decoration: none; font-weight: bold;">
              ${jiraTicket.ticketId}
            </a>
            <span style="color: #666; margin-left: 10px;">(${jiraTicket.status})</span>
          </p>
        </div>
        `
            : ""
        }

        <div style="background: #e8f4f8; padding: 15px; border-radius: 8px; border-left: 4px solid #17a2b8;">
          <p style="margin: 0; color: #155724; font-size: 14px;">
            <strong>Action Required:</strong> This cluster has exceeded your organization's notification threshold of ${sentimentPercentage.toFixed(
              1
            )}%. 
            Please review the feedback and consider implementing the recommended improvements.
          </p>
        </div>
      </div>
      
      <div style="background: #333; color: white; padding: 15px; border-radius: 0 0 10px 10px; text-align: center;">
        <p style="margin: 0; font-size: 12px; opacity: 0.8;">
          This is an automated notification from your LUA Platform
        </p>
      </div>
    </div>
  `;

  const text = `
    🚨 HIGH SENTIMENT ALERT - ${organizationName}
    
    Cluster Analysis Summary:
    - Cluster Topic: ${clusterLabel}
    - Number of Insights: ${clusterSize}
    - Negative Sentiment: ${sentimentPercentage.toFixed(1)}%
    
    ${
      recommendation
        ? `
    AI Recommendation:
    ${recommendation}
    
    Priority: ${impact} Impact, ${urgency} Urgency
    `
        : ""
    }
    
    ${
      jiraTicket
        ? `
    Jira Ticket: ${jiraTicket.ticketId} (${jiraTicket.status})
    URL: ${jiraTicket.ticketUrl}
    `
        : ""
    }
    
    This cluster has exceeded your organization's notification threshold. Please review the feedback and consider implementing the recommended improvements.
  `;

  return { html, text };
};

// Send cluster notification email
export const sendClusterNotificationEmail = async (
  organizationEmail,
  organizationName,
  clusterData,
  sentimentPercentage
) => {
  try {
    if (!resend) {
      logger.warn(
        "Resend API key not configured properly, skipping email notification"
      );
      return false;
    }

    if (!organizationEmail) {
      logger.warn(
        "Organization email not configured, skipping email notification",
        {
          organizationName,
          clusterLabel: clusterData.clusterLabel,
        }
      );
      return false;
    }

    // Wait for delay before sending email
    await waitForEmailDelay();

    const { html, text } = createClusterNotificationEmail(
      organizationName,
      clusterData,
      sentimentPercentage
    );

    const emailData = {
      from: process.env.FROM_EMAIL || "notifications@luaplatform.com",
      to: organizationEmail,
      subject: `🚨 High Sentiment Alert: ${
        clusterData.clusterLabel
      } (${sentimentPercentage.toFixed(1)}% negative)`,
      text,
      html,
    };

    // Send email asynchronously
    const emailResult = await resend.emails.send(emailData);

    logger.info("Cluster notification email sent successfully", {
      to: organizationEmail,
      organizationName,
      clusterLabel: clusterData.clusterLabel,
      sentimentPercentage,
      emailId: emailResult?.id,
    });

    return true;
  } catch (error) {
    logger.error("Error sending cluster notification email", {
      error: error.message,
      organizationEmail,
      organizationName,
      clusterLabel: clusterData.clusterLabel,
      sentimentPercentage,
    });
    return false;
  }
};

// Send test email (for debugging)
export const sendTestEmail = async (toEmail) => {
  try {
    if (!resend) {
      throw new Error("Resend API key not configured properly");
    }

    // Wait for delay before sending email
    await waitForEmailDelay();

    const emailData = {
      from: process.env.FROM_EMAIL || "notifications@luaplatform.com",
      to: toEmail,
      subject: "LUA Platform - Test Email",
      text: "This is a test email from LUA Platform to verify Resend integration.",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #667eea;">LUA Platform Test Email</h1>
          <p>This is a test email to verify that Resend integration is working correctly.</p>
          <p>If you receive this email, the integration is successful!</p>
        </div>
      `,
    };

    // Send email asynchronously
    const emailResult = await resend.emails.send(emailData);

    logger.info("Test email sent successfully", {
      to: toEmail,
      emailId: emailResult?.id,
    });
    return true;
  } catch (error) {
    logger.error("Error sending test email", {
      error: error.message,
      to: toEmail,
    });
    return false;
  }
};

// Send multiple emails with delay between each
export const sendBatchEmails = async (emailBatch) => {
  const results = [];

  for (let i = 0; i < emailBatch.length; i++) {
    const emailConfig = emailBatch[i];

    try {
      let result;

      if (emailConfig.type === "test") {
        result = await sendTestEmail(emailConfig.to);
      } else if (emailConfig.type === "cluster-notification") {
        result = await sendClusterNotificationEmail(
          emailConfig.to,
          emailConfig.organizationName,
          emailConfig.clusterData,
          emailConfig.sentimentPercentage
        );
      }

      results.push({
        index: i,
        success: result,
        to: emailConfig.to,
        type: emailConfig.type,
      });

      logger.info(`Batch email ${i + 1}/${emailBatch.length} processed`, {
        to: emailConfig.to,
        type: emailConfig.type,
        success: result,
      });
    } catch (error) {
      logger.error(`Error processing batch email ${i + 1}`, {
        error: error.message,
        to: emailConfig.to,
        type: emailConfig.type,
      });

      results.push({
        index: i,
        success: false,
        to: emailConfig.to,
        type: emailConfig.type,
        error: error.message,
      });
    }
  }

  const successCount = results.filter((r) => r.success).length;
  logger.info(`Batch email sending completed`, {
    total: emailBatch.length,
    successful: successCount,
    failed: emailBatch.length - successCount,
  });

  return results;
};

export default {
  sendClusterNotificationEmail,
  sendTestEmail,
  sendBatchEmails,
};
