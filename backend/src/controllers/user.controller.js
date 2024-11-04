import httpStatus from "http-status";
import { User } from "../models/user.model.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { Meeting } from "../models/meeting.model.js";

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

const addToHistory = async (req, res) => {
  const { token, meeting_code, password } = req.body;

  console.log("Request body:", req.body); // Log the request body

  try {
    // Find the user associated with the provided token
    const user = await User.findOne({ token });
    if (!user) {
      console.log("User not found or invalid token");
      return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid token" });
    }

    // Hash the meeting password
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("Storing hashed password for meeting:", hashedPassword);

    // Create a new meeting record
    const newMeeting = new Meeting({
      user_id: user.username,
      meetingCode: meeting_code,
      password: hashedPassword,
    });

    // Save the meeting to the database
    const savedMeeting = await newMeeting.save();
    if (savedMeeting) {
      console.log("Meeting saved successfully:", savedMeeting);
      return res.status(httpStatus.CREATED).json({ message: "Meeting created successfully" });
    } else {
      console.log("Failed to save the meeting");
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "Failed to create meeting" });
    }
  } catch (e) {
    console.error("Error creating meeting:", e);
    res.status(500).json({ message: `Error creating meeting: ${e.message}` }); // Use e.message for clarity
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

    // Log the stored and input passwords for debugging
    console.log("Stored hashed password:", meeting.password);
    console.log("Password provided:", password);

    // Check password validity
    const isPasswordCorrect = await bcrypt.compare(password, meeting.password);
    if (!isPasswordCorrect) {
      console.log("Password is incorrect");
      return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid meeting code or password" });
    }

    console.log("Password is correct, joining the meeting");
    res.status(httpStatus.OK).json({ message: "Joined meeting successfully" });
  } catch (e) {
    console.error("Error joining meeting:", e);
    res.status(500).json({ message: `Error joining meeting: ${e}` });
  }
};

export { login, register, getUserHistory, addToHistory, joinMeeting };
