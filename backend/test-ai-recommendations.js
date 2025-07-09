#!/usr/bin/env node

// Test script to generate sample negative feedback and trigger AI recommendations

import mongoose from "mongoose";
import dotenv from "dotenv";
import Feedback from "./models/Feedback.js";
import Form from "./models/Form.js";
import Insight from "./models/Insight.js";
import { GoogleGenAI } from "@google/genai";
import { generateEmbedding } from "./services/clusteringService.js";

// Load environment variables
dotenv.config();

// Initialize Google GenAI
const genAIClient = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY });

// Sample negative feedback scenarios
const negativeTestCases = [
  {
    opinion: "very dissatisfied",
    fields: [
      { label: "issue type", value: "checkout problems" },
      {
        label: "description",
        value:
          "The checkout button doesn't work on mobile. I tried multiple times but it just freezes.",
      },
      { label: "device", value: "iPhone" },
    ],
  },
  {
    opinion: "dissatisfied",
    fields: [
      { label: "issue type", value: "payment failure" },
      {
        label: "description",
        value:
          "Payment keeps failing even with valid credit card. Very frustrating experience.",
      },
      { label: "device", value: "Android" },
    ],
  },
  {
    opinion: "very dissatisfied",
    fields: [
      { label: "issue type", value: "mobile bugs" },
      {
        label: "description",
        value:
          "App crashes every time I try to complete purchase on mobile device.",
      },
      { label: "device", value: "Mobile" },
    ],
  },
  {
    opinion: "dissatisfied",
    fields: [
      { label: "issue type", value: "checkout errors" },
      {
        label: "description",
        value:
          "Checkout process is broken. Button is unresponsive and I can't finish my order.",
      },
      { label: "device", value: "Mobile" },
    ],
  },
  {
    opinion: "very dissatisfied",
    fields: [
      { label: "issue type", value: "payment issues" },
      {
        label: "description",
        value:
          "Cannot complete payment on mobile. The page keeps refreshing and losing my data.",
      },
      { label: "device", value: "iPhone" },
    ],
  },
  {
    opinion: "dissatisfied",
    fields: [
      { label: "issue type", value: "mobile checkout" },
      {
        label: "description",
        value:
          "Mobile checkout is completely broken. Buttons don't respond to touch.",
      },
      { label: "device", value: "Android" },
    ],
  },
];

// Function to analyze feedback (simplified version)
const analyzeFeedbackWithGenAI = async (feedbackContent) => {
  try {
    const modelName = process.env.AI_MODEL;
    const generationConfig = {
      responseMimeType: "application/json",
    };

    const requestPayloadContents = [
      {
        role: "user",
        parts: [
          {
            text: `
              Analyze the following customer feedback to determine:
              1. The overall sentiment (very dissatisfied, dissatisfied, neutral, satisfied, or very satisfied)
              2. A description or summary of the feedback
              3. A list of key topics/keywords (maximum 5)

              Respond in JSON format:
              {
                "sentiment": "one of: very dissatisfied, dissatisfied, neutral, satisfied, very satisfied",
                "feedbackDescription": "description or summary of the feedback",
                "keywords": ["keyword1", "keyword2", "etc"]
              }

              Feedback: "${feedbackContent}"
            `,
          },
        ],
      },
    ];

    const result = await genAIClient.models.generateContent({
      model: modelName,
      config: generationConfig,
      contents: requestPayloadContents,
    });

    return JSON.parse(result.text);
  } catch (error) {
    console.error("Error analyzing feedback:", error.message);
    return null;
  }
};

async function createTestFeedbacks() {
  try {
    console.log("🧪 Setting up test environment for AI recommendations...\n");

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URL + process.env.MONGO_DB_NAME);
    console.log("✅ Connected to MongoDB");

    // Find or create a test form
    let testForm = await Form.findOne({ title: "Mobile Checkout Test Form" });

    if (!testForm) {
      testForm = new Form({
        title: "Mobile Checkout Test Form",
        description: "Test form for mobile checkout issues",
        organization: "test-org",
        fields: [
          { label: "issue type", type: "text", required: true },
          { label: "description", type: "textarea", required: true },
          { label: "device", type: "text", required: true },
        ],
      });
      await testForm.save();
      console.log("✅ Created test form");
    } else {
      console.log("✅ Using existing test form");
    }

    console.log(`📝 Form ID: ${testForm._id}\n`);

    // Create negative feedback and insights
    console.log("📊 Creating negative feedback samples...");

    for (let i = 0; i < negativeTestCases.length; i++) {
      const testCase = negativeTestCases[i];

      // Create feedback
      const feedback = new Feedback({
        formId: testForm._id,
        formTitle: testForm.title,
        formDescription: testForm.description,
        organization: testForm.organization,
        opinion: testCase.opinion,
        fields: testCase.fields,
      });
      await feedback.save();

      // Analyze feedback
      const feedbackToAnalyze =
        `Form Title: ${testForm.title}, Form Description: ${testForm.description}, Fields: ` +
        testCase.fields
          .map((field) => `${field.label}: ${field.value}`)
          .join(" ");

      const analysisResult = await analyzeFeedbackWithGenAI(feedbackToAnalyze);

      if (analysisResult) {
        // Generate embedding
        const textToEmbed = `${
          analysisResult.feedbackDescription
        } ${analysisResult.keywords.join(" ")}`;
        const embedding = await generateEmbedding(textToEmbed);

        // Create insight
        const insight = new Insight({
          feedbackId: feedback._id,
          formId: testForm._id,
          organization: testForm.organization,
          formTitle: testForm.title,
          formDescription: testForm.description,
          sentiment: analysisResult.sentiment,
          feedbackDescription: analysisResult.feedbackDescription,
          keywords: analysisResult.keywords,
          embedding: Array.from(embedding),
        });
        await insight.save();

        console.log(
          `   ${i + 1}. ✅ Created feedback + insight (${
            analysisResult.sentiment
          })`
        );
      }
    }

    console.log("\n🎯 Test data created successfully!");
    console.log(`📋 Form ID to test clustering: ${testForm._id}`);
    console.log("\n🚀 Now run clustering to see AI recommendations:");
    console.log(`   POST /api/insight/cluster/form/${testForm._id}`);
    console.log(
      "\n💡 Expected: AI will generate recommendations for mobile checkout issues"
    );

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating test data:", error.message);
    process.exit(1);
  }
}

// Run the test
createTestFeedbacks();
