import Organization from "../models/Organization.js";
import logger from "../logger.js";
import User from "../models/User.js";

// CREATE
export const createOrganization = async (req, res) => {
  try {
    const { name, identifier, members } = req.body;

    // Validate required fields
    if (!identifier) {
      return res
        .status(400)
        .json({ error: "Organization identifier is required" });
    }

    // Check if organization with this identifier already exists
    const existingOrg = await Organization.findOne({ identifier });
    if (existingOrg) {
      logger.warn("Attempt to create organization with existing identifier", {
        identifier,
        requestedName: name,
      });
      return res
        .status(409) // Changed from 400 to 409 Conflict for consistency
        .json({
          error:
            "Organization with identifier '" + identifier + "' already exists",
        });
    }

    const newOrganization = new Organization({
      name,
      identifier,
      members: members || [],
    });

    await newOrganization.save();
    res.status(201).json(newOrganization);
  } catch (error) {
    logger.error("Error creating organization", {
      error: error.message,
      stack: error.stack,
      requestBody: req.body,
    });
    res.status(500).json({ error: error.message });
  }
};

// READ ALL
export const getOrganizations = async (req, res) => {
  try {
    const organizations = await Organization.find().populate(
      "members.user",
      "username email _id"
    );
    if (organizations.length === 0) {
      return res.status(204).json();
    }

    // Remove sensitive information from each organization
    const safeOrganizations = organizations.map((org) => {
      const orgObj = org.toObject();
      if (orgObj.jiraConfig && orgObj.jiraConfig.apiToken) {
        orgObj.jiraConfig.apiToken = "***HIDDEN***";
      }
      return orgObj;
    });

    res.status(200).json(safeOrganizations);
  } catch (error) {
    logger.error("Error retrieving organizations", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: error.message });
  }
};

// READ BY ID
export const getOrganizationById = async (req, res) => {
  try {
    const { id } = req.params;
    const organization = await Organization.findById(id).populate(
      "members.user",
      "username email _id"
    );
    if (!organization) {
      return res.status(404).json({ error: "Organization not found" });
    }

    // Remove sensitive information
    const safeOrganization = organization.toObject();
    if (safeOrganization.jiraConfig && safeOrganization.jiraConfig.apiToken) {
      safeOrganization.jiraConfig.apiToken = "***HIDDEN***";
    }

    res.status(200).json(safeOrganization);
  } catch (error) {
    logger.error("Error retrieving organization by ID", {
      error: error.message,
      stack: error.stack,
      params: req.params,
    });
    res.status(500).json({ error: error.message });
  }
};

// READ BY IDENTIFIER
export const getOrganizationByIdentifier = async (req, res) => {
  try {
    const { identifier } = req.params;
    const organization = await Organization.findOne({ identifier }).populate(
      "members.user",
      "username email _id"
    );
    if (!organization) {
      return res.status(404).json({ error: "Organization not found" });
    }

    // Remove sensitive information
    const safeOrganization = organization.toObject();
    if (safeOrganization.jiraConfig && safeOrganization.jiraConfig.apiToken) {
      safeOrganization.jiraConfig.apiToken = "***HIDDEN***";
    }

    res.status(200).json(safeOrganization);
    // res.status(200).json(organization);
  } catch (error) {
    logger.error("Error retrieving organization by identifier", {
      error: error.message,
      stack: error.stack,
      params: req.params,
    });
    res.status(500).json({ error: error.message });
  }
};

