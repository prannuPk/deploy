// import express from 'express';
// import { Meeting } from '../models/meeting.model.js';
// import bcrypt from 'bcrypt';

// const router = express.Router();

// // Join Meeting Route
// router.post('/join_meeting', async (req, res) => {
//     const { meetingCode, password } = req.body;
//     console.log("Incoming request:", req.body);

//     try {
//         const meeting = await Meeting.findOne({ meetingCode });

//         if (!meeting) {
//             return res.status(404).json({ message: "Meeting not found" });
//         }

//         const passwordMatch = await bcrypt.compare(password, meeting.password);
//         if (!passwordMatch) {
//             return res.status(401).json({ message: "Incorrect password" });
//         }

//         return res.status(200).json({ message: "Successfully joined meeting", meetingCode });
//     } catch (error) {
//         console.error("Error joining meeting:", error);
//         return res.status(500).json({ message: "Internal server error" });
//     }
// });

// export default router;
