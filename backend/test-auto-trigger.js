#!/usr/bin/env node

// Test script to verify automatic clustering trigger logic

const testTriggerLogic = () => {
  console.log("🧪 Testing automatic clustering trigger logic...\n");

  // Test the modulo logic for every 5 insights
  const testCases = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 20, 25];

  console.log("📊 Insight Count → Clustering Trigger");
  console.log("=".repeat(40));

  testCases.forEach((count) => {
    const shouldTrigger = count > 0 && count % 5 === 0;
    const status = shouldTrigger ? "✅ TRIGGER" : "⏸️  Skip";
    console.log(`${count.toString().padStart(2)} insights → ${status}`);
  });

  console.log("\n📈 Summary:");
  console.log("- Clustering triggers at: 5, 10, 15, 20, 25, etc.");
  console.log("- No trigger for: 1, 2, 3, 4, 6, 7, 8, 9, 11, etc.");
  console.log("- This prevents excessive clustering while staying current");

  console.log("\n✅ Automatic trigger logic test completed!");
};

// Run the test
testTriggerLogic();
