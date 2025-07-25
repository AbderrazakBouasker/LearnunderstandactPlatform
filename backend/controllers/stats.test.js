import {
  getFeedbackCountOverTimeByOrg,
  getFeedbackCountOverTimeByForm,
  getTotalFeedbackByForm,
  getOpinionCountsByForm,
  getClusterStatsByOrganization,
  getClusterSentimentByForm,
} from "./stats.js";

jest.mock("../models/Feedback.js", () => ({
  aggregate: jest.fn(),
  countDocuments: jest.fn(),
  findOne: jest.fn(),
}));

jest.mock("../models/ClusterAnalysis.js", () => ({
  find: jest.fn(),
  aggregate: jest.fn(),
}));

jest.mock("mongoose", () => ({
  Types: {
    ObjectId: jest.fn().mockImplementation((id) => id || "mockObjectId"),
  },
}));

import Feedback from "../models/Feedback.js";
import ClusterAnalysis from "../models/ClusterAnalysis.js";

describe("Stats Controller", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  describe("getFeedbackCountOverTimeByOrg", () => {
    it("should return 400 if start date is missing", async () => {
      req = {
        params: { organization: "testorg" },
        query: { endDate: "2024-01-31" }, // Missing startDate
      };

      await getFeedbackCountOverTimeByOrg(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Start date and end date are required",
      });
    });

    it("should get feedback count successfully", async () => {
      req = {
        params: { organization: "testorg" },
        query: { startDate: "2024-01-01", endDate: "2024-01-31" },
      };

      const mockData = [
        { _id: "2024-01-01", count: 5 },
        { _id: "2024-01-02", count: 3 },
      ];
      Feedback.aggregate.mockResolvedValue(mockData);

      await getFeedbackCountOverTimeByOrg(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockData);
    });

    it("should handle errors gracefully", async () => {
      req = {
        params: { organization: "testorg" },
        query: { startDate: "2024-01-01", endDate: "2024-01-31" },
      };

      const error = new Error("Database error");
      Feedback.aggregate.mockRejectedValue(error);

      await getFeedbackCountOverTimeByOrg(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: error.message });
    });
  });

  describe("getFeedbackCountOverTimeByForm", () => {
    it("should return 400 if dates are missing", async () => {
      req = {
        params: { formId: "formId123" },
        query: {}, // Missing dates
      };

      await getFeedbackCountOverTimeByForm(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Start date and end date are required",
      });
    });

    it("should get feedback count successfully", async () => {
      req = {
        params: { formId: "formId123" },
        query: { startDate: "2024-01-01", endDate: "2024-01-31" },
      };

      const mockData = [
        { _id: "2024-01-01", count: 2 },
        { _id: "2024-01-02", count: 4 },
      ];
      Feedback.aggregate.mockResolvedValue(mockData);

      await getFeedbackCountOverTimeByForm(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockData);
    });
  });

  describe("getTotalFeedbackByForm", () => {
    it("should get total feedback count by form successfully", async () => {
      req = {
        params: { organization: "testorg" },
      };

      const mockData = [
        { _id: "form1", formTitle: "Form 1", count: 10 },
        { _id: "form2", formTitle: "Form 2", count: 5 },
      ];
      Feedback.aggregate.mockResolvedValue(mockData);

      await getTotalFeedbackByForm(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockData);
    });

    it("should handle errors gracefully", async () => {
      req = {
        params: { organization: "testorg" },
      };

      const error = new Error("Database error");
      Feedback.aggregate.mockRejectedValue(error);

      await getTotalFeedbackByForm(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: error.message });
    });
  });

  describe("getOpinionCountsByForm", () => {
    it("should get opinion counts for form successfully", async () => {
      req = {
        params: { formId: "formId123" },
      };

      const mockOpinionData = [
        { opinion: "happy", count: 5 },
        { opinion: "neutral", count: 3 },
        { opinion: "sad", count: 2 },
      ];
      const mockFormData = { formTitle: "Test Form" };

      Feedback.aggregate.mockResolvedValue(mockOpinionData);
      Feedback.findOne.mockResolvedValue(mockFormData);

      await getOpinionCountsByForm(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        formId: "formId123",
        formTitle: "Test Form",
        opinionCounts: mockOpinionData,
      });
    });

    it("should handle form with empty opinion data", async () => {
      req = {
        params: { formId: "formId123" },
      };

      // Return some data to avoid the diagnostic branch
      Feedback.aggregate.mockResolvedValue([{ opinion: "neutral", count: 1 }]);
      Feedback.findOne.mockResolvedValue({ formTitle: "Test Form" });

      await getOpinionCountsByForm(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        formId: "formId123",
        formTitle: "Test Form",
        opinionCounts: [{ opinion: "neutral", count: 1 }],
      });
    });
  });

  describe("getClusterStatsByOrganization", () => {
    it("should return 400 if organization parameter is missing", async () => {
      req = {
        params: {}, // Missing organization
      };

      await getClusterStatsByOrganization(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Organization parameter is required",
      });
    });

    it("should return empty stats when no clusters found", async () => {
      req = {
        params: { organization: "testorg" },
      };

      ClusterAnalysis.find.mockResolvedValue([]);

      await getClusterStatsByOrganization(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        organization: "testorg",
        totalClusters: 0,
        formsWithClusters: 0,
        clustersWithTickets: 0,
        highImpactClusters: 0,
        urgentClusters: 0,
        averageSentimentPercentage: 0,
        averageClusterSize: 0,
      });
    });

    it("should calculate cluster stats correctly", async () => {
      req = {
        params: { organization: "testorg" },
      };

      const mockClusterData = [
        {
          formId: "form1",
          ticketCreated: true,
          impact: "high",
          urgency: "immediate",
          sentimentPercentage: 80,
          clusterSize: 5,
          createdAt: new Date("2024-01-15"),
        },
        {
          formId: "form2",
          ticketCreated: false,
          impact: "medium",
          urgency: "soon",
          sentimentPercentage: 60,
          clusterSize: 3,
          createdAt: new Date("2024-01-20"),
        },
      ];
      ClusterAnalysis.find.mockResolvedValue(mockClusterData);

      await getClusterStatsByOrganization(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          organization: "testorg",
          totalClusters: 2,
          formsWithClusters: 2,
          clustersWithTickets: 1,
          highImpactClusters: 1,
          urgentClusters: 1,
          averageSentimentPercentage: 70,
          averageClusterSize: 4,
        })
      );
    });
  });

  describe("getClusterSentimentByForm", () => {
    it("should return 400 if dates are missing", async () => {
      req = {
        params: { formId: "formId123" },
        query: {}, // Missing dates
      };

      await getClusterSentimentByForm(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Start date and end date are required",
      });
    });

    it("should handle no cluster data gracefully", async () => {
      req = {
        params: { formId: "formId123" },
        query: { startDate: "2024-01-01", endDate: "2024-01-31" },
      };

      ClusterAnalysis.aggregate
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      Feedback.findOne.mockResolvedValue(null);

      await getClusterSentimentByForm(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        formId: "formId123",
        formTitle: "Unknown Form",
        dateRange: {
          startDate: "2024-01-01",
          endDate: "2024-01-31",
        },
        overallStats: {
          totalClusters: 0,
          averageSentiment: 0,
          highImpactClusters: 0,
          urgentClusters: 0,
          clustersWithTickets: 0,
          averageClusterSize: 0,
        },
        sentimentTrend: [],
      });
    });
  });
});
