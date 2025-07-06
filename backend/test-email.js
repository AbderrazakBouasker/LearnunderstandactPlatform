import dotenv from "dotenv";
import emailService from "./services/emailService.js";
import logger from "./logger.js";

// Load environment variables
dotenv.config();

// Test email functionality
const testEmailIntegration = async () => {
  console.log("Testing SendGrid email integration...");

  try {
    // Test basic email sending
    const testEmail = process.env.TEST_EMAIL || "test@example.com";
    console.log(`Sending test email to: ${testEmail}`);

    const result = await emailService.sendTestEmail(testEmail);

    if (result) {
      console.log("✅ Test email sent successfully!");
    } else {
      console.log("❌ Test email failed to send");
    }

    // Test cluster notification email
    console.log("\nTesting cluster notification email...");

    const mockClusterData = {
      clusterLabel: "Login Issues",
      clusterSize: 8,
      recommendation:
        "Improve login flow by adding better error messages and reducing the number of required fields",
      impact: "high",
      urgency: "immediate",
      jiraTicket: {
        ticketId: "PROJ-123",
        ticketUrl: "https://example.atlassian.net/browse/PROJ-123",
        status: "Open",
      },
    };

    const notificationResult = await emailService.sendClusterNotificationEmail(
      testEmail,
      "Test Organization",
      mockClusterData,
      85.5
    );

    if (notificationResult) {
      console.log("✅ Cluster notification email sent successfully!");
    } else {
      console.log("❌ Cluster notification email failed to send");
    }
  } catch (error) {
    console.error("❌ Error during email testing:", error.message);
    logger.error("Email testing error", { error: error.message });
  }
};

// Run the test
testEmailIntegration();
