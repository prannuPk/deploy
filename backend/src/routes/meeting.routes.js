import express from 'express';
import { Meeting } from '../models/meeting.model.js'; // Ensure correct import of Meeting model

const router = express.Router();

// Join Meeting Route
router.post('/join_meeting', async (req, res) => {
    const { meetingCode, password } = req.body;
    console.log("Incoming request:", req.body);

    try {
        const meeting = await Meeting.findOne({ meetingCode });

        if (!meeting) {
            return res.status(404).json({ message: "Meeting not found" });
        }

        if (meeting.password !== password) {
            return res.status(401).json({ message: "Incorrect password" });
        }

        return res.status(200).json({ message: "Successfully joined meeting", meetingCode });
    } catch (error) {
        console.error("Error joining meeting:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
});

// Create Meeting Route
router.post('/create_meeting', async (req, res) => {
    const { meetingCode, password } = req.body;

    try {
        // Check if a meeting with the same code already exists
        const existingMeeting = await Meeting.findOne({ meetingCode });
        if (existingMeeting) {
            return res.status(409).json({ message: "Meeting code already exists" });
        }

        // Create a new meeting document
        const newMeeting = new Meeting({ meetingCode, password });
        await newMeeting.save();

        return res.status(201).json({ message: "Meeting created successfully", meetingCode });
    } catch (error) {
        console.error("Error creating meeting:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
});

export default router;
