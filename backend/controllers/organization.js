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
    res.status(200).json(organizations);
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
    res.status(200).json(organization);
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
    res.status(200).json(organization);
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
    const { name, members } = req.body;
    const organization = await Organization.findOne({ identifier });

    if (!organization) {
      return res.status(404).json({ error: "Organization not found" });
    }

    if (name !== undefined) {
      organization.name = name;
    }

    if (members !== undefined) {
      organization.members = members;
    }

    await organization.save();
    res.status(200).json(organization);
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
    const deletedOrganization = await Organization.findOneAndDelete({
      identifier,
    });
    if (!deletedOrganization) {
      return res.status(204).json({ error: "Organization not found" });
    }
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
    const organization = await Organization.findOne({ email });
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
