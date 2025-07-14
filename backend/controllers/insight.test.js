import {
  clusterInsightsByForm,
  getAllInsights,
  getInsightsByOrganization,
  getInsightById,
  getInsightsByFeedbackId,
  getInsightsByFormId,
  deleteInsight,
  getClusterAnalysisByForm,
  getClusterAnalysisByOrganization,
} from "./insight.js";

import Insight from "../models/Insight.js";
import Feedback from "../models/Feedback.js";
import ClusterAnalysis from "../models/ClusterAnalysis.js";
import Organization from "../models/Organization.js";
import mongoose from "mongoose";
import logger from "../logger.js";
import { GoogleGenAI } from "@google/genai";

// Mock dependencies
jest.mock("../models/Insight.js");
jest.mock("../models/Feedback.js");
jest.mock("../models/ClusterAnalysis.js");
jest.mock("../models/Organization.js");
jest.mock("../logger.js", () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
}));
jest.mock("@google/genai");
jest.mock("../services/clusteringService.js", () => ({
  generateEmbedding: jest.fn(),
  clusterEmbeddings: jest.fn(),
  determineOptimalClusters: jest.fn(),
}));
jest.mock("../services/jiraService.js", () => ({
  createTicket: jest.fn(),
}));
jest.mock("../services/emailService.js", () => ({
  sendEmail: jest.fn(),
}));

// Import mocked services
import {
  generateEmbedding,
  clusterEmbeddings,
  determineOptimalClusters,
} from "../services/clusteringService.js";
import jiraService from "../services/jiraService.js";
import emailService from "../services/emailService.js";

