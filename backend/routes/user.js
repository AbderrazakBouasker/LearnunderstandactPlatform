import express from "express";
import { getUser } from "../controllers/users.js";
import { verifyToken } from "../middleware/auth.js";
import { rateLimiter } from '../middleware/ratelimiter.js';

const router = express.Router();

//READ USER
router.get("/:id", rateLimiter(1,100), verifyToken, getUser);
  
export default router;
