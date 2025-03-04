import express from "express";
import {
  getUser,
} from "../controllers/users.js";

import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

//READ USER
router.get("/:id", verifyToken, getUser);

export default router;
