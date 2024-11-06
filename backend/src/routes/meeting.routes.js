// meeting.routes.js
import express from 'express';
import { Meeting } from '../models/meeting.model.js';
import bcrypt from 'bcrypt';

const router = express.Router();

// Create a new meeting
router.post('/create', async (req, res) => {
    const { meetingCode, password, userId } = req.body;

    try {
        // Check if meeting already exists
        const existingMeeting = await Meeting.findOne({ meetingCode });
        if (existingMeeting) {
            return res.status(400).json({ 
                success: false,
                message: "Meeting code already exists" 
            });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new meeting
        const newMeeting = new Meeting({
            user_id: userId,
            meetingCode,
            password: hashedPassword
        });

        await newMeeting.save();

        return res.status(201).json({
            success: true,
            message: "Meeting created successfully",
            meetingCode
        });
    } catch (error) {
        console.error("Error creating meeting:", error);
        return res.status(500).json({
            success: false,
            message: "Error creating meeting"
        });
    }
});

// Verify meeting password and join
router.post('/verify', async (req, res) => {
    const { meetingCode, password } = req.body;

    try {
        const meeting = await Meeting.findOne({ meetingCode });

        if (!meeting) {
            return res.status(404).json({
                success: false,
                message: "Meeting not found"
            });
        }

        const isPasswordValid = await bcrypt.compare(password, meeting.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Incorrect password"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Password verified successfully",
            meetingCode
        });
    } catch (error) {
        console.error("Error verifying meeting:", error);
        return res.status(500).json({
            success: false,
            message: "Error verifying meeting"
        });
    }
});

// Get meeting details (without password)
router.get('/:meetingCode', async (req, res) => {
    try {
        const meeting = await Meeting.findOne({ 
            meetingCode: req.params.meetingCode 
        }).select('-password'); // Exclude password from response

        if (!meeting) {
            return res.status(404).json({
                success: false,
                message: "Meeting not found"
            });
        }

        return res.status(200).json({
            success: true,
            meeting
        });
    } catch (error) {
        console.error("Error fetching meeting:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching meeting details"
        });
    }
});

export default router;
