import { createForm, getForms, getForm, editForm, deleteForm } from "./forms.js";
import Form from "../models/Form.js";

jest.mock("../models/Form.js", () => {
  // Create a mock save function that can be properly mocked further
  const mockSave = jest.fn().mockResolvedValue({ _id: "formId" });
  
  const mockForm = jest.fn().mockImplementation((data) => {
    return {
      ...data,
      _id: "formId",
      save: mockSave
    };
  });
  
  // Expose mockSave on the prototype for test access
  mockForm.prototype.save = mockSave;
  
  // Add static methods
  mockForm.find = jest.fn();
  mockForm.findById = jest.fn();
  mockForm.findByIdAndDelete = jest.fn();
  
  return mockForm;
});

jest.mock("../logger.js", () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn()
}));

import logger from '../logger.js';

describe("Forms Controller", () => {
  let req, res;
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe("createForm", () => {
    beforeEach(() => {
      req = {
        body: {
          title: "Test Form",
          description: "Test Description",
          opinion: ["happy"],
          fields: [],
        },
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
    });

    it("should create a new form and not log errors", async () => {
      await createForm(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining(req.body));
      expect(logger.error).not.toHaveBeenCalled();
    });
    
    it("should log errors when form creation fails", async () => {
      const error = new Error("Validation error");
      Form.prototype.save.mockRejectedValueOnce(error);
      
      await createForm(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: error.message });
      expect(logger.error).toHaveBeenCalledWith('Error creating form', {
        error: error.message,
        stack: expect.any(String),
        requestBody: req.body
      });
    });
  });

  describe("getForms", () => {
    beforeEach(() => {
      req = {};
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
    });
    
    it("should get all forms and not log errors", async () => {
      const forms = [{ title: "Test Form" }];
      Form.find.mockResolvedValue(forms);

      await getForms(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(forms);
      expect(logger.error).not.toHaveBeenCalled();
    });
    
    it("should return 204 when no forms exist", async () => {
      Form.find.mockResolvedValue([]);
      
      await getForms(req, res);
      
      expect(res.status).toHaveBeenCalledWith(204);
      expect(logger.error).not.toHaveBeenCalled();
    });
    
    it("should log errors when retrieving forms fails", async () => {
      const error = new Error("Database error");
      Form.find.mockRejectedValue(error);
      
      await getForms(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(logger.error).toHaveBeenCalledWith('Error retrieving forms', {
        error: error.message,
        stack: expect.any(String)
      });
    });
  });

  describe("getForm", () => {
    it("should get a form by id", async () => {
      const req = {
        params: {
          id: "formId",
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const form = { title: "Test Form" };
      Form.findById.mockResolvedValue(form);

      await getForm(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(form);
    });
  });

  describe("editForm", () => {
    it("should edit a form by id", async () => {
      const req = {
        params: {
          id: "formId",
        },
        body: {
          title: "Updated Form",
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      
      // Create a form object that properly simulates the behavior in the controller
      const form = { 
        title: "Test Form",
        fields: undefined,
        save: jest.fn().mockImplementation(function() {
          this.title = req.body.title;
          return Promise.resolve(this);
        })
      };
      Form.findById.mockResolvedValue(form);

      await editForm(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      // Use expect.objectContaining to check that the response contains the updated title
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        title: "Updated Form"
      }));
    });
  });

  describe("deleteForm", () => {
    beforeEach(() => {
      req = {
        params: { id: "formId" }
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
    });
    
    it("should delete a form by id", async () => {
      const form = { title: "Test Form" };
      Form.findByIdAndDelete.mockResolvedValue(form);

      await deleteForm(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ deletedForm: form });
    });
    
    it("should log error when form deletion fails", async () => {
      const error = new Error("Database error");
      Form.findByIdAndDelete.mockRejectedValue(error);
      
      await deleteForm(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(logger.error).toHaveBeenCalledWith('Error deleting form', {
        error: error.message,
        stack: expect.any(String)
      });
    });
  });
});
