import express from "express";
import {
  getOrganizationById,
  getOrganizationByIdentifier,
  getOrganizations,
  createOrganization,
  updateOrganization,
  deleteOrganization,
} from "../controllers/organization.js";
import { verifyToken } from "../middleware/auth.js";
import { rateLimiter } from "../middleware/ratelimiter.js";

const router = express.Router();

//READ ORGANIZATION
router.get("/:id", rateLimiter(1, 100), verifyToken, getOrganizationById);
router.get(
  "/identifier/:identifier",
  rateLimiter(1, 100),
  verifyToken,
  getOrganizationByIdentifier
);
router.get("/", rateLimiter(1, 100), verifyToken, getOrganizations);
//CREATE ORGANIZATION
router.post("/create", rateLimiter(1, 100), verifyToken, createOrganization);
//UPDATE ORGANIZATION
router.patch(
  "/:identifier/edit",
  rateLimiter(1, 100),
  verifyToken,
  updateOrganization
);
//DELETE ORGANIZATION
router.delete(
  "/:identifier/delete",
  rateLimiter(1, 100),
  verifyToken,
  deleteOrganization
);

export default router;
