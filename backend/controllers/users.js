import User from "../models/User.js";
import logger from "../logger.js";

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
