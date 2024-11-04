import httpStatus from "http-status";
import { User } from "../models/user.model.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { Meeting } from "../models/meeting.model.js";

const login = async (req, res) => {
  // unchanged code for login
};

const register = async (req, res) => {
  // unchanged code for register
};

const getUserHistory = async (req, res) => {
  // unchanged code for getUserHistory
};

// Create a meeting with a meeting code and password
const addToHistory = async (req, res) => {
  const { token, meeting_code, password } = req.body;

  try {
    const user = await User.findOne({ token });
    if (!user) {
      return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid token" });
    }

    const newMeeting = new Meeting({
      user_id: user.username,
      meetingCode: meeting_code,
      password: await bcrypt.hash(password, 10), // Hash password before saving
    });

    await newMeeting.save();

    res.status(httpStatus.CREATED).json({ message: "Meeting created successfully" });
  } catch (e) {
    res.status(500).json({ message: `Error creating meeting: ${e}` });
  }
};

// Validate meeting code and password for joining
const joinMeeting = async (req, res) => {
  const { meeting_code, password } = req.body;

  try {
    const meeting = await Meeting.findOne({ meetingCode: meeting_code });
    if (!meeting) {
      return res.status(httpStatus.NOT_FOUND).json({ message: "Meeting not found" });
    }

    // Check password validity
    const isPasswordCorrect = await bcrypt.compare(password, meeting.password);
    if (!isPasswordCorrect) {
      return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid meeting code or password" });
    }

    res.status(httpStatus.OK).json({ message: "Joined meeting successfully" });
  } catch (e) {
    res.status(500).json({ message: `Error joining meeting: ${e}` });
  }
};

export { login, register, getUserHistory, addToHistory, joinMeeting };
