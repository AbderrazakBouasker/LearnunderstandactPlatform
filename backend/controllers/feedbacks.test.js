import {
  createFeedback,
  getFeedbacks,
  getFeedback,
  getFeedbackByFormId,
  getFeedbacksByOrganization,
  deleteFeedback,
} from "./feedbacks.js";
import Feedback from "../models/Feedback.js";
import Form from "../models/Form.js";
import Insight from "../models/Insight.js";

jest.mock("../models/Feedback.js", () => {
  const mockSave = jest.fn().mockResolvedValue({ _id: "feedbackId" });

  const mockFeedback = jest.fn().mockImplementation((data) => {
    return {
      ...data,
      _id: "feedbackId",
      save: mockSave,
    };
  });

  mockFeedback.prototype.save = mockSave;
  mockFeedback.find = jest.fn();
  mockFeedback.findById = jest.fn();
  mockFeedback.findByIdAndDelete = jest.fn();

  return mockFeedback;
});

jest.mock("../models/Form.js", () => {
  const mockForm = jest.fn();
  mockForm.findById = jest.fn();
  return mockForm;
});

jest.mock("../models/Insight.js", () => {
  const mockInsight = jest.fn().mockImplementation((data) => {
    return {
      ...data,
      _id: "insightId",
      save: jest.fn().mockResolvedValue({ _id: "insightId" }),
    };
  });

  mockInsight.prototype.save = jest
    .fn()
    .mockResolvedValue({ _id: "insightId" });
  mockInsight.countDocuments = jest.fn();

  return mockInsight;
});

jest.mock("@google/genai", () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: {
      generateContent: jest.fn().mockResolvedValue({
        text: JSON.stringify({
          sentiment: "satisfied",
          feedbackDescription: "Positive feedback about the service",
          keywords: ["service", "positive"],
        }),
      }),
    },
  })),
}));

jest.mock("../services/clusteringService.js", () => ({
  generateEmbedding: jest.fn().mockResolvedValue([0.1, 0.2, 0.3]),
}));

jest.mock("../logger.js", () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
}));

import logger from "../logger.js";

