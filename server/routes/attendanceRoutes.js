import { Router } from "express";
import {
  list,
  checkIn,
  checkOut,
} from "../controllers/attendanceController.js";
const router = Router();
router.get("/", list);
router.post("/check-in", checkIn);
router.post("/check-out", checkOut);
export default router;