// UPDATE
export const updateOrganization = async (req, res) => {
  try {
    const { identifier } = req.params;
    const {
      name,
      members,
      plan,
      domains,
      recommendationThreshold,
      ticketCreationDelay,
      notificationThreshold,
      jiraConfig,
    } = req.body;
    const organization = await Organization.findOne({ identifier });
    console.log("body :", req.body);
    if (!organization) {
      return res.status(404).json({ error: "Organization not found" });
    }

    if (name !== undefined) {
      organization.name = name;
    }

    if (members !== undefined) {
      organization.members = members;
    }

    if (plan !== undefined) {
      organization.plan = plan;
    }

    if (domains !== undefined) {
      organization.domains = domains;
    }

    if (recommendationThreshold !== undefined) {
      if (
        typeof recommendationThreshold !== "number" ||
        recommendationThreshold < 0 ||
        recommendationThreshold > 1
      ) {
        return res.status(400).json({
          error: "Recommendation threshold must be a number between 0 and 1",
        });
      }
      organization.recommendationThreshold = recommendationThreshold;
    }

    if (ticketCreationDelay !== undefined) {
      if (
        typeof ticketCreationDelay !== "number" ||
        ticketCreationDelay < 1 ||
        ticketCreationDelay > 365
      ) {
        return res.status(400).json({
          error: "Ticket creation delay must be a number between 1 and 365",
        });
      }
      organization.ticketCreationDelay = ticketCreationDelay;
    }

    if (notificationThreshold !== undefined) {
      if (
        typeof notificationThreshold !== "number" ||
        notificationThreshold < 0 ||
        notificationThreshold > 1
      ) {
        return res.status(400).json({
          error: "Notification threshold must be a number between 0 and 1",
        });
      }
      organization.notificationThreshold = notificationThreshold;
    }

    if (jiraConfig !== undefined) {
      // Initialize jiraConfig if it doesn't exist
      if (!organization.jiraConfig) {
        organization.jiraConfig = {};
      }

      // Update only the fields that are provided
      if (jiraConfig.host !== undefined) {
        organization.jiraConfig.host = jiraConfig.host;
      }
      if (jiraConfig.username !== undefined) {
        organization.jiraConfig.username = jiraConfig.username;
      }
      if (jiraConfig.apiToken !== undefined) {
        organization.jiraConfig.apiToken = jiraConfig.apiToken;
      }
      if (jiraConfig.projectKey !== undefined) {
        organization.jiraConfig.projectKey = jiraConfig.projectKey;
      }
      if (jiraConfig.issueType !== undefined) {
        organization.jiraConfig.issueType = jiraConfig.issueType;
      }
      if (jiraConfig.enabled !== undefined) {
        organization.jiraConfig.enabled = jiraConfig.enabled;
      }

      // Validate Jira configuration if enabled
      if (
        organization.jiraConfig.enabled &&
        (!organization.jiraConfig.host ||
          !organization.jiraConfig.username ||
          !organization.jiraConfig.apiToken ||
          !organization.jiraConfig.projectKey)
      ) {
        return res.status(400).json({
          error:
            "Jira configuration requires host, username, API token, and project key when enabled",
        });
      }
    }

    await organization.save();

    // Remove sensitive information from response
    const safeOrganization = organization.toObject();
    if (safeOrganization.jiraConfig && safeOrganization.jiraConfig.apiToken) {
      safeOrganization.jiraConfig.apiToken = "***HIDDEN***";
    }

    res.status(200).json(safeOrganization);
  } catch (error) {
    logger.error("Error updating organization", {
      error: error.message,
      stack: error.stack,
      params: req.params,
      body: req.body,
    });
    res.status(500).json({ error: error.message });
  }
};

// DELETE
export const deleteOrganization = async (req, res) => {
  try {
    const { identifier } = req.params;

    // First find the organization to get its members
    const organization = await Organization.findOne({ identifier });

    if (!organization) {
      return res.status(204).json({ error: "Organization not found" });
    }

    // Update all members to remove this organization from their list
    for (const member of organization.members) {
      const user = await User.findById(member.user);
      if (user) {
        user.organization = user.organization.filter(
          (org) => org !== identifier
        );
        await user.save();
      }
    }

    // Now delete the organization
    const deletedOrganization = await Organization.findOneAndDelete({
      identifier,
    });

    res.status(200).json("Organization Deleted Successfully");
  } catch (error) {
    logger.error("Error deleting organization", {
      error: error.message,
      stack: error.stack,
      params: req.params,
    });
    res.status(500).json({ error: error.message });
  }
};

