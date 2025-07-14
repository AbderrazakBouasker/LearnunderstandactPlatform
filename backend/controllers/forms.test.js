import {
  createForm,
  getForms,
  getForm,
  getFormsByOrganization,
  editForm,
  deleteForm,
} from "./forms.js";
import Form from "../models/Form.js";
import Organization from "../models/Organization.js";

jest.mock("../models/Form.js", () => {
  // Create a mock save function that can be properly mocked further
  const mockSave = jest.fn().mockResolvedValue({ _id: "formId" });

  const mockForm = jest.fn().mockImplementation((data) => {
    return {
      ...data,
      _id: "formId",
      save: mockSave,
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

jest.mock("../models/Organization.js", () => {
  const mockOrganization = jest.fn();
  mockOrganization.findOne = jest.fn();
  return mockOrganization;
});

jest.mock("../logger.js", () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
}));

import logger from "../logger.js";

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
          organization: "testorg",
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
      expect(logger.error).toHaveBeenCalledWith("Error creating form", {
        error: error.message,
        stack: expect.any(String),
        requestBody: req.body,
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
      expect(logger.error).toHaveBeenCalledWith("Error retrieving forms", {
        error: error.message,
        stack: expect.any(String),
      });
    });
  });

  describe("getForm", () => {
    it("should get a form by id with organization domains", async () => {
      const req = {
        params: {
          id: "formId",
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const form = {
        title: "Test Form",
        organization: "testorg",
        toObject: jest.fn().mockReturnValue({
          title: "Test Form",
          organization: "testorg",
        }),
      };
      const organization = {
        identifier: "testorg",
        domains: ["example.com", "test.com"],
      };

      Form.findById.mockResolvedValue(form);
      Organization.findOne.mockResolvedValue(organization);

      await getForm(req, res);

      expect(Form.findById).toHaveBeenCalledWith("formId");
      expect(Organization.findOne).toHaveBeenCalledWith({
        identifier: "testorg",
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        title: "Test Form",
        organization: "testorg",
        organizationDomains: ["example.com", "test.com"],
      });
    });

    it("should return 404 if form not found", async () => {
      const req = {
        params: {
          id: "nonExistentFormId",
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      Form.findById.mockResolvedValue(null);

      await getForm(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Form not found" });
    });

    it("should handle form with no organization", async () => {
      const req = {
        params: {
          id: "formId",
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const form = {
        title: "Test Form",
        organization: "testorg",
        toObject: jest.fn().mockReturnValue({
          title: "Test Form",
          organization: "testorg",
        }),
      };

      Form.findById.mockResolvedValue(form);
      Organization.findOne.mockResolvedValue(null); // No organization found

      await getForm(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        title: "Test Form",
        organization: "testorg",
        organizationDomains: [],
      });
    });

    it("should log errors when retrieving form by ID fails", async () => {
      const req = {
        params: {
          id: "formId",
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const error = new Error("Database error");
      Form.findById.mockRejectedValue(error);

      await getForm(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Database error" });
      expect(logger.error).toHaveBeenCalledWith("Error retrieving form by ID", {
        error: error.message,
        stack: expect.any(String),
      });
    });
  });

  describe("getFormsByOrganization", () => {
    it("should get forms by organization", async () => {
      const req = {
        params: {
          organization: "testorg",
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const forms = [
        { title: "Form 1", organization: "testorg" },
        { title: "Form 2", organization: "testorg" },
      ];

      Form.find.mockResolvedValue(forms);

      await getFormsByOrganization(req, res);

      expect(Form.find).toHaveBeenCalledWith({ organization: "testorg" });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(forms);
    });

    it("should return 204 if no forms found for organization", async () => {
      const req = {
        params: {
          organization: "testorg",
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      Form.find.mockResolvedValue([]);

      await getFormsByOrganization(req, res);

      expect(res.status).toHaveBeenCalledWith(204);
    });

    it("should log errors when retrieving forms by organization fails", async () => {
      const req = {
        params: {
          organization: "testorg",
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const error = new Error("Database error");
      Form.find.mockRejectedValue(error);

      await getFormsByOrganization(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Database error" });
      expect(logger.error).toHaveBeenCalledWith(
        "Error retrieving forms by organization",
        {
          error: error.message,
          stack: expect.any(String),
        }
      );
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
        save: jest.fn().mockImplementation(function () {
          this.title = req.body.title;
          return Promise.resolve(this);
        }),
      };
      Form.findById.mockResolvedValue(form);

      await editForm(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      // Use expect.objectContaining to check that the response contains the updated title
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Updated Form",
        })
      );
    });

    it("should return 404 if form not found", async () => {
      const req = {
        params: {
          id: "nonExistentFormId",
        },
        body: {
          title: "Updated Form",
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      Form.findById.mockResolvedValue(null);

      await editForm(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Form not found" });
    });

    it("should log errors when form update fails", async () => {
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

      const error = new Error("Database error");
      Form.findById.mockRejectedValue(error);

      await editForm(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Database error" });
      expect(logger.error).toHaveBeenCalledWith("Error updating form", {
        error: error.message,
        stack: expect.any(String),
        requestBody: req.body,
      });
    });
  });

  describe("deleteForm", () => {
    beforeEach(() => {
      req = {
        params: { id: "formId" },
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

    it("should return 404 if form not found", async () => {
      Form.findByIdAndDelete.mockResolvedValue(null);

      await deleteForm(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Form not found" });
    });

    it("should log error when form deletion fails", async () => {
      const error = new Error("Database error");
      Form.findByIdAndDelete.mockRejectedValue(error);

      await deleteForm(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Database error" });
      expect(logger.error).toHaveBeenCalledWith("Error deleting form", {
        error: error.message,
        stack: expect.any(String),
      });
    });
  });
});
