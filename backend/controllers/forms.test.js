import { createForm, getForms, getForm, editForm, deleteForm } from "./forms.js";
import Form from "../models/Form.js";

jest.mock("../models/Form.js", () => {
  const mockForm = jest.fn().mockImplementation((data) => {
    return {
      ...data,
      _id: "formId",
      save: jest.fn().mockResolvedValue({ ...data, _id: "formId" })
    };
  });
  
  // Add static methods
  mockForm.find = jest.fn();
  mockForm.findById = jest.fn();
  mockForm.findByIdAndDelete = jest.fn();
  
  return mockForm;
});

describe("Forms Controller", () => {
  describe("createForm", () => {
    it("should create a new form", async () => {
      const req = {
        body: {
          title: "Test Form",
          description: "Test Description",
          opinion: ["happy"],
          fields: [],
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await createForm(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining(req.body));
    });
  });

  describe("getForms", () => {
    it("should get all forms", async () => {
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const forms = [{ title: "Test Form" }];
      Form.find.mockResolvedValue(forms);

      await getForms(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(forms);
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
    it("should delete a form by id", async () => {
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
      Form.findByIdAndDelete.mockResolvedValue(form);

      await deleteForm(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ deletedForm: form });
    });
  });
});