describe("Feedback Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createFeedback", () => {
    let req, res;

    beforeEach(() => {
      req = {
        params: {
          id: "formId",
        },
        body: {
          opinion: "happy",
          fields: [{ label: "Name", value: "Test User" }],
        },
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
    });

    it("should create a new feedback without logging errors", async () => {
      const form = {
        _id: "formId",
        title: "Test Form",
        description: "Test Description",
        organization: "testorg",
        fields: [{ label: "Name", type: "text" }],
      };

      Form.findById.mockResolvedValue(form);

      // Mock Feedback.find for clustering functionality - return empty array initially, then some feedbacks
      Feedback.find
        .mockResolvedValueOnce([]) // First call in clustering function
        .mockResolvedValue([]); // Any other calls

      // Mock Insight.countDocuments for clustering
      Insight.countDocuments.mockResolvedValue(0);

      await createFeedback(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: "Feedback and Insight created successfully",
      });
      expect(logger.error).not.toHaveBeenCalled();
    });

    it("should log errors when feedback creation fails", async () => {
      const form = {
        _id: "formId",
        title: "Test Form",
        description: "Test Description",
        organization: "testorg",
        fields: [{ label: "Name", type: "text" }],
      };

      Form.findById.mockResolvedValue(form);

      const error = new Error("Database error");
      Feedback.prototype.save.mockRejectedValueOnce(error);

      await createFeedback(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(logger.error).toHaveBeenCalledWith("Error creating feedback", {
        error: error.message,
        stack: expect.any(String),
        requestBody: req.body,
      });
    });

    it("should return 404 if form not found", async () => {
      Form.findById.mockResolvedValue(null);

      await createFeedback(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Form not found" });
    });

    it("should return 400 if field is missing", async () => {
      const form = {
        _id: "formId",
        title: "Test Form",
        description: "Test Description",
        organization: "testorg",
        fields: [{ label: "Name", type: "text" }],
      };

      const req = {
        params: { id: "formId" },
        body: {
          opinion: "happy",
          fields: [{ label: "WrongName", value: "Test User" }],
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      Form.findById.mockResolvedValue(form);

      await createFeedback(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: expect.stringContaining("Missing field"),
      });
    });

    it("should return 400 if field type is invalid", async () => {
      const form = {
        _id: "formId",
        title: "Test Form",
        description: "Test Description",
        organization: "testorg",
        fields: [{ label: "Age", type: "number" }],
      };

      const req = {
        params: { id: "formId" },
        body: {
          opinion: "happy",
          fields: [{ label: "Age", value: "not a number" }],
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      Form.findById.mockResolvedValue(form);

      await createFeedback(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: expect.stringContaining("Invalid type for field"),
      });
    });
  });

  describe("getFeedbacks", () => {
    let req, res;

    beforeEach(() => {
      req = {};
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
    });

    it("should get all feedbacks", async () => {
      const feedbacks = [
        { _id: "feedbackId1", opinion: "happy" },
        { _id: "feedbackId2", opinion: "neutral" },
      ];

      Feedback.find.mockResolvedValue(feedbacks);

      await getFeedbacks(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(feedbacks);
    });

    it("should return 204 if no feedbacks found", async () => {
      Feedback.find.mockResolvedValue([]);

      await getFeedbacks(req, res);

      expect(res.status).toHaveBeenCalledWith(204);
    });

    it("should log errors when retrieving feedbacks fails", async () => {
      const error = new Error("Database error");
      Feedback.find.mockRejectedValue(error);

      await getFeedbacks(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Database error" });
      expect(logger.error).toHaveBeenCalledWith("Error retrieving feedbacks", {
        error: error.message,
        stack: expect.any(String),
      });
    });
  });

  describe("getFeedback", () => {
    let req, res;

    beforeEach(() => {
      req = {
        params: {
          id: "feedbackId",
        },
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
    });

    it("should get feedback by id", async () => {
      const feedback = { _id: "feedbackId", opinion: "happy" };

      Feedback.findById.mockResolvedValue(feedback);

      await getFeedback(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(feedback);
    });

    it("should return 404 if feedback not found", async () => {
      Feedback.findById.mockResolvedValue(null);

      await getFeedback(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Feedback not found" });
    });

    it("should log errors when retrieving a feedback fails", async () => {
      const error = new Error("Database error");
      Feedback.findById.mockRejectedValue(error);

      await getFeedback(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(logger.error).toHaveBeenCalledWith(
        "Error retrieving feedback by ID",
        {
          error: error.message,
          stack: expect.any(String),
        }
      );
    });
  });

  describe("getFeedbackByFormId", () => {
    it("should get feedback by form id", async () => {
      const req = {
        params: {
          id: "formId",
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const feedbacks = [
        { _id: "feedbackId1", formId: "formId", opinion: "happy" },
        { _id: "feedbackId2", formId: "formId", opinion: "neutral" },
      ];

      Feedback.find.mockResolvedValue(feedbacks);

      await getFeedbackByFormId(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(feedbacks);
    });

    it("should return 204 if no feedbacks found for form", async () => {
      const req = {
        params: {
          id: "formId",
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      Feedback.find.mockResolvedValue([]);

      await getFeedbackByFormId(req, res);

      expect(res.status).toHaveBeenCalledWith(204);
    });

    it("should log errors when retrieving feedbacks by form ID fails", async () => {
      const error = new Error("Database error");
      Feedback.find.mockRejectedValue(error);

      const req = { params: { id: "formId" } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await getFeedbackByFormId(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Database error" });
      expect(logger.error).toHaveBeenCalledWith(
        "Error retrieving feedback by form ID",
        {
          error: error.message,
          stack: expect.any(String),
        }
      );
    });
  });

  describe("getFeedbacksByOrganization", () => {
    it("should get feedbacks by organization", async () => {
      const req = {
        params: {
          organization: "testorg",
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const feedbacks = [
        { _id: "feedbackId1", organization: "testorg", opinion: "happy" },
        { _id: "feedbackId2", organization: "testorg", opinion: "neutral" },
      ];

      Feedback.find.mockResolvedValue(feedbacks);

      await getFeedbacksByOrganization(req, res);

      expect(Feedback.find).toHaveBeenCalledWith({ organization: "testorg" });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(feedbacks);
    });

    it("should return 204 if no feedbacks found for organization", async () => {
      const req = {
        params: {
          organization: "testorg",
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      Feedback.find.mockResolvedValue([]);

      await getFeedbacksByOrganization(req, res);

      expect(res.status).toHaveBeenCalledWith(204);
    });

    it("should log errors when retrieving feedbacks by organization fails", async () => {
      const error = new Error("Database error");
      Feedback.find.mockRejectedValue(error);

      const req = { params: { organization: "testorg" } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await getFeedbacksByOrganization(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Database error" });
      expect(logger.error).toHaveBeenCalledWith(
        "Error retrieving feedbacks by organization",
        {
          error: error.message,
          stack: expect.any(String),
        }
      );
    });
  });

  describe("deleteFeedback", () => {
    it("should delete feedback by id", async () => {
      const req = {
        params: {
          id: "feedbackId",
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const feedback = { _id: "feedbackId", opinion: "happy" };

      Feedback.findByIdAndDelete.mockResolvedValue(feedback);

      await deleteFeedback(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ feedback });
    });

    it("should return 404 if feedback not found", async () => {
      const req = {
        params: {
          id: "nonExistingFeedbackId",
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      Feedback.findByIdAndDelete.mockResolvedValue(null);

      await deleteFeedback(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Feedback not found" });
    });

    it("should log errors when deleting feedback fails", async () => {
      const error = new Error("Database error");
      Feedback.findByIdAndDelete.mockRejectedValue(error);

      const req = { params: { id: "feedbackId" } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await deleteFeedback(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Database error" });
      expect(logger.error).toHaveBeenCalledWith("Error deleting feedback", {
        error: error.message,
        stack: expect.any(String),
      });
    });
  });
});
