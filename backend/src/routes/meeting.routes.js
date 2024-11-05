import express from 'express';
import { Meeting } from '../models/meeting.model.js'; // Ensure correct import of Meeting model

const router = express.Router();

// Join Meeting Route
router.post('/join_meeting', async (req, res) => {
    const { meetingCode, password } = req.body; // Use meetingCode (with uppercase 'C')

    console.log("Incoming request:", req.body); // Log the incoming payload

    try {
        // Find the meeting in the database using meetingCode
        const meeting = await Meeting.findOne({ meetingCode }); // Correct field name

        if (!meeting) {
            return res.status(404).json({ message: "Meeting not found" });
        }

        // Validate the password
        if (meeting.password !== password) {
            return res.status(401).json({ message: "Incorrect password" });
        }

        // Successfully joined the meeting
        return res.status(200).json({ message: "Successfully joined meeting", meetingCode }); // Include meetingCode in response

    } catch (error) {
        console.error("Error joining meeting:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
});

export default router;
