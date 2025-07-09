import Feedback from "../models/Feedback.js";
import Form from "../models/Form.js";
import Insight from "../models/Insight.js";
import logger from "../logger.js";
// Changed import to use @google/genai and GoogleGenAI class
import { GoogleGenAI } from "@google/genai";
import { model } from "mongoose";
import { generateEmbedding } from "../services/clusteringService.js";

// Initialize Google GenAI
// Ensure GOOGLE_AI_API_KEY is set in your environment variables
const genAIClient = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY });

// Helper function to map HTML types to JavaScript types
const mapHtmlTypeToJsType = (htmlType) => {
  const typeMapping = {
    text: "string",
    number: "number",
    date: "string",
    email: "string",
    textarea: "string",
    file: "string",
    checkbox: "object", // Assuming checkbox can be an array of selected values
    radio: "string",
    color: "string",
    tel: "string",
    time: "string",
  };
  return typeMapping[htmlType] || "string";
};

// Function to analyze feedback sentiment and keywords using Google GenAI
const analyzeFeedbackWithGenAI = async (feedbackContent) => {
  try {
    // Model name can be adjusted as needed, e.g., "gemini-1.5-flash", "gemini-1.5-pro-latest"
    const modelName = process.env.AI_MODEL;
    // console.log(modelName);
    const generationConfig = {
      responseMimeType: "application/json", // Request JSON output
    };
    delete feedbackContent.opinion;
    // console.log("Feedback content to analyze:", feedbackContent);
    const requestPayloadContents = [
      {
        role: "user",
        parts: [
          {
            text: `
              Analyze the following customer feedback that include the form title , the form description and the form fields filled by the customer to determine:
              1. The overall sentiment (very dissatisfied, dissatisfied, neutral, satisfied, or very satisfied)
              2. A description or summary of the topic of the feedback as concluded from the fields filled by the customer
              2. A list of key topics/keywords (maximum 5) mentioned in the feedback

              Respond in JSON format with the following structure:
              {
                "sentiment": "one of: very dissatisfied, dissatisfied, neutral, satisfied, very satisfied",
                "feedbackDescription": "description or summary of the feedback of the customer",
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

    // Corrected: Access text() directly from the result object if result.response is undefined.
    // This assumes 'result' itself is the response object containing the text method for @google/genai.
    // If 'result' is undefined or does not have .text(), further inspection of 'result' structure is needed.
    if (!result) {
      logger.error("GenAI call returned undefined result");
      return null;
    }

    const textResponse = result.text; // Changed from result.response.text()

    // Print the raw response to console
    // console.log("GenAI Analysis Response:", textResponse);

    // Parse the response as JSON
    try {
      const jsonResponse = JSON.parse(textResponse);
      return jsonResponse;
    } catch (parseError) {
      logger.error("Error parsing GenAI response", {
        error: parseError.message,
        response: textResponse,
      });
      return null;
    }
  } catch (error) {
    logger.error("Error analyzing feedback with GenAI", {
      error: error.message,
      stack: error.stack,
    });
    return null;
  }
};

// Helper function to trigger automatic clustering
const triggerAutomaticClustering = async (formId) => {
  try {
    // Count total insights for this form
    const feedbacks = await Feedback.find({ formId });
    const feedbackIds = feedbacks.map((feedback) => feedback._id);
    const totalInsights = await Insight.countDocuments({
      feedbackId: { $in: feedbackIds },
    });

    // Trigger clustering every 5 insights
    if (totalInsights > 0 && totalInsights % 5 === 0) {
      logger.info("Auto-triggering clustering", {
        formId,
        totalInsights,
        trigger: "every_5_insights",
      });

      // Import the clustering function dynamically to avoid circular imports
      const { clusterInsightsByForm } = await import("./insight.js");

      // Create a mock request/response for the clustering function
      const mockReq = { params: { formId } };
      const mockRes = {
        status: (code) => ({
          json: (data) => {
            logger.info("Auto-clustering completed", {
              formId,
              statusCode: code,
              clustersFound: data.clusters?.length || 0,
            });
          },
        }),
      };

      // Call clustering function
      await clusterInsightsByForm(mockReq, mockRes);
    }
  } catch (error) {
    logger.error("Error in automatic clustering trigger", {
      error: error.message,
      formId,
      stack: error.stack,
    });
    // Don't throw - automatic clustering failure shouldn't break feedback creation
  }
};

//CREATE
export const createFeedback = async (req, res) => {
  try {
    const formId = req.params.id;
    const { opinion, fields } = req.body;

    // Get the form schema by ID
    const form = await Form.findById(formId);
    if (!form) {
      return res.status(404).json({ error: "Form not found" });
    }

    // Verify the inputs against the form schema
    const formFields = form.fields;
    for (const field of formFields) {
      const inputField = fields.find((f) => f.label === field.label);
      if (!inputField) {
        return res.status(400).json({ error: `Missing field: ${field.label}` });
      }
      const expectedType = mapHtmlTypeToJsType(field.type);
      if (typeof inputField.value !== expectedType) {
        return res.status(400).json({
          error: `Invalid type for field: ${
            field.label
          }. Expected ${expectedType}, got ${typeof inputField.value}`,
        });
      }
    }

    // Store the feedback
    const newFeedback = new Feedback({
      formId,
      formTitle: form.title,
      formDescription: form.description,
      organization: form.organization,
      opinion,
      fields,
    });
    await newFeedback.save();

    // Analyze the feedback using Google GenAI
    const feedbackToAnalyze =
      `Form Title: ${form.title}, Form Description: ${form.description}, Fields: ` +
      fields.map((field) => `${field.label}: ${field.value}`).join(" ");
    const analysisResult = await analyzeFeedbackWithGenAI(feedbackToAnalyze);

    if (analysisResult) {
      // console.log(
      //   "Feedback Analysis Result:",
      //   JSON.stringify(analysisResult, null, 2)
      // );

      // Generate embedding for the feedback description and keywords
      const textToEmbed = `${
        analysisResult.feedbackDescription
      } ${analysisResult.keywords.join(" ")}`;
      let embedding = null;

      try {
        const rawEmbedding = await generateEmbedding(textToEmbed);
        // Convert Float32Array to regular array of numbers
        embedding = Array.isArray(rawEmbedding)
          ? rawEmbedding
          : Array.from(rawEmbedding);

        logger.info("Generated embedding for insight", {
          feedbackId: newFeedback._id,
          embeddingLength: embedding.length,
          embeddingType: typeof embedding[0],
        });
      } catch (embeddingError) {
        logger.warn("Failed to generate embedding, continuing without it", {
          error: embeddingError.message,
          feedbackId: newFeedback._id,
        });
      }

      // Create an Insight record based on the analysis
      const newInsight = new Insight({
        feedbackId: newFeedback._id,
        formId: newFeedback.formId,
        organization: newFeedback.organization,
        formTitle: newFeedback.formTitle,
        formDescription: newFeedback.formDescription,
        sentiment: analysisResult.sentiment,
        feedbackDescription: analysisResult.feedbackDescription,
        keywords: analysisResult.keywords,
        embedding: embedding, // Add the embedding
      });
      await newInsight.save();
      console.log(newInsight);
      logger.info("Insight created from GenAI analysis", {
        insightId: newInsight._id,
        hasEmbedding: !!embedding,
      });

      // Trigger automatic clustering if applicable
      await triggerAutomaticClustering(formId);
    }

    res.status(201).json({
      message: "Feedback and Insight created successfully",
    });
  } catch (error) {
    // Log the error with additional context
    logger.error("Error creating feedback", {
      error: error.message,
      stack: error.stack,
      requestBody: req.body,
    });
    res.status(500).json({ error: error.message });
  }
};

//READ
export const getFeedbacks = async (req, res) => {
  try {
    const feedbacks = await Feedback.find();
    if (feedbacks.length === 0) {
      return res.status(204).json();
    }
    res.status(200).json(feedbacks);
  } catch (error) {
    // Log the error with additional context
    logger.error("Error retrieving feedbacks", {
      error: error.message,
      stack: error.stack,
    });
    res.status(404).json({ error: error.message });
  }
};

//READ BY ORGANIZATION
export const getFeedbacksByOrganization = async (req, res) => {
  try {
    const { organization } = req.params;
    const feedbacks = await Feedback.find({ organization });
    if (feedbacks.length === 0) {
      return res.status(204).json();
    }
    res.status(200).json(feedbacks);
  } catch (error) {
    // Log the error with additional context
    logger.error("Error retrieving feedbacks by organization", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: error.message });
  }
};

//READ BY ID
export const getFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const feedback = await Feedback.findById(id);
    if (!feedback) {
      return res.status(404).json({ error: "Feedback not found" });
    }
    res.status(200).json(feedback);
  } catch (error) {
    // Log the error with additional context
    logger.error("Error retrieving feedback by ID", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: error.message });
  }
};

//READ BY FORM ID
export const getFeedbackByFormId = async (req, res) => {
  try {
    const { id } = req.params;
    const feedback = await Feedback.find({ formId: id });
    if (feedback.length === 0) {
      return res.status(204).json();
    }
    res.status(200).json(feedback);
  } catch (error) {
    // Log the error with additional context
    logger.error("Error retrieving feedback by form ID", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: error.message });
  }
};

//DELETE
export const deleteFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const feedback = await Feedback.findByIdAndDelete(id);
    if (!feedback) {
      return res.status(404).json({ error: "Feedback not found" });
    }
    res.status(200).json({ feedback });
  } catch (error) {
    // Log the error with additional context
    logger.error("Error deleting feedback", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: error.message });
  }
};
