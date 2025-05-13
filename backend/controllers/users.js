import User from "../models/User.js";
import logger from "../logger.js";
import bcrypt from "bcrypt"; // Add this import for password hashing

//READ
export const getUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    user.password = undefined;
    res.status(200).json(user);
  } catch (error) {
    // Log the error with additional context
    logger.error("Error retrieving user", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: error.message });
  }
};

//READ ME
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate(
      "organizationDetails"
    );
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    user.id = undefined;
    user.password = undefined;
    user.__v = undefined;
    user.createdAt = undefined;
    user.updatedAt = undefined;
    user.role = undefined;
    res.status(200).json(user);
  } catch (error) {
    // Log the error with additional context
    logger.error("Error retrieving user", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: error.message });
  }
};

//UPDATE
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    // Find the user
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Require password verification for ALL modifications
    if (!updates.currentPassword) {
      return res.status(400).json({
        error: "Current password is required for any account modifications",
      });
    }

    // Verify the current password
    const isMatch = await bcrypt.compare(
      updates.currentPassword,
      user.password
    );
    if (!isMatch) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    // Remove currentPassword from updates as we don't want to save it
    delete updates.currentPassword;

    // Check if username update is requested and if it already exists
    if (updates.username) {
      const existingUser = await User.findOne({
        username: updates.username,
        _id: { $ne: id }, // exclude current user
      });

      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }
    }

    // Check if email update is requested and if it already exists
    if (updates.email) {
      const existingUser = await User.findOne({
        email: updates.email,
        _id: { $ne: id }, // exclude current user
      });

      if (existingUser) {
        return res.status(400).json({ error: "Email already exists" });
      }
    }

    // Hash the new password if it's being updated
    if (updates.password) {
      const salt = await bcrypt.genSalt();
      updates.password = await bcrypt.hash(updates.password, salt);
    }

    // Update the user with validated fields
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.status(200).json("User updated successfully");
  } catch (error) {
    // Log the error with additional context
    logger.error("Error updating user", {
      error: error.message,
      stack: error.stack,
      requestBody: req.body,
    });
    res.status(500).json({ error: error.message });
  }
};

//ADD TO ORGANIZATION
export const addToOrganization = async (req, res) => {
  try {
    const { id } = req.params;
    const { organizationIdentifier } = req.body;

    // Find the user
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!organizationIdentifier) {
      return res
        .status(400)
        .json({ error: "Organization identifier is required" });
    }

    // Check if the user is already in the organization
    if (user.organization.includes(organizationIdentifier)) {
      return res
        .status(400)
        .json({ error: "User already in this organization" });
    }

    // Add the organization to the user's organizations
    user.organization.push(organizationIdentifier);
    await user.save();

    res.status(200).json("User added to organization successfully");
  } catch (error) {
    // Log the error with additional context
    logger.error("Error adding user to organization", {
      error: error.message,
      stack: error.stack,
      requestBody: req.body,
    });
    res.status(500).json({ error: error.message });
  }
};

//DELETE FROM ORGANIZATION
export const deleteFromOrganization = async (req, res) => {
  try {
    const { id } = req.params;
    const { organizationIdentifier } = req.body;

    // Find the user
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!organizationIdentifier) {
      return res
        .status(400)
        .json({ error: "Organization identifier is required" });
    }

    // Check if the user is in the organization
    if (!user.organization.includes(organizationIdentifier)) {
      return res.status(400).json({ error: "User not in this organization" });
    }

    // Remove the organization from the user's organizations
    user.organization = user.organization.filter(
      (org) => org !== organizationIdentifier
    );
    await user.save();

    res.status(200).json("User removed from organization successfully");
  } catch (error) {
    // Log the error with additional context
    logger.error("Error removing user from organization", {
      error: error.message,
      stack: error.stack,
      requestBody: req.body,
    });
    res.status(500).json({ error: error.message });
  }
};
