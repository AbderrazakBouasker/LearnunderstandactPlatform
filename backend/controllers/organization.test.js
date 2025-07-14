import {
  createOrganization,
  getOrganizations,
  getOrganizationById,
  getOrganizationByIdentifier,
  updateOrganization,
  deleteOrganization,
  addMemberToOrganizationByUsername,
  addMemberToOrganizationByEmail,
  deleteMemberFromOrganization,
  promoteDemoteMember,
  sendTestEmail,
} from "./organization.js";

jest.mock("../models/Organization.js", () => {
  const mockSave = jest.fn().mockResolvedValue({ _id: "orgId" });

  const mockOrganization = jest.fn().mockImplementation((data) => {
    return {
      ...data,
      _id: "orgId",
      save: mockSave,
      toObject: jest.fn().mockReturnValue(data),
    };
  });

  mockOrganization.prototype.save = mockSave;

  // Add static methods
  mockOrganization.find = jest.fn();
  mockOrganization.findById = jest.fn();
  mockOrganization.findOne = jest.fn();
  mockOrganization.findByIdAndDelete = jest.fn();
  mockOrganization.findOneAndDelete = jest.fn();

  return mockOrganization;
});

jest.mock("../models/User.js", () => {
  const mockUser = jest.fn();
  mockUser.findOne = jest.fn();
  mockUser.findById = jest.fn();
  return mockUser;
});

jest.mock("../logger.js", () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
}));

jest.mock("../services/emailService.js", () => ({
  sendTestEmail: jest.fn(),
}));

jest.mock("../services/jiraService.js", () => ({
  clearClientCache: jest.fn(),
}));

import Organization from "../models/Organization.js";
import User from "../models/User.js";
import logger from "../logger.js";
import emailService from "../services/emailService.js";
import jiraService from "../services/jiraService.js";

