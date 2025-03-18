import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import logger from '../logger.js';


//REGISTER USER
export const register = async (req, res) => {
  try {
    const {
      // firstName,
      // lastName,
      email,
      password,
      role,
    } = req.body;
    const user = await User.find({ email: email });
    if (user.length !== 0) return res.status(409).json({error: "User already exists" });
    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = new User({
      // firstName,
      // lastName,
      email,
      password: passwordHash,
      role,
    });
    const savedUser = await newUser.save();
    savedUser.password = undefined;
    res.status(200).json(savedUser);
  } catch (error) {
    // Log the error with additional context
    logger.error('Error registering user', {
      error: error.message,
      stack: error.stack,
      requestBody: req.body,
    });
    res.status(500).json({ error: error.message });
  }
};

//LOG IN USER

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user.id }, process.env.jwtSecret);
    user.password = undefined;
    logger.info('User logged in successfully', {
      userId: user.id,
      email: user.email,
    });
    res.status(200).json({ token, user });
  } catch (error) {
    // Log the error with additional context
    logger.error('Error logging in user', {
      error: error.message,
      stack: error.stack,
      requestBody: req.body,
    });
    res.status(500).json({ error: error.message });
  }
};
