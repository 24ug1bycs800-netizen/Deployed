import { Router } from "express";
import {
  createGroupRoom,
  getGroupRoom,
  joinGroupRoom,
  castVote,
  finalizeSelections,
  getMyGroupRooms,
} from "../controllers/groupController";
import { authenticateJWT } from "../middleware/authMiddleware";

const router = Router();

router.post("/create", authenticateJWT, createGroupRoom);
router.get("/my-rooms", authenticateJWT, getMyGroupRooms);
router.post("/join", authenticateJWT, joinGroupRoom);
router.get("/:inviteCode", authenticateJWT, getGroupRoom);
router.post("/:id/vote", authenticateJWT, castVote);
router.post("/:id/finalize", authenticateJWT, finalizeSelections);

export default router;
