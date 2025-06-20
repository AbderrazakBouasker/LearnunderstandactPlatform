import { pipeline } from "@xenova/transformers";
import logger from "../logger.js";

let embedder = null;
let isInitializing = false;

// Initialize the embedding model (lazy loading with singleton pattern)
const initializeEmbedder = async () => {
  if (embedder) {
    return embedder;
  }

  if (isInitializing) {
    // Wait for ongoing initialization
    while (isInitializing) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return embedder;
  }

  isInitializing = true;
  try {
    logger.info("Initializing embedding model...");
    embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
    logger.info("Embedding model initialized successfully");
    return embedder;
  } catch (error) {
    logger.error("Failed to initialize embedding model", {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  } finally {
    isInitializing = false;
  }
};

// Generate embeddings for text
export const generateEmbedding = async (text) => {
  try {
    const model = await initializeEmbedder();
    const embeddings = await model(text, { pooling: "mean", normalize: true });

    // Convert tensor to array - handle different possible return types
    let embeddingArray;

    if (embeddings.data) {
      // If it has a .data property (tensor-like)
      embeddingArray = Array.from(embeddings.data);
    } else if (Array.isArray(embeddings)) {
      // If it's already an array
      embeddingArray = embeddings;
    } else if (embeddings instanceof Float32Array) {
      // If it's a Float32Array
      embeddingArray = Array.from(embeddings);
    } else {
      // Fallback - try to convert to array
      embeddingArray = Array.from(embeddings);
    }

    // Ensure we have an array of numbers
    if (
      !Array.isArray(embeddingArray) ||
      typeof embeddingArray[0] !== "number"
    ) {
      throw new Error("Failed to convert embedding to number array");
    }

    return embeddingArray;
  } catch (error) {
    logger.error("Error generating embedding", {
      error: error.message,
      text: text?.substring(0, 100), // Log first 100 chars for debugging
    });
    throw error;
  }
};

// Calculate cosine similarity between two embeddings
export const cosineSimilarity = (embeddingA, embeddingB) => {
  if (embeddingA.length !== embeddingB.length) {
    throw new Error("Embeddings must have the same length");
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < embeddingA.length; i++) {
    dotProduct += embeddingA[i] * embeddingB[i];
    normA += embeddingA[i] * embeddingA[i];
    normB += embeddingB[i] * embeddingB[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

// Simple K-means clustering implementation
export const clusterEmbeddings = (embeddings, k = 3, maxIterations = 100) => {
  if (embeddings.length < k) {
    // If we have fewer insights than clusters, each gets its own cluster
    return embeddings.map((_, index) => index);
  }

  const dimensions = embeddings[0].length;

  // Initialize centroids randomly
  let centroids = [];
  for (let i = 0; i < k; i++) {
    const randomIndex = Math.floor(Math.random() * embeddings.length);
    centroids.push([...embeddings[randomIndex]]);
  }

  let assignments = new Array(embeddings.length).fill(0);
  let hasChanged = true;
  let iterations = 0;

  while (hasChanged && iterations < maxIterations) {
    hasChanged = false;

    // Assign each point to nearest centroid
    for (let i = 0; i < embeddings.length; i++) {
      let bestCluster = 0;
      let bestDistance = Infinity;

      for (let j = 0; j < k; j++) {
        const similarity = cosineSimilarity(embeddings[i], centroids[j]);
        const distance = 1 - similarity; // Convert similarity to distance

        if (distance < bestDistance) {
          bestDistance = distance;
          bestCluster = j;
        }
      }

      if (assignments[i] !== bestCluster) {
        assignments[i] = bestCluster;
        hasChanged = true;
      }
    }

    // Update centroids
    for (let j = 0; j < k; j++) {
      const clusterPoints = embeddings.filter((_, i) => assignments[i] === j);

      if (clusterPoints.length > 0) {
        for (let d = 0; d < dimensions; d++) {
          centroids[j][d] =
            clusterPoints.reduce((sum, point) => sum + point[d], 0) /
            clusterPoints.length;
        }
      }
    }

    iterations++;
  }

  return assignments;
};

// Determine optimal number of clusters using simple heuristics
export const determineOptimalClusters = (insightCount) => {
  if (insightCount <= 2) return 1;
  if (insightCount <= 5) return 2;
  if (insightCount <= 10) return 3;
  if (insightCount <= 20) return 4;
  return Math.min(5, Math.floor(Math.sqrt(insightCount)));
};
