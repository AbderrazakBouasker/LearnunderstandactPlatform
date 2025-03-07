import { createFeedback, getFeedbacks, getFeedback, getFeedbackByFormId, deleteFeedback } from "./feedbacks.js";
import Feedback from "../models/Feedback.js";
import Form from "../models/Form.js";

jest.mock("../models/Feedback.js", () => {
  const mockFeedback = jest.fn().mockImplementation((data) => {
    return {
      ...data,
      _id: "feedbackId",
      save: jest.fn().mockResolvedValue({ ...data, _id: "feedbackId" })
    };
  });
  
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

describe("Feedback Controller", () => {
  describe("createFeedback", () => {
    it("should create a new feedback", async () => {
      const req = {
        params: {
          id: "formId"
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
  });

  describe("getFeedback", () => {
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
