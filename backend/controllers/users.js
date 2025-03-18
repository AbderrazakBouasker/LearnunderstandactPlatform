import User from "../models/User.js";
import logger from '../logger.js';

//READ
export const getUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    user.password = undefined;
    res.status(200).json(user);
  } catch (error) {
    // Log the error with additional context
    logger.error('Error retrieving user', {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: error.message });
  }
};
