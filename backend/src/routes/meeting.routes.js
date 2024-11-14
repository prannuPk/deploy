import express from 'express';
import { Meeting } from '../models/meeting.model.js';
import bcrypt from 'bcrypt';

const router = express.Router();

// Create scheduled meeting
router.post('/schedule', async (req, res) => {
    const { meetingCode, password, scheduledDateTime, scheduledTitle, userId } = req.body;
    
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const meeting = new Meeting({
            user_id: userId,
            meetingCode,
            password: hashedPassword,
            isScheduled: true,
            scheduledDateTime: new Date(scheduledDateTime),
            scheduledTitle,
            status: 'pending'
        });

        await meeting.save();
        res.status(201).json({
            success: true,
            meeting: {
                meetingCode: meeting.meetingCode,
                scheduledDateTime: meeting.scheduledDateTime,
                scheduledTitle: meeting.scheduledTitle,
                status: meeting.status
            }
        });
    } catch (error) {
        console.error("Error scheduling meeting:", error);
        res.status(500).json({
            success: false,
            message: "Failed to schedule meeting"
        });
    }
});

// Get all scheduled meetings for a user
router.get('/scheduled/:userId', async (req, res) => {
    try {
        const meetings = await Meeting.find({
            user_id: req.params.userId,
            isScheduled: true,
            status: { $in: ['pending', 'active'] }
        }).sort({ scheduledDateTime: 1 });

        res.json({
            success: true,
            meetings
        });
    } catch (error) {
        console.error("Error fetching scheduled meetings:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch scheduled meetings"
        });
    }
});

// Cancel scheduled meeting
router.put('/cancel/:meetingCode', async (req, res) => {
    const { userId } = req.body;
    
    try {
        const meeting = await Meeting.findOne({
            meetingCode: req.params.meetingCode,
            user_id: userId,
            isScheduled: true,
            status: 'pending'
        });

        if (!meeting) {
            return res.status(404).json({
                success: false,
                message: "Meeting not found or cannot be cancelled"
            });
        }

        meeting.status = 'cancelled';
        await meeting.save();

        res.json({
            success: true,
            message: "Meeting cancelled successfully"
        });
    } catch (error) {
        console.error("Error cancelling meeting:", error);
        res.status(500).json({
            success: false,
            message: "Failed to cancel meeting"
        });
    }
});

// Join Meeting Route (existing)
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

        // For scheduled meetings, check if they're active
        if (meeting.isScheduled && meeting.status !== 'active') {
            return res.status(400).json({
                message: meeting.status === 'pending' 
                    ? "This meeting hasn't started yet" 
                    : "This meeting has ended",
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
            meetingCode: meeting.meetingCode,
            isScheduled: meeting.isScheduled,
            scheduledTitle: meeting.scheduledTitle
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
