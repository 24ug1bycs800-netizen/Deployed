import { Router } from "express";
import {
  lockSeats,
  unlockSeats
} from "../controllers/seatLockController";
import {
  authenticateJWT
} from "../middleware/authMiddleware";

const router = Router();

router.post(
  "/lock",
  authenticateJWT,
  lockSeats
);

router.post(
  "/unlock",
  authenticateJWT,
  unlockSeats
);

export default router;