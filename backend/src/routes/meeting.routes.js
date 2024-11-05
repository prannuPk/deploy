import express from 'express';
import { Meeting } from '../models/meeting.model.js'; // Ensure correct import of Meeting model

const router = express.Router();

// Join Meeting Route
router.post('/join_meeting', async (req, res) => {
    const { meetingCode, password } = req.body;
    console.log("Incoming request:", req.body); // Check incoming request

    try {
        // Make sure the field name here matches your model
        const meeting = await Meeting.findOne({ meetingCode });

        if (!meeting) {
            return res.status(404).json({ message: "Meeting not found" });
        }

        // If passwords are hashed, compare using bcrypt
        if (meeting.password !== password) {
            return res.status(401).json({ message: "Incorrect password" });
        }

        return res.status(200).json({ message: "Successfully joined meeting", meetingCode });
    } catch (error) {
        console.error("Error joining meeting:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
});

export default router;
