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
  FormControlLabel,
  Switch,
  Typography
} from "@mui/material";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import RestoreIcon from "@mui/icons-material/Restore";
import ScheduleIcon from '@mui/icons-material/Schedule';
import { AuthContext } from "../contexts/AuthContext";
import { useSocket } from "../contexts/SocketContext";
import server from '../environment';

function HomeComponent() {
    const navigate = useNavigate();
    const [meetingCode, setMeetingCode] = useState("");
    const { addToUserHistory, userData } = useContext(AuthContext);
    const { scheduledMeetings, scheduleMeeting, getScheduledMeetings, cancelScheduledMeeting } = useSocket();
    const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
    const [scheduleDate, setScheduleDate] = useState(new Date());
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

            await addToUserHistory(meetingCode, password);
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
            scheduledDateTime: scheduleDate.toISOString(),
            scheduledTitle: meetingTitle,
            userId: userData?.userId
        };

        scheduleMeeting(meetingDetails);
        setIsScheduleDialogOpen(false);
        setMeetingTitle("");
    };

    const handleCancelMeeting = (meetingCode) => {
        if (window.confirm("Are you sure you want to cancel this meeting?")) {
            cancelScheduledMeeting(meetingCode, userData?.userId);
        }
    };

    return (
        <>
            <div className="navBar">
                <div style={{ display: "flex", alignItems: "center" }}>
                    <h2>LinkUp</h2>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                    <IconButton onClick={() => navigate("/history")}>
                        <RestoreIcon />
                    </IconButton>
                    <IconButton onClick={() => setShowScheduledMeetings(!showScheduledMeetings)}>
                        <ScheduleIcon />
                    </IconButton>
                    <Button
                        onClick={() => {
                            localStorage.removeItem("token");
                            navigate("/auth");
                        }}
                    >
                        Logout
                    </Button>
                </div>
            </div>

            <div className="meetContainer">
                <div className="leftPanel">
                    {!showScheduledMeetings ? (
                        <div>
                            <h2>Providing Quality Video Call Just Like Quality Education</h2>
                            <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
                                <TextField
                                    onChange={(e) => setMeetingCode(e.target.value)}
                                    label="Meeting Code"
                                    variant="outlined"
                                />
                                <Button onClick={handleJoinVideoCall} variant="contained">
                                    Join
                                </Button>
                                <Button onClick={handleCreateMeeting} variant="contained">
                                    Create Meeting
                                </Button>
                            </div>
                            <Button 
                                onClick={() => setIsScheduleDialogOpen(true)}
                                variant="outlined"
                                startIcon={<ScheduleIcon />}
                            >
                                Schedule Meeting
                            </Button>
                        </div>
                    ) : (
                        <div>
                            <h2>Scheduled Meetings</h2>
                            {scheduledMeetings.length === 0 ? (
                                <Typography>No scheduled meetings found</Typography>
                            ) : (
                                scheduledMeetings.map((meeting) => (
                                    <div key={meeting.meetingCode} style={{ 
                                        border: '1px solid #ddd', 
                                        padding: '15px',
                                        margin: '10px 0',
                                        borderRadius: '4px'
                                    }}>
                                        <Typography variant="h6">{meeting.scheduledTitle}</Typography>
                                        <Typography>
                                            {new Date(meeting.scheduledDateTime).toLocaleString('en-IN', { 
                                                timeZone: 'Asia/Kolkata'
                                            })}
                                        </Typography>
                                        <Typography>Code: {meeting.meetingCode}</Typography>
                                        <Button 
                                            onClick={() => handleCancelMeeting(meeting.meetingCode)}
                                            color="error"
                                            variant="outlined"
                                            size="small"
                                            style={{ marginTop: '10px' }}
                                        >
                                            Cancel Meeting
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
                <div className="rightPanel">
                    <img src="/logo3.png" alt="" />
                </div>
            </div>

            {/* Schedule Meeting Dialog */}
            <Dialog open={isScheduleDialogOpen} onClose={() => setIsScheduleDialogOpen(false)}>
                <DialogTitle>Schedule New Meeting</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Meeting Title"
                        fullWidth
                        variant="outlined"
                        value={meetingTitle}
                        onChange={(e) => setMeetingTitle(e.target.value)}
                        style={{ marginBottom: '20px' }}
                    />
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DateTimePicker
                            label="Meeting Date & Time (IST)"
                            value={scheduleDate}
                            onChange={(newValue) => setScheduleDate(newValue)}
                            format="dd/MM/yyyy hh:mm a"
                            minDateTime={new Date()}
                        />
                    </LocalizationProvider>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsScheduleDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleScheduleMeeting} variant="contained">Schedule</Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

export default withAuth(HomeComponent);
