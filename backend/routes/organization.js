import express from "express";
import {
  getOrganizationById,
  getOrganizationByIdentifier,
  getOrganizations,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  addMemberToOrganizationByUsername,
  addMemberToOrganizationByEmail,
  deleteMemberFromOrganization,
  promoteDemoteMember,
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
//ADD MEMBER TO ORGANIZATION BY USERNAME
router.post(
  "/:identifier/member/add/username",
  rateLimiter(1, 100),
  verifyToken,
  addMemberToOrganizationByUsername
);
//ADD MEMBER TO ORGANIZATION BY EMAIL
router.post(
  "/:identifier/member/add/email",
  rateLimiter(1, 100),
  verifyToken,
  addMemberToOrganizationByEmail
);
//REMOVE MEMBER FROM ORGANIZATION
router.post(
  "/:identifier/member/remove",
  rateLimiter(1, 100),
  verifyToken,
  deleteMemberFromOrganization
);
//CHANGE MEMBER ROLE
router.post(
  "/:identifier/member/change-role",
  rateLimiter(1, 100),
  verifyToken,
  promoteDemoteMember
);
export default router;