describe("Organization Controller", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  describe("createOrganization", () => {
    beforeEach(() => {
      req = {
        body: {
          name: "Test Organization",
          identifier: "testorg",
          members: [],
        },
      };
    });

    it("should create a new organization successfully", async () => {
      Organization.findOne.mockResolvedValue(null); // No existing org

      await createOrganization(req, res);

      expect(Organization.findOne).toHaveBeenCalledWith({
        identifier: "testorg",
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining(req.body));
      expect(logger.error).not.toHaveBeenCalled();
    });

    it("should return 400 if identifier is missing", async () => {
      req.body.identifier = undefined;

      await createOrganization(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Organization identifier is required",
      });
    });

    it("should return 409 if organization with identifier already exists", async () => {
      Organization.findOne.mockResolvedValue({ identifier: "testorg" });

      await createOrganization(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        error: "Organization with identifier 'testorg' already exists",
      });
      expect(logger.warn).toHaveBeenCalled();
    });

    it("should log errors when organization creation fails", async () => {
      const error = new Error("Database error");
      Organization.findOne.mockResolvedValue(null);
      Organization.prototype.save.mockRejectedValue(error);

      await createOrganization(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(logger.error).toHaveBeenCalledWith("Error creating organization", {
        error: error.message,
        stack: expect.any(String),
        requestBody: req.body,
      });
    });
  });

  describe("getOrganizations", () => {
    beforeEach(() => {
      req = {};
    });

    it("should get all organizations successfully", async () => {
      const organizations = [
        {
          name: "Test Org",
          toObject: jest.fn().mockReturnValue({ name: "Test Org" }),
        },
      ];
      Organization.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue(organizations),
      });

      await getOrganizations(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([{ name: "Test Org" }]);
      expect(logger.error).not.toHaveBeenCalled();
    });

    it("should return 204 when no organizations exist", async () => {
      Organization.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue([]),
      });

      await getOrganizations(req, res);

      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.json).toHaveBeenCalledWith();
    });

    it("should hide sensitive jira information", async () => {
      const organizations = [
        {
          name: "Test Org",
          toObject: jest.fn().mockReturnValue({
            name: "Test Org",
            jiraConfig: { apiToken: "secret-token" },
          }),
        },
      ];
      Organization.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue(organizations),
      });

      await getOrganizations(req, res);

      expect(res.json).toHaveBeenCalledWith([
        {
          name: "Test Org",
          jiraConfig: { apiToken: "***HIDDEN***" },
        },
      ]);
    });

    it("should log errors when retrieving organizations fails", async () => {
      const error = new Error("Database error");
      Organization.find.mockReturnValue({
        populate: jest.fn().mockRejectedValue(error),
      });

      await getOrganizations(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(logger.error).toHaveBeenCalledWith(
        "Error retrieving organizations",
        {
          error: error.message,
          stack: expect.any(String),
        }
      );
    });
  });

  describe("getOrganizationById", () => {
    beforeEach(() => {
      req = {
        params: { id: "orgId" },
      };
    });

    it("should get organization by id successfully", async () => {
      const organization = {
        name: "Test Org",
        toObject: jest.fn().mockReturnValue({ name: "Test Org" }),
      };
      Organization.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(organization),
      });

      await getOrganizationById(req, res);

      expect(Organization.findById).toHaveBeenCalledWith("orgId");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ name: "Test Org" });
    });

    it("should return 404 if organization not found", async () => {
      Organization.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      await getOrganizationById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: "Organization not found",
      });
    });
  });

  describe("getOrganizationByIdentifier", () => {
    beforeEach(() => {
      req = {
        params: { identifier: "testorg" },
      };
    });

    it("should get organization by identifier successfully", async () => {
      const organization = {
        name: "Test Org",
        toObject: jest.fn().mockReturnValue({ name: "Test Org" }),
      };
      Organization.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(organization),
      });

      await getOrganizationByIdentifier(req, res);

      expect(Organization.findOne).toHaveBeenCalledWith({
        identifier: "testorg",
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ name: "Test Org" });
    });

    it("should return 404 if organization not found", async () => {
      Organization.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      await getOrganizationByIdentifier(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: "Organization not found",
      });
    });
  });

  describe("updateOrganization", () => {
    beforeEach(() => {
      req = {
        params: { identifier: "testorg" },
        body: {
          name: "Updated Organization",
        },
      };
    });

    it("should update organization successfully", async () => {
      const organization = {
        name: "Test Org",
        save: jest.fn().mockResolvedValue(),
        toObject: jest.fn().mockReturnValue({ name: "Updated Organization" }),
      };
      Organization.findOne.mockResolvedValue(organization);

      await updateOrganization(req, res);

      expect(organization.name).toBe("Updated Organization");
      expect(organization.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return 404 if organization not found", async () => {
      Organization.findOne.mockResolvedValue(null);

      await updateOrganization(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: "Organization not found",
      });
    });

    it("should validate recommendation threshold", async () => {
      req.body.recommendationThreshold = 1.5; // Invalid value
      const organization = {
        save: jest.fn(),
        toObject: jest.fn(),
      };
      Organization.findOne.mockResolvedValue(organization);

      await updateOrganization(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Recommendation threshold must be a number between 0 and 1",
      });
    });

    it("should clear jira cache when jira config is updated", async () => {
      req.body.jiraConfig = {
        enabled: true,
        host: "test.atlassian.net",
        username: "test@example.com",
        apiToken: "token",
        projectKey: "TEST",
      };
      const organization = {
        jiraConfig: {},
        save: jest.fn().mockResolvedValue(),
        toObject: jest.fn().mockReturnValue({ name: "Test Org" }),
      };
      Organization.findOne.mockResolvedValue(organization);

      await updateOrganization(req, res);

      expect(jiraService.clearClientCache).toHaveBeenCalledWith("testorg");
      expect(logger.info).toHaveBeenCalled();
    });
  });

  describe("deleteOrganization", () => {
    beforeEach(() => {
      req = {
        params: { identifier: "testorg" },
      };
    });

    it("should delete organization successfully", async () => {
      const organization = {
        members: [{ user: "userId1" }, { user: "userId2" }],
      };
      const user = {
        organization: ["testorg", "otherorg"],
        save: jest.fn(),
      };
      Organization.findOne.mockResolvedValue(organization);
      Organization.findOneAndDelete.mockResolvedValue(organization);
      User.findById.mockResolvedValue(user);

      await deleteOrganization(req, res);

      expect(User.findById).toHaveBeenCalledTimes(2);
      expect(user.save).toHaveBeenCalledTimes(2);
      expect(Organization.findOneAndDelete).toHaveBeenCalledWith({
        identifier: "testorg",
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return 204 if organization not found", async () => {
      Organization.findOne.mockResolvedValue(null);

      await deleteOrganization(req, res);

      expect(res.status).toHaveBeenCalledWith(204);
    });
  });

  describe("addMemberToOrganizationByUsername", () => {
    beforeEach(() => {
      req = {
        params: { identifier: "testorg" },
        body: { username: "testuser" },
      };
    });

    it("should add member to organization successfully", async () => {
      const organization = {
        members: [],
        save: jest.fn(),
      };
      const user = {
        _id: "userId",
        organization: [],
        save: jest.fn(),
      };
      Organization.findOne.mockResolvedValue(organization);
      User.findOne.mockResolvedValue(user);

      await addMemberToOrganizationByUsername(req, res);

      expect(organization.members).toHaveLength(1);
      expect(organization.members[0]).toEqual({
        user: "userId",
        role: "user",
      });
      expect(organization.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return 404 if organization not found", async () => {
      Organization.findOne.mockResolvedValue(null);

      await addMemberToOrganizationByUsername(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: "Organization not found",
      });
    });

    it("should return 404 if user not found", async () => {
      const organization = { members: [] };
      Organization.findOne.mockResolvedValue(organization);
      User.findOne.mockResolvedValue(null);

      await addMemberToOrganizationByUsername(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "User not found" });
    });
  });

  describe("addMemberToOrganizationByEmail", () => {
    beforeEach(() => {
      req = {
        params: { identifier: "testorg" },
        body: { email: "test@example.com" },
      };
    });

    it("should add member to organization by email successfully", async () => {
      const organization = {
        members: [],
        save: jest.fn(),
      };
      const user = {
        _id: "userId",
        organization: [],
        save: jest.fn(),
      };
      Organization.findOne.mockResolvedValue(organization);
      User.findOne.mockResolvedValue(user);

      await addMemberToOrganizationByEmail(req, res);

      expect(User.findOne).toHaveBeenCalledWith({ email: "test@example.com" });
      expect(organization.members).toHaveLength(1);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("deleteMemberFromOrganization", () => {
    beforeEach(() => {
      req = {
        params: { identifier: "testorg" },
        body: { username: "testuser" },
      };
    });

    it("should remove member from organization successfully", async () => {
      const organization = {
        members: [{ user: "userId" }],
        save: jest.fn(),
      };
      const user = {
        _id: "userId",
        organization: ["testorg"],
        save: jest.fn(),
      };
      Organization.findOne.mockResolvedValue(organization);
      User.findOne.mockResolvedValue(user);

      await deleteMemberFromOrganization(req, res);

      expect(organization.members).toHaveLength(0);
      expect(organization.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("sendTestEmail", () => {
    beforeEach(() => {
      req = {
        params: { identifier: "testorg" },
        body: { testEmail: "test@example.com" },
      };
    });

    it("should send test email successfully", async () => {
      const organization = { email: "org@example.com" };
      Organization.findOne.mockResolvedValue(organization);
      emailService.sendTestEmail.mockResolvedValue(true);

      await sendTestEmail(req, res);

      expect(emailService.sendTestEmail).toHaveBeenCalledWith(
        "test@example.com"
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return 404 if organization not found", async () => {
      Organization.findOne.mockResolvedValue(null);

      await sendTestEmail(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should use organization email if no test email provided", async () => {
      req.body = {}; // No testEmail
      const organization = { email: "org@example.com" };
      Organization.findOne.mockResolvedValue(organization);
      emailService.sendTestEmail.mockResolvedValue(true);

      await sendTestEmail(req, res);

      expect(emailService.sendTestEmail).toHaveBeenCalledWith(
        "org@example.com"
      );
    });
  });
});
