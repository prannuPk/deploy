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
const joinMeeting = async (req, res) => {
  const { meeting_code, password } = req.body;

  try {
    // Fetch the meeting based on the code
    const meeting = await Meeting.findOne({ meetingCode: meeting_code });
    if (!meeting) {
      console.log("Meeting not found with code:", meeting_code);
      return res.status(httpStatus.NOT_FOUND).json({ message: "Meeting not found" });
    }

    console.log("Stored hashed password in DB:", meeting.password);
    console.log("Password provided by user:", password);

    // Compare the provided password with the hashed password in DB
    const isPasswordCorrect = await bcrypt.compare(password, meeting.password);

    // Explicitly log the comparison result
    console.log("Password match result:", isPasswordCorrect);

    if (!isPasswordCorrect) {
      console.log("Password is incorrect for meeting code:", meeting_code);
      return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid meeting code or password" });
    }

    console.log("Password is correct, joining the meeting");
    return res.status(httpStatus.OK).json({ message: "Joined meeting successfully" });
  } catch (e) {
    console.error("Error in joinMeeting function:", e);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: `Error joining meeting: ${e.message}` });
  }
};

export { login, register, getUserHistory, addToHistory, joinMeeting };
