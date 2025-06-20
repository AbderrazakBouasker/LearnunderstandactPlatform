#!/usr/bin/env node

// Test embedding storage format to verify the fix

import "./services/clusteringService.js";
import { generateEmbedding } from "./services/clusteringService.js";

async function testEmbeddingFormat() {
  try {
    console.log("🧪 Testing embedding format for MongoDB storage...\n");

    const testText = "The checkout process is very slow and buggy";
    console.log(`📝 Test text: "${testText}"`);

    // Generate embedding
    const embedding = await generateEmbedding(testText);

    // Verify format
    console.log("\n✅ Embedding Generated Successfully!");
    console.log("📊 Format Analysis:");
    console.log(`   - Type: ${typeof embedding}`);
    console.log(`   - Is Array: ${Array.isArray(embedding)}`);
    console.log(`   - Length: ${embedding.length}`);
    console.log(`   - First element type: ${typeof embedding[0]}`);
    console.log(
      `   - Sample values: [${embedding
        .slice(0, 3)
        .map((n) => n.toFixed(6))
        .join(", ")}...]`
    );

    // Test MongoDB compatibility
    const isMongoCompatible =
      Array.isArray(embedding) &&
      embedding.every((val) => typeof val === "number" && !isNaN(val));

    console.log(
      `\n🗄️  MongoDB Compatible: ${isMongoCompatible ? "✅ YES" : "❌ NO"}`
    );

    // Test JSON serialization (what MongoDB uses)
    try {
      const jsonString = JSON.stringify(embedding);
      const parsed = JSON.parse(jsonString);
      const isJsonCompatible =
        Array.isArray(parsed) && parsed.length === embedding.length;
      console.log(
        `📄 JSON Serializable: ${isJsonCompatible ? "✅ YES" : "❌ NO"}`
      );
    } catch (jsonError) {
      console.log(`📄 JSON Serializable: ❌ NO - ${jsonError.message}`);
    }

    console.log(
      "\n🎉 Test completed! Embeddings should now work with MongoDB."
    );
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    process.exit(1);
  }
}

testEmbeddingFormat();
