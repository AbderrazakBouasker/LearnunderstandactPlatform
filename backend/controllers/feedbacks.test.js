import { createFeedback, getFeedbacks, getFeedback, getFeedbackByFormId, deleteFeedback } from "./feedbacks.js";
import Feedback from "../models/Feedback.js";
import Form from "../models/Form.js";

jest.mock("../models/Feedback.js", () => {
  // Create a mock save function that can be properly mocked further
  const mockSave = jest.fn().mockResolvedValue({ _id: "feedbackId" });
  
  const mockFeedback = jest.fn().mockImplementation((data) => {
    return {
      ...data,
      _id: "feedbackId",
      save: mockSave
    };
  });
  
  // Expose mockSave on the prototype for test access
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

jest.mock("../logger.js", () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn()
}));

import logger from '../logger.js';

describe("Feedback Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe("createFeedback", () => {
    let req, res;
    
    beforeEach(() => {
      req = {
        params: {
          id: "formId"
        },
        body: {
          opinion: "happy",
          fields: [{ label: "Name", value: "Test User" }]
        }
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
    });
    
    it("should create a new feedback without logging errors", async () => {
      const form = {
        _id: "formId",
        title: "Test Form",
        description: "Test Description",
        fields: [{ label: "Name", type: "text" }]
      };
      
      Form.findById.mockResolvedValue(form);

      await createFeedback(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        formId: "formId",
        opinion: "happy"
      }));
      expect(logger.error).not.toHaveBeenCalled();
    });

    it("should log errors when feedback creation fails", async () => {
      const form = {
        _id: "formId",
        title: "Test Form",
        description: "Test Description",
        fields: [{ label: "Name", type: "text" }]
      };
      
      Form.findById.mockResolvedValue(form);
      
      const error = new Error("Database error");
      Feedback.prototype.save.mockRejectedValueOnce(error);
      
      await createFeedback(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(logger.error).toHaveBeenCalledWith('Error creating feedback', {
        error: error.message,
        stack: expect.any(String),
        requestBody: req.body
      });
    });

    it("should return 404 if form not found", async () => {
      const req = {
        params: {
          id: "nonExistingFormId"
        },
        body: {
          opinion: "happy",
          fields: [{ label: "Name", value: "Test User" }]
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      Form.findById.mockResolvedValue(null);

      await createFeedback(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Form not found" });
    });

    it("should return 400 if field is missing", async () => {
      const req = {
        params: {
          id: "formId"
        },
        body: {
          opinion: "happy",
          fields: [{ label: "WrongName", value: "Test User" }]
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      const form = {
        _id: "formId",
        title: "Test Form",
        description: "Test Description",
        fields: [{ label: "Name", type: "text" }]
      };
      
      Form.findById.mockResolvedValue(form);

      await createFeedback(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: expect.stringContaining("Missing field") });
    });
  });

  describe("getFeedbacks", () => {
    let req, res;
    
    beforeEach(() => {
      req = {};
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
    });
    
    it("should get all feedbacks", async () => {
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      const feedbacks = [
        { _id: "feedbackId1", opinion: "happy" },
        { _id: "feedbackId2", opinion: "neutral" }
      ];
      
      Feedback.find.mockResolvedValue(feedbacks);

      await getFeedbacks(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(feedbacks);
    });

    it("should return 204 if no feedbacks found", async () => {
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      Feedback.find.mockResolvedValue([]);

      await getFeedbacks(req, res);

      expect(res.status).toHaveBeenCalledWith(204);
    });

    it("should log errors when retrieving feedbacks fails", async () => {
      const error = new Error("Database error");
      Feedback.find.mockRejectedValue(error);
      
      await getFeedbacks(req, res);
      
      expect(res.status).toHaveBeenCalledWith(404);
      expect(logger.error).toHaveBeenCalledWith('Error retrieving feedbacks', {
        error: error.message,
        stack: expect.any(String)
      });
    });
  });

  describe("getFeedback", () => {
    let req, res;
    
    beforeEach(() => {
      req = {
        params: {
          id: "feedbackId"
        }
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
    });
    
    it("should get feedback by id", async () => {
      const req = {
        params: {
          id: "feedbackId"
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      const feedback = { _id: "feedbackId", opinion: "happy" };
      
      Feedback.findById.mockResolvedValue(feedback);

      await getFeedback(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(feedback);
    });

    it("should return 404 if feedback not found", async () => {
      const req = {
        params: {
          id: "nonExistingFeedbackId"
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
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
      expect(logger.error).toHaveBeenCalledWith('Error retrieving feedback by ID', {
        error: error.message,
        stack: expect.any(String)
      });
    });
  });

  describe("getFeedbackByFormId", () => {
    it("should get feedback by form id", async () => {
      const req = {
        params: {
          id: "formId"
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      const feedbacks = [
        { _id: "feedbackId1", formId: "formId", opinion: "happy" },
        { _id: "feedbackId2", formId: "formId", opinion: "neutral" }
      ];
      
      Feedback.find.mockResolvedValue(feedbacks);

      await getFeedbackByFormId(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(feedbacks);
    });

    it("should return 204 if no feedbacks found for form", async () => {
      const req = {
        params: {
          id: "formId"
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      Feedback.find.mockResolvedValue([]);

      await getFeedbackByFormId(req, res);

      expect(res.status).toHaveBeenCalledWith(204);
    });
  });

  describe("deleteFeedback", () => {
    it("should delete feedback by id", async () => {
      const req = {
        params: {
          id: "feedbackId"
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
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
          id: "nonExistingFeedbackId"
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      Feedback.findByIdAndDelete.mockResolvedValue(null);

      await deleteFeedback(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Feedback not found" });
    });
  });
});