//ADD MEMBER TO ORGANIZATION BY USERNAME
export const addMemberToOrganizationByUsername = async (req, res) => {
  try {
    const { identifier } = req.params;
    const { username } = req.body;

    // Find the organization
    const organization = await Organization.findOne({ identifier });
    if (!organization) {
      return res.status(404).json({ error: "Organization not found" });
    }

    // Find the user by username
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if the user is already a member
    const isMember = organization.members.some(
      (member) => member.user && member.user.toString() === user._id.toString()
    );

    if (isMember) {
      return res
        .status(400)
        .json({ error: "User is already a member of this organization" });
    }

    // Add the user to the organization's members
    organization.members.push({ user: user._id, role: "user" });
    await organization.save();

    // Also add the organization to the user's organization list
    if (!user.organization.includes(identifier)) {
      user.organization.push(identifier);
      await user.save();
    }

    res.status(200).json("User added to organization successfully");
  } catch (error) {
    logger.error("Error adding user to organization", {
      error: error.message,
      stack: error.stack,
      requestBody: req.body,
    });
    res.status(500).json({ error: error.message });
  }
};
//ADD MEMBER TO ORGANIZATION BY EMAIL
export const addMemberToOrganizationByEmail = async (req, res) => {
  try {
    const { identifier } = req.params;
    const { email } = req.body;

    // Find the organization
    const organization = await Organization.findOne({ identifier });
    if (!organization) {
      return res.status(404).json({ error: "Organization not found" });
    }

    // Find the user by username
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if the user is already a member
    const isMember = organization.members.some(
      (member) => member.user && member.user.toString() === user._id.toString()
    );

    if (isMember) {
      return res
        .status(400)
        .json({ error: "User is already a member of this organization" });
    }

    // Add the user to the organization's members
    organization.members.push({ user: user._id, role: "user" });
    await organization.save();

    // Also add the organization to the user's organization list
    if (!user.organization.includes(identifier)) {
      user.organization.push(identifier);
      await user.save();
    }

    res.status(200).json("User added to organization successfully");
  } catch (error) {
    logger.error("Error adding user to organization", {
      error: error.message,
      stack: error.stack,
      requestBody: req.body,
    });
    res.status(500).json({ error: error.message });
  }
};
//DELETE MEMBER FROM ORGANIZATION
export const deleteMemberFromOrganization = async (req, res) => {
  try {
    const { identifier } = req.params;
    const { username } = req.body;

    // Find the organization
    const organization = await Organization.findOne({ identifier });
    if (!organization) {
      return res.status(404).json({ error: "Organization not found" });
    }

    // Find the user by username
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if the user is a member
    const isMember = organization.members.some(
      (member) => member.user && member.user.toString() === user._id.toString()
    );

    if (!isMember) {
      return res
        .status(400)
        .json({ error: "User is not a member of this organization" });
    }

    // Remove the user from the organization's members
    organization.members = organization.members.filter(
      (member) => member.user.toString() !== user._id.toString()
    );
    await organization.save();

    // Also remove the organization from the user's organization list
    if (user.organization.includes(identifier)) {
      user.organization = user.organization.filter((org) => org !== identifier);
      await user.save();
    }

    res.status(200).json("User removed from organization successfully");
  } catch (error) {
    logger.error("Error removing user from organization", {
      error: error.message,
      stack: error.stack,
      requestBody: req.body,
    });
    res.status(500).json({ error: error.message });
  }
};
//PROMOTE DEMOTE MEMBER
export const promoteDemoteMember = async (req, res) => {
  try {
    const { identifier } = req.params;
    const { username } = req.body;

    // Find the organization
    const organization = await Organization.findOne({ identifier });
    if (!organization) {
      return res.status(404).json({ error: "Organization not found" });
    }

    // Find the user by username
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if the user is a member
    const memberIndex = organization.members.findIndex(
      (member) => member.user && member.user.toString() === user._id.toString()
    );

    if (memberIndex === -1) {
      return res
        .status(400)
        .json({ error: "User is not a member of this organization" });
    }

    // Toggle the role between user and subadmin
    const currentRole = organization.members[memberIndex].role;
    let newRole;

    if (currentRole === "user") {
      newRole = "subadmin";
      organization.members[memberIndex].role = newRole;
      await organization.save();
      res.status(200).json("User promoted to subadmin successfully");
    } else if (currentRole === "subadmin") {
      newRole = "user";
      organization.members[memberIndex].role = newRole;
      await organization.save();
      res.status(200).json("User demoted to user successfully");
    } else {
      // Handle other roles if needed (like admin)
      return res
        .status(400)
        .json({ error: "Cannot change role for this user" });
    }
  } catch (error) {
    logger.error("Error changing user role", {
      error: error.message,
      stack: error.stack,
      requestBody: req.body,
    });
    res.status(500).json({ error: error.message });
  }
};
