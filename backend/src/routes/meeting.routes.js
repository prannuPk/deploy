import express from 'express';
import { Meeting } from '../models/meeting.model.js';
import bcrypt from 'bcrypt';

const router = express.Router();

// Join Meeting Route
router.post('/join_meeting', async (req, res) => {
    const { meetingCode, password } = req.body;
    
    if (!meetingCode || !password) {
        return res.status(400).json({ 
            message: "Meeting code and password are required" 
        });
    }

    try {
        // Find the meeting
        const meeting = await Meeting.findOne({ meetingCode });

        if (!meeting) {
            return res.status(404).json({ 
                message: "Meeting not found",
                success: false 
            });
        }

        // Check if password exists in meeting document
        if (!meeting.password) {
            return res.status(500).json({ 
                message: "Meeting password not set properly",
                success: false 
            });
        }

        // Compare passwords
        const isPasswordValid = await bcrypt.compare(password, meeting.password);
        
        if (!isPasswordValid) {
            console.log("Password verification failed for meeting:", meetingCode);
            return res.status(401).json({ 
                message: "Incorrect password",
                success: false 
            });
        }

        // If we get here, password is correct
        return res.status(200).json({ 
            message: "Successfully joined meeting",
            success: true,
            meetingCode: meeting.meetingCode 
        });

    } catch (error) {
        console.error("Error in join_meeting route:", error);
        return res.status(500).json({ 
            message: "Internal server error",
            success: false 
        });
    }
});

export default router;