describe("Insight Controller", () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: {},
      body: {},
      user: { organization: "test-org" },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Setup mongoose mock
    mongoose.Types = {
      ObjectId: {
        isValid: jest.fn(),
      },
    };

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe("getAllInsights", () => {
    it("should return all insights successfully", async () => {
      const mockInsights = [
        { _id: "1", feedbackDescription: "Test insight 1" },
        { _id: "2", feedbackDescription: "Test insight 2" },
      ];

      Insight.find.mockResolvedValue(mockInsights);

      await getAllInsights(req, res);

      expect(Insight.find).toHaveBeenCalledWith({});
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockInsights);
    });

    it.skip("should handle database errors", async () => {
      const error = new Error("Database error");
      Insight.find.mockRejectedValue(error);

      await getAllInsights(req, res);

      expect(logger.error).toHaveBeenCalledWith(
        "Error retrieving all insights",
        {
          error: error.message,
          stack: error.stack,
        }
      );
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: error.message });
    });
  });

  describe("getInsightsByOrganization", () => {
    it("should return insights for valid organization", async () => {
      const organization = "test-org";
      const mockInsights = [
        { _id: "1", organization, feedbackDescription: "Test insight 1" },
      ];

      req.params.organization = organization;
      Insight.find.mockResolvedValue(mockInsights);

      await getInsightsByOrganization(req, res);

      expect(Insight.find).toHaveBeenCalledWith({ organization });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockInsights);
    });

    it("should return 400 when organization is not provided", async () => {
      await getInsightsByOrganization(req, res);

      expect(logger.warn).toHaveBeenCalledWith("No organization ID provided");
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Organization ID is required",
      });
    });

    it("should return 404 when no insights found", async () => {
      req.params.organization = "test-org";
      Insight.find.mockResolvedValue([]);

      await getInsightsByOrganization(req, res);

      expect(logger.info).toHaveBeenCalledWith(
        "No insights found for organization",
        { organization: "test-org" }
      );
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: "No insights found for this organization",
      });
    });

    it.skip("should handle database errors", async () => {
      req.params.organization = "test-org";
      const error = new Error("Database error");
      Insight.find.mockRejectedValue(error);

      await getInsightsByOrganization(req, res);

      expect(logger.error).toHaveBeenCalledWith(
        "Error retrieving insights by organization",
        {
          error: error.message,
          stack: error.stack,
          organization: undefined,
        }
      );
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: error.message });
    });
  });

  describe("getInsightById", () => {
    it("should return insight for valid ID", async () => {
      const insightId = "507f1f77bcf86cd799439011";
      const mockInsight = {
        _id: insightId,
        feedbackDescription: "Test insight",
      };

      req.params.id = insightId;
      mongoose.Types.ObjectId.isValid.mockReturnValue(true);
      Insight.findById.mockResolvedValue(mockInsight);

      await getInsightById(req, res);

      expect(mongoose.Types.ObjectId.isValid).toHaveBeenCalledWith(insightId);
      expect(Insight.findById).toHaveBeenCalledWith(insightId);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockInsight);
    });

    it("should return 400 for invalid ID", async () => {
      const invalidId = "invalid-id";
      req.params.id = invalidId;
      mongoose.Types.ObjectId.isValid.mockReturnValue(false);

      await getInsightById(req, res);

      expect(logger.warn).toHaveBeenCalledWith("Invalid insight ID provided", {
        id: invalidId,
      });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid insight ID" });
    });

    it("should return 404 when insight not found", async () => {
      const insightId = "507f1f77bcf86cd799439011";
      req.params.id = insightId;
      mongoose.Types.ObjectId.isValid.mockReturnValue(true);
      Insight.findById.mockResolvedValue(null);

      await getInsightById(req, res);

      expect(logger.info).toHaveBeenCalledWith("Insight not found", {
        id: insightId,
      });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Insight not found" });
    });

    it("should handle database errors", async () => {
      const insightId = "507f1f77bcf86cd799439011";
      req.params.id = insightId;
      mongoose.Types.ObjectId.isValid.mockReturnValue(true);
      const error = new Error("Database error");
      Insight.findById.mockRejectedValue(error);

      await getInsightById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: error.message });
    });
  });

  describe("getInsightsByFeedbackId", () => {
    it("should return insights for valid feedback ID", async () => {
      const feedbackId = "507f1f77bcf86cd799439011";
      const mockInsights = [
        { _id: "1", feedbackId, feedbackDescription: "Test insight 1" },
      ];

      req.params.feedbackId = feedbackId;
      mongoose.Types.ObjectId.isValid.mockReturnValue(true);
      Insight.find.mockResolvedValue(mockInsights);

      await getInsightsByFeedbackId(req, res);

      expect(mongoose.Types.ObjectId.isValid).toHaveBeenCalledWith(feedbackId);
      expect(Insight.find).toHaveBeenCalledWith({ feedbackId });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockInsights);
    });

    it("should return 400 for invalid feedback ID", async () => {
      const invalidId = "invalid-id";
      req.params.feedbackId = invalidId;
      mongoose.Types.ObjectId.isValid.mockReturnValue(false);

      await getInsightsByFeedbackId(req, res);

      expect(logger.warn).toHaveBeenCalledWith("Invalid feedback ID provided", {
        feedbackId: invalidId,
      });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid feedback ID" });
    });

    it("should return 404 when no insights found", async () => {
      const feedbackId = "507f1f77bcf86cd799439011";
      req.params.feedbackId = feedbackId;
      mongoose.Types.ObjectId.isValid.mockReturnValue(true);
      Insight.find.mockResolvedValue([]);

      await getInsightsByFeedbackId(req, res);

      expect(logger.info).toHaveBeenCalledWith(
        "No insights found for feedback",
        { feedbackId }
      );
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: "No insights found for this feedback",
      });
    });
  });

  describe("getInsightsByFormId", () => {
    it("should return insights for valid form ID", async () => {
      const formId = "507f1f77bcf86cd799439011";
      const mockFeedbacks = [{ _id: "feedback1" }, { _id: "feedback2" }];
      const mockInsights = [
        {
          _id: "1",
          feedbackId: "feedback1",
          feedbackDescription: "Test insight 1",
        },
        {
          _id: "2",
          feedbackId: "feedback2",
          feedbackDescription: "Test insight 2",
        },
      ];

      req.params.formId = formId;
      mongoose.Types.ObjectId.isValid.mockReturnValue(true);
      Feedback.find.mockResolvedValue(mockFeedbacks);
      Insight.find.mockResolvedValue(mockInsights);

      await getInsightsByFormId(req, res);

      expect(mongoose.Types.ObjectId.isValid).toHaveBeenCalledWith(formId);
      expect(Feedback.find).toHaveBeenCalledWith({ formId });
      expect(Insight.find).toHaveBeenCalledWith({
        feedbackId: { $in: ["feedback1", "feedback2"] },
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockInsights);
    });

    it("should return 400 for invalid form ID", async () => {
      const invalidId = "invalid-id";
      req.params.formId = invalidId;
      mongoose.Types.ObjectId.isValid.mockReturnValue(false);

      await getInsightsByFormId(req, res);

      expect(logger.warn).toHaveBeenCalledWith("Invalid form ID provided", {
        formId: invalidId,
      });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid form ID" });
    });

    it("should return 404 when no feedbacks found", async () => {
      const formId = "507f1f77bcf86cd799439011";
      req.params.formId = formId;
      mongoose.Types.ObjectId.isValid.mockReturnValue(true);
      Feedback.find.mockResolvedValue([]);

      await getInsightsByFormId(req, res);

      expect(logger.info).toHaveBeenCalledWith("No feedback found for form", {
        formId,
      });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: "No feedback found for this form",
      });
    });

    it("should return 404 when no insights found", async () => {
      const formId = "507f1f77bcf86cd799439011";
      req.params.formId = formId;
      mongoose.Types.ObjectId.isValid.mockReturnValue(true);
      Feedback.find.mockResolvedValue([{ _id: "feedback1" }]);
      Insight.find.mockResolvedValue([]);

      await getInsightsByFormId(req, res);

      expect(logger.info).toHaveBeenCalledWith("No insights found for form", {
        formId,
      });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: "No insights found for this form",
      });
    });
  });

  describe("deleteInsight", () => {
    it("should delete insight successfully", async () => {
      const insightId = "507f1f77bcf86cd799439011";
      const mockDeletedInsight = {
        _id: insightId,
        feedbackDescription: "Test insight",
      };

      req.params.id = insightId;
      mongoose.Types.ObjectId.isValid.mockReturnValue(true);
      Insight.findByIdAndDelete.mockResolvedValue(mockDeletedInsight);

      await deleteInsight(req, res);

      expect(mongoose.Types.ObjectId.isValid).toHaveBeenCalledWith(insightId);
      expect(Insight.findByIdAndDelete).toHaveBeenCalledWith(insightId);
      expect(logger.info).toHaveBeenCalledWith("Insight deleted successfully", {
        id: insightId,
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Insight deleted successfully",
      });
    });

    it("should return 400 for invalid ID", async () => {
      const invalidId = "invalid-id";
      req.params.id = invalidId;
      mongoose.Types.ObjectId.isValid.mockReturnValue(false);

      await deleteInsight(req, res);

      expect(logger.warn).toHaveBeenCalledWith(
        "Invalid insight ID provided for deletion",
        { id: invalidId }
      );
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid insight ID" });
    });

    it("should return 404 when insight not found", async () => {
      const insightId = "507f1f77bcf86cd799439011";
      req.params.id = insightId;
      mongoose.Types.ObjectId.isValid.mockReturnValue(true);
      Insight.findByIdAndDelete.mockResolvedValue(null);

      await deleteInsight(req, res);

      expect(logger.info).toHaveBeenCalledWith(
        "Attempted to delete non-existent insight",
        { id: insightId }
      );
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Insight not found" });
    });

    it("should handle database errors", async () => {
      const insightId = "507f1f77bcf86cd799439011";
      req.params.id = insightId;
      mongoose.Types.ObjectId.isValid.mockReturnValue(true);
      const error = new Error("Database error");
      Insight.findByIdAndDelete.mockRejectedValue(error);

      await deleteInsight(req, res);

      expect(logger.error).toHaveBeenCalledWith("Error deleting insight", {
        error: error.message,
        stack: error.stack,
        insightId,
      });
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: error.message });
    });
  });

  describe("clusterInsightsByForm", () => {
    it("should return clusters successfully", async () => {
      const formId = "507f1f77bcf86cd799439011";
      const mockFeedbacks = [
        { _id: "feedback1" },
        { _id: "feedback2" },
        { _id: "feedback3" },
      ];
      const mockInsights = [
        {
          _id: "insight1",
          feedbackId: "feedback1",
          feedbackDescription: "Bug in login",
          keywords: ["bug", "login"],
          embedding: [0.1, 0.2, 0.3],
          organization: "test-org",
        },
        {
          _id: "insight2",
          feedbackId: "feedback2",
          feedbackDescription: "UI is confusing",
          keywords: ["ui", "confusing"],
          embedding: [0.4, 0.5, 0.6],
          organization: "test-org",
        },
        {
          _id: "insight3",
          feedbackId: "feedback3",
          feedbackDescription: "App crashes",
          keywords: ["crash", "bug"],
          embedding: null,
          organization: "test-org",
        },
      ];

      const mockOrganization = {
        _id: "org1",
        name: "Test Org",
        aiRecommendationThreshold: 3,
      };

      req.params.formId = formId;
      mongoose.Types.ObjectId.isValid.mockReturnValue(true);
      Feedback.find.mockResolvedValue(mockFeedbacks);
      Insight.find.mockResolvedValue(mockInsights);
      Insight.findByIdAndUpdate.mockResolvedValue();
      Organization.findOne.mockResolvedValue(mockOrganization);

      generateEmbedding.mockResolvedValue([0.7, 0.8, 0.9]);
      determineOptimalClusters.mockReturnValue(2);
      clusterEmbeddings.mockReturnValue([0, 1, 0]);

      // Mock AI response
      const mockAIResponse = {
        recommendation: "Fix login bug",
        impact: "high",
        urgency: "immediate",
        cluster_summary: "Users experiencing login issues",
      };

      // Mock GoogleGenAI
      const mockGenerateContent = jest.fn().mockResolvedValue({
        text: JSON.stringify(mockAIResponse),
      });
      const mockModels = { generateContent: mockGenerateContent };
      GoogleGenAI.mockImplementation(() => ({ models: mockModels }));

      // Mock ClusterAnalysis operations
      ClusterAnalysis.findOne.mockResolvedValue(null);
      ClusterAnalysis.prototype.save = jest.fn().mockResolvedValue({
        _id: "analysis1",
        ...mockAIResponse,
      });

      await clusterInsightsByForm(req, res);

      expect(Feedback.find).toHaveBeenCalledWith({ formId });
      expect(Insight.find).toHaveBeenCalledWith({
        feedbackId: { $in: ["feedback1", "feedback2", "feedback3"] },
      });
      expect(generateEmbedding).toHaveBeenCalledWith("App crashes crash bug");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          formId,
          totalInsights: expect.any(Number),
          clusters: expect.any(Array),
        })
      );
    });

    it("should return 400 for invalid form ID", async () => {
      const invalidId = "invalid-id";
      req.params.formId = invalidId;
      mongoose.Types.ObjectId.isValid.mockReturnValue(false);

      await clusterInsightsByForm(req, res);

      expect(logger.warn).toHaveBeenCalledWith(
        "Invalid form ID provided for clustering",
        { formId: invalidId }
      );
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid form ID" });
    });

    it("should return message when not enough insights for clustering", async () => {
      const formId = "507f1f77bcf86cd799439011";
      const mockFeedbacks = [{ _id: "feedback1" }];
      const mockInsights = [{ _id: "insight1", feedbackId: "feedback1" }];

      req.params.formId = formId;
      mongoose.Types.ObjectId.isValid.mockReturnValue(true);
      Feedback.find.mockResolvedValue(mockFeedbacks);
      Insight.find.mockResolvedValue(mockInsights);

      await clusterInsightsByForm(req, res);

      expect(logger.info).toHaveBeenCalledWith(
        "Not enough insights for clustering",
        {
          formId,
          count: 1,
        }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Not enough insights for clustering (minimum 2 required)",
        clusters: [],
      });
    });

    it("should handle errors during clustering", async () => {
      const formId = "507f1f77bcf86cd799439011";
      req.params.formId = formId;
      mongoose.Types.ObjectId.isValid.mockReturnValue(true);
      const error = new Error("Clustering error");
      Feedback.find.mockRejectedValue(error);

      await clusterInsightsByForm(req, res);

      expect(logger.error).toHaveBeenCalledWith("Error clustering insights", {
        error: error.message,
        stack: error.stack,
        formId,
      });
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: error.message });
    });
  });

  describe("getClusterAnalysisByForm", () => {
    it("should return cluster analysis for valid form ID", async () => {
      const formId = "507f1f77bcf86cd799439011";
      const mockAnalyses = [
        {
          _id: "analysis1",
          formId,
          clusterLabel: "Bug Reports",
          recommendation: "Fix login bug",
          impact: "high",
          urgency: "immediate",
          createdAt: new Date(),
          toObject: jest.fn().mockReturnValue({
            _id: "analysis1",
            formId,
            clusterLabel: "Bug Reports",
          }),
        },
      ];

      req.params.formId = formId;
      mongoose.Types.ObjectId.isValid.mockReturnValue(true);

      const mockFind = {
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(mockAnalyses),
      };
      ClusterAnalysis.find.mockReturnValue(mockFind);

      await getClusterAnalysisByForm(req, res);

      expect(mongoose.Types.ObjectId.isValid).toHaveBeenCalledWith(formId);
      expect(ClusterAnalysis.find).toHaveBeenCalledWith({ formId });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          formId,
          totalAnalyses: 1,
          clusters: expect.any(Array),
        })
      );
    });

    it("should return 400 for invalid form ID", async () => {
      const invalidId = "invalid-id";
      req.params.formId = invalidId;
      mongoose.Types.ObjectId.isValid.mockReturnValue(false);

      await getClusterAnalysisByForm(req, res);

      expect(logger.warn).toHaveBeenCalledWith(
        "Invalid form ID provided for cluster analysis",
        { formId: invalidId }
      );
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid form ID" });
    });

    it("should return 404 when no analyses found", async () => {
      const formId = "507f1f77bcf86cd799439011";
      req.params.formId = formId;
      mongoose.Types.ObjectId.isValid.mockReturnValue(true);

      const mockFind = {
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue([]),
      };
      ClusterAnalysis.find.mockReturnValue(mockFind);

      await getClusterAnalysisByForm(req, res);

      expect(logger.info).toHaveBeenCalledWith(
        "No cluster analyses found for form",
        { formId }
      );
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message:
          "No cluster analyses found for this form. Run clustering first.",
      });
    });
  });

  describe("getClusterAnalysisByOrganization", () => {
    it("should return 400 when organization is not provided", async () => {
      await getClusterAnalysisByOrganization(req, res);

      expect(logger.warn).toHaveBeenCalledWith(
        "No organization ID provided for cluster analysis"
      );
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Organization ID is required",
      });
    });

    it("should return cluster analysis for valid organization", async () => {
      const organization = "test-org";
      const mockAnalyses = [
        {
          _id: "analysis1",
          organization,
          formId: "form1",
          clusterLabel: "Bug Reports",
          recommendation: "Fix login bug",
          impact: "high",
          urgency: "immediate",
          ticketCreated: true,
          createdAt: new Date(),
          toObject: jest.fn().mockReturnValue({
            _id: "analysis1",
            organization,
            formId: "form1",
          }),
        },
        {
          _id: "analysis2",
          organization,
          formId: "form2",
          clusterLabel: "UI Issues",
          recommendation: "Improve UI",
          impact: "medium",
          urgency: "soon",
          ticketCreated: false,
          createdAt: new Date(),
          toObject: jest.fn().mockReturnValue({
            _id: "analysis2",
            organization,
            formId: "form2",
          }),
        },
      ];

      req.params.organization = organization;

      const mockFind = {
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(mockAnalyses),
      };
      ClusterAnalysis.find.mockReturnValue(mockFind);

      await getClusterAnalysisByOrganization(req, res);

      expect(ClusterAnalysis.find).toHaveBeenCalledWith({ organization });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          organization,
          summary: expect.objectContaining({
            totalClusters: 2,
            formsWithClusters: 2,
            clustersWithTickets: 1,
            highImpactClusters: 1,
            urgentClusters: 1,
          }),
          analysesByForm: expect.any(Object),
          allAnalyses: expect.any(Array),
        })
      );
    });

    it("should return 404 when no analyses found", async () => {
      const organization = "test-org";
      req.params.organization = organization;

      const mockFind = {
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue([]),
      };
      ClusterAnalysis.find.mockReturnValue(mockFind);

      await getClusterAnalysisByOrganization(req, res);

      expect(logger.info).toHaveBeenCalledWith(
        "No cluster analyses found for organization",
        { organization }
      );
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message:
          "No cluster analyses found for this organization. Run clustering first.",
      });
    });

    it.skip("should handle database errors", async () => {
      const organization = "test-org";
      req.params.organization = organization;
      const error = new Error("Database error");
      ClusterAnalysis.find.mockRejectedValue(error);

      await getClusterAnalysisByOrganization(req, res);

      expect(logger.error).toHaveBeenCalledWith(
        "Error retrieving cluster analysis by organization",
        {
          error: error.message,
          stack: error.stack,
          organization,
        }
      );
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: error.message });
    });
  });
});
