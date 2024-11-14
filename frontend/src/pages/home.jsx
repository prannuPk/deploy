import React, { useContext, useState, useEffect } from "react";
import withAuth from "../utils/withAuth";
import { useNavigate } from "react-router-dom";
import "../App.css";
import { 
  Button, 
  IconButton, 
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography
} from "@mui/material";
import RestoreIcon from "@mui/icons-material/Restore";
import ScheduleIcon from '@mui/icons-material/Schedule';
import { AuthContext } from "../contexts/AuthContext";
import { useSocket } from "../contexts/SocketContext";
import server from '../environment';

function HomeComponent() {
    const navigate = useNavigate();
    const [meetingCode, setMeetingCode] = useState("");
    const { addToUser History, userData } = useContext(AuthContext);
    const { scheduledMeetings, scheduleMeeting, getScheduledMeetings, cancelScheduledMeeting } = useSocket();
    const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
    const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().slice(0, 16)); // Default to current date and time
    const [meetingTitle, setMeetingTitle] = useState("");
    const [showScheduledMeetings, setShowScheduledMeetings] = useState(false);

    useEffect(() => {
      if (userData?.userId) {
        getScheduledMeetings(userData.userId);
      }
    }, [userData]);

    // Existing instant meeting functions remain unchanged
    const handleCreateMeeting = async () => {
        const password = prompt("Please set a password for the meeting:");
        if (!password) return;

        try {
            const response = await fetch("/api/add_to_activity", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({ meeting_code: meetingCode, password }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                alert("Error creating meeting: " + errorText);
                return;
            }

            await addToUser History(meetingCode, password);
            alert("Meeting created successfully!");
        } catch (error) {
            console.error("Error creating meeting:", error);
            alert("Unable to create the meeting at this time.");
        }
    };

    const handleJoinVideoCall = async () => {
        if (!meetingCode) {
            alert("Please enter a meeting code.");
            return;
        }

        const password = prompt("Please enter the meeting password:");
        if (!password) return;

        try {
            const response = await fetch(`${server}/api/v1/meetings/join_meeting`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({ 
                    meetingCode: meetingCode,
                    password: password 
                }),
            });

            const data = await response.json();

            if (response.status === 401) {
                alert(data.message || "Incorrect password. Please try again.");
                return;
            }

            if (response.status === 404) {
                alert(data.message || "Meeting not found. Please check the meeting code.");
                return;
            }

            if (!response.ok) {
                alert(data.message || "An error occurred. Please try again.");
                return;
            }

            alert("Joined meeting successfully!");
            navigate(`/${meetingCode}`);

        } catch (error) {
            console.error("Error joining meeting:", error);
            alert("Unable to join the meeting. Please try again later.");
        }
    };

    // New scheduling functions
    const handleScheduleMeeting = () => {
        if (!meetingTitle) {
            alert("Please enter a meeting title");
            return;
        }

        const password = prompt("Please set a password for the scheduled meeting:");
        if (!password) return;

        const meetingDetails = {
            meetingCode: Math.random().toString(36).substring(2, 8),
            password,
            scheduledDateTime: scheduleDate,
            scheduledTitle: meetingTitle };

        scheduleMeeting(meetingDetails);
        setIsScheduleDialogOpen(false);
        setMeetingTitle("");
        setScheduleDate(new Date().toISOString().slice(0, 16)); // Reset to current date and time
    };

    return (
        <div className="home-container">
            <h1>Welcome to the Meeting Scheduler</h1>
            <TextField
                label="Meeting Code"
                value={meetingCode}
                onChange={(e) => setMeetingCode(e.target.value)}
            />
            <Button onClick={handleJoinVideoCall} variant="contained" color="primary">
                Join Meeting
            </Button>
            <IconButton onClick={() => setIsScheduleDialogOpen(true)}>
                <ScheduleIcon />
            </IconButton>
            <Dialog open={isScheduleDialogOpen} onClose={() => setIsScheduleDialogOpen(false)}>
                <DialogTitle>Schedule a Meeting</DialogTitle>
                <DialogContent>
                    <TextField
                        label="Meeting Title"
                        value={meetingTitle}
                        onChange={(e) => setMeetingTitle(e.target.value)}
                    />
                    <TextField
                        label="Schedule Date and Time"
                        type="datetime-local"
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsScheduleDialogOpen(false)} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleScheduleMeeting} color="primary">
                        Schedule
                    </Button>
                </DialogActions>
            </Dialog>
            {/* Render scheduled meetings if needed */}
        </div>
    );
}

export default withAuth(HomeComponent);
