import dotenv from "dotenv";
import logger from "./logger.js";

// Load environment variables
dotenv.config();

// Simulate the delay mechanism from emailService
let lastEmailSentTime = 0;
const EMAIL_DELAY_MS = 1500; // 1.5 seconds

const waitForEmailDelay = async () => {
  const now = Date.now();
  const timeSinceLastEmail = now - lastEmailSentTime;

  if (timeSinceLastEmail < EMAIL_DELAY_MS) {
    const delayNeeded = EMAIL_DELAY_MS - timeSinceLastEmail;
    console.log(`Waiting ${delayNeeded}ms before sending next email`);
    await new Promise((resolve) => setTimeout(resolve, delayNeeded));
  }

  lastEmailSentTime = Date.now();
};

// Simulate email sending with delay
const simulateEmailSending = async (emailNumber) => {
  console.log(`\nPreparing to send email ${emailNumber}...`);

  await waitForEmailDelay();

  console.log(`Email ${emailNumber} sent at: ${new Date().toISOString()}`);

  // Simulate some processing time
  await new Promise((resolve) => setTimeout(resolve, 100));

  return true;
};

// Test the delay functionality
const testDelayMechanism = async () => {
  console.log("Testing email delay mechanism...");
  console.log("This demonstrates the 1.5 second delay between emails\n");

  const startTime = Date.now();

  // Send 4 emails in sequence
  for (let i = 1; i <= 4; i++) {
    const emailStartTime = Date.now();
    await simulateEmailSending(i);
    const emailEndTime = Date.now();

    if (i > 1) {
      const timeSinceStart = emailEndTime - startTime;
      const expectedTime = (i - 1) * EMAIL_DELAY_MS;
      console.log(
        `  Expected delay: ~${expectedTime}ms, Actual: ${timeSinceStart}ms`
      );
    }
  }

  const totalTime = Date.now() - startTime;
  const expectedTotalTime = 3 * EMAIL_DELAY_MS; // 3 delays for 4 emails

  console.log(`\nTotal time: ${totalTime}ms`);
  console.log(`Expected time: ~${expectedTotalTime}ms`);
  console.log(
    `Delay mechanism working: ${Math.abs(totalTime - expectedTotalTime) < 200 ? "✅" : "❌"}`
  );
};

// Run the test
testDelayMechanism()
  .then(() => {
    console.log("\nDelay mechanism test completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Delay mechanism test failed:", error);
    process.exit(1);
  });
