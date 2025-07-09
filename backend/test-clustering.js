#!/usr/bin/env node

import "./services/clusteringService.js";
import {
  generateEmbedding,
  clusterEmbeddings,
  determineOptimalClusters,
} from "./services/clusteringService.js";

// Test data simulating insights
const testInsights = [
  "The checkout process is broken and doesn't work",
  "Payment system has bugs and fails frequently",
  "Can't complete purchase due to technical issues",
  "Love the new UI design and layout",
  "The interface looks amazing and modern",
  "Great visual improvements to the website",
  "App crashes when I try to login",
  "Login functionality is not working properly",
  "Cannot access my account due to authentication errors",
];

async function testClustering() {
  try {
    console.log("🚀 Testing clustering functionality...\n");

    // Step 1: Generate embeddings
    console.log("📊 Generating embeddings...");
    const embeddings = await Promise.all(
      testInsights.map(async (text, index) => {
        const embedding = await generateEmbedding(text);
        console.log(
          `  ✅ Insight ${index + 1}: ${embedding.length} dimensions`
        );
        return embedding;
      })
    );

    // Step 2: Determine optimal clusters
    const optimalK = determineOptimalClusters(testInsights.length);
    console.log(`\n🎯 Optimal number of clusters: ${optimalK}`);

    // Step 3: Perform clustering
    console.log("\n🔄 Performing clustering...");
    const clusterAssignments = clusterEmbeddings(embeddings, optimalK);

    // Step 4: Display results
    console.log("\n📋 Clustering Results:");
    console.log("=".repeat(50));

    const clusters = {};
    testInsights.forEach((insight, index) => {
      const clusterId = clusterAssignments[index];
      if (!clusters[clusterId]) {
        clusters[clusterId] = [];
      }
      clusters[clusterId].push({ index: index + 1, text: insight });
    });

    Object.entries(clusters).forEach(([clusterId, insights]) => {
      console.log(
        `\n🏷️  Cluster ${parseInt(clusterId) + 1} (${
          insights.length
        } insights):`
      );
      insights.forEach(({ index, text }) => {
        console.log(`   ${index}. ${text}`);
      });
    });

    console.log("\n✅ Clustering test completed successfully!");
  } catch (error) {
    console.error("❌ Error during clustering test:", error.message);
    process.exit(1);
  }
}

// Run the test
testClustering();
