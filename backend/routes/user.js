import express from "express";
import {
  getUser,
  getMe,
  updateUser,
  addToOrganization,
  deleteFromOrganization,
} from "../controllers/users.js";
import { verifyToken } from "../middleware/auth.js";
import { rateLimiter } from "../middleware/ratelimiter.js";

const router = express.Router();

//READ ME
router.get("/me", rateLimiter(1, 100), verifyToken, getMe);
//READ USER
router.get("/:id", rateLimiter(1, 100), verifyToken, getUser);
//UPDATE USER
router.post("/:id", rateLimiter(1, 10), verifyToken, updateUser);
//ADD USER TO ORGANIZATION
router.post(
  "/:id/addtoorganization",
  rateLimiter(1, 100),
  verifyToken,
  addToOrganization
);
//DELETE USER FROM ORGANIZATION
router.post(
  "/:id/deletefromorganization",
  rateLimiter(1, 100),
  verifyToken,
  deleteFromOrganization
);

export default router;
