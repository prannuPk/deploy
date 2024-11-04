import { Router } from "express";
import {
  addToHistory,
  getUserHistory,
  login,
  register,
  joinMeeting,
} from "../controllers/user.controller.js";

const router = Router();

router.route("/login").post(login);
router.route("/register").post(register);
router.route("/add_to_activity").post(addToHistory);
router.route("/get_all_activity").get(getUserHistory);
router.route("/join_meeting").post(joinMeeting); // Route for joining a meeting
router.route("/meetings/validate").post(joinMeeting); // New route for validation

export default router;
