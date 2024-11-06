import httpStatus from "http-status";
import { User } from "../models/user.model.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { Meeting } from "../models/meeting.model.js";

// User login
const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Please provide both username and password." });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(httpStatus.NOT_FOUND).json({ message: "User not found" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (isPasswordCorrect) {
      const token = crypto.randomBytes(20).toString("hex");
      user.token = token;
      await user.save();
      return res.status(httpStatus.OK).json({ token });
    } else {
      return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid username or password" });
    }
  } catch (e) {
    return res.status(500).json({ message: `Something went wrong: ${e}` });
  }
};

// User registration
const register = async (req, res) => {
  const { name, username, password } = req.body;

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(httpStatus.FOUND).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      username,
      password: hashedPassword,
    });

    await newUser.save();

    res.status(httpStatus.CREATED).json({ message: "User registered" });
  } catch (e) {
    res.status(500).json({ message: `Something went wrong: ${e}` });
  }
};

// Fetch user meeting history
const getUserHistory = async (req, res) => {
  const { token } = req.query;

  try {
    const user = await User.findOne({ token });
    if (!user) {
      return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid token" });
    }

    const meetings = await Meeting.find({ user_id: user.username });
    res.status(httpStatus.OK).json(meetings);
  } catch (e) {
    res.status(500).json({ message: `Something went wrong: ${e}` });
  }
};

// Add a meeting to user's history
const addToHistory = async (req, res) => {
  const { token, meeting_code, password } = req.body;

  console.log("Request body:", req.body); // Log the request body

  try {
    const user = await User.findOne({ token });
    if (!user) {
      console.log("User not found or invalid token");
      return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid token" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("Storing hashed password for meeting:", hashedPassword);

    const newMeeting = new Meeting({
      user_id: user.username,
      meetingCode: meeting_code,
      password: hashedPassword,
    });

    await newMeeting.save();
    console.log("Meeting saved successfully:", newMeeting);
    return res.status(httpStatus.CREATED).json({ message: "Meeting created successfully" });

  } catch (e) {
    console.error("Error creating meeting:", e);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: `Error creating meeting: ${e.message}` });
  }
};

// Validate meeting code and password for joining
// The relevant part is the `joinMeeting` function
// In user.controller.js

const joinMeeting = async (req, res) => {
    const { meeting_code, password } = req.body;

    if (!meeting_code || !password) {
        return res.status(400).json({
            success: false,
            message: "Meeting code and password are required"
        });
    }

    try {
        const meeting = await Meeting.findOne({ meetingCode: meeting_code });

        if (!meeting) {
            return res.status(404).json({
                success: false,
                message: "Meeting not found"
            });
        }

        // Ensure we have a password to compare against
        if (!meeting.password) {
            return res.status(500).json({
                success: false,
                message: "Meeting is not properly configured"
            });
        }

        // Compare passwords
        const isPasswordValid = await bcrypt.compare(password, meeting.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Incorrect password"
            });
        }

        // Success case
        return res.status(200).json({
            success: true,
            message: "Successfully joined meeting",
            meetingCode: meeting_code
        });

    } catch (error) {
        console.error("Join meeting error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error while joining meeting"
        });
    }
};
export { login, register, getUserHistory, addToHistory, joinMeeting };
