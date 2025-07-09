import dotenv from "dotenv";
import emailService from "./services/emailService.js";
import logger from "./logger.js";

// Load environment variables
dotenv.config();

// Test email delay functionality
const testEmailDelayFunctionality = async () => {
  console.log("Testing email delay functionality...");
  console.log("This test will demonstrate the 1.5 second delay between emails");

  try {
    const testEmail = process.env.TEST_EMAIL || "abderrazakbouasker@gmail.com";

    // Test sending multiple emails with delay
    console.log("\n--- Testing sequential email sending with delay ---");

    const startTime = Date.now();
    console.log(`Starting at: ${new Date().toISOString()}`);

    // Send first test email
    console.log("Sending first test email...");
    const result1 = await emailService.sendTestEmail(testEmail);
    const time1 = Date.now();
    console.log(
      `First email result: ${result1 ? "✅ Success" : "❌ Failed"} at ${new Date().toISOString()}`
    );

    // Send second test email (should wait 1.5 seconds)
    console.log("Sending second test email...");
    const result2 = await emailService.sendTestEmail(testEmail);
    const time2 = Date.now();
    console.log(
      `Second email result: ${result2 ? "✅ Success" : "❌ Failed"} at ${new Date().toISOString()}`
    );

    const timeBetweenEmails = time2 - time1;
    console.log(
      `Time between emails: ${timeBetweenEmails}ms (should be ~1500ms)`
    );

    // Test batch email sending
    console.log("\n--- Testing batch email sending ---");

    const emailBatch = [
      {
        type: "test",
        to: testEmail,
      },
      {
        type: "test",
        to: testEmail,
      },
      {
        type: "cluster-notification",
        to: testEmail,
        organizationName: "Test Organization",
        clusterData: {
          clusterLabel: "Login Issues Test",
          clusterSize: 5,
          recommendation: "Improve login flow for better user experience",
          impact: "medium",
          urgency: "soon",
          jiraTicket: null,
        },
        sentimentPercentage: 75.2,
      },
    ];

    const batchStartTime = Date.now();
    console.log(`Batch sending started at: ${new Date().toISOString()}`);

    const batchResults = await emailService.sendBatchEmails(emailBatch);
    const batchEndTime = Date.now();

    console.log(`Batch sending completed at: ${new Date().toISOString()}`);
    console.log(
      `Total batch time: ${batchEndTime - batchStartTime}ms (should be ~4500ms for 3 emails)`
    );

    console.log("\nBatch Results:");
    batchResults.forEach((result, index) => {
      console.log(
        `  Email ${index + 1}: ${result.success ? "✅ Success" : "❌ Failed"} - ${result.type} to ${result.to}`
      );
      if (result.error) {
        console.log(`    Error: ${result.error}`);
      }
    });
  } catch (error) {
    console.error("Error during email delay test:", error.message);
  }
};

// Run the test
testEmailDelayFunctionality()
  .then(() => {
    console.log("\nEmail delay test completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Email delay test failed:", error);
    process.exit(1);
  });
