import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import logger from "../logger.js";

//REGISTER USER
export const register = async (req, res) => {
  try {
    const {
      // firstName,
      // lastName,
      username,
      email,
      password,
      role,
      organization,
    } = req.body;
    var user = await User.find({ email: email });
    if (user.length !== 0)
      return res.status(409).json({ error: "User already exists" });
    user = await User.find({ username: username });
    if (user.length !== 0)
      return res.status(409).json({ error: "Username already exists" });
    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = new User({
      // firstName,
      // lastName,
      username,
      email,
      password: passwordHash,
      role,
      organization,
    });
    const savedUser = await newUser.save();
    savedUser.password = undefined;
    res.status(200).json(savedUser);
  } catch (error) {
    // Log the error with additional context
    logger.error("Error registering user", {
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

    const token = jwt.sign({ id: user.id }, process.env.jwtSecret, {
      expiresIn: process.env.TOKEN_EXPIRATION,
    });
    res.cookie("jwt", token, {
      httpOnly: true,
      // secure: true,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 1, // 1 minute
    });
    user.password = undefined;
    logger.info("User logged in successfully", {
      userId: user.id,
      email: user.email,
    });
    res.status(200).json({ message: "Logged in successfully" });
  } catch (error) {
    // Log the error with additional context
    logger.error("Error logging in user", {
      error: error.message,
      stack: error.stack,
      requestBody: req.body,
    });
    res.status(500).json({ error: error.message });
  }
};

//LOGOUT USER
//TODO: zid ll documentation w updati il login w b9iet il api auth fil doc
export const logout = async (req, res) => {
  try {
    res.clearCookie("jwt", {
      httpOnly: true,
      // secure: true,
      sameSite: "lax",
    });
    logger.info("User logged out successfully");
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    // Log the error with additional context
    logger.error("Error logging out user", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: error.message });
  }
};
