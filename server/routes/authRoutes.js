import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { register, login } from "../controllers/authController.js";
import { authenticate } from "../middleware/authMiddleware.js";
const router = Router();
router.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  }),
);
router.post("/register", register);
router.post("/login", login);
router.get("/me", authenticate, (req, res) => res.json(req.user));
export default router;
