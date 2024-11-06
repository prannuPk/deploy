import React, { useContext, useState } from "react";
import withAuth from "../utils/withAuth";
import { useNavigate } from "react-router-dom";
import "../App.css";
import { Button, IconButton, TextField } from "@mui/material";
import RestoreIcon from "@mui/icons-material/Restore";
import { AuthContext } from "../contexts/AuthContext";
import { useSocket } from "../contexts/SocketContext";
import server from '../environment';

function HomeComponent() {
    const navigate = useNavigate();
    const [meetingCode, setMeetingCode] = useState("");
    const { addToUserHistory } = useContext(AuthContext);
    const socket = useSocket();

 // In home.jsx, update handleCreateMeeting:
const handleCreateMeeting = async () => {
    const password = prompt("Please set a password for the meeting:");
    if (!password) return;

    try {
        const response = await fetch("/api/v1/meetings/create", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({
                meetingCode,
                password,
                userId: localStorage.getItem("userId") // Make sure you store this during login
            }),
        });

        const data = await response.json();

        if (!data.success) {
            alert(data.message);
            return;
        }

        alert("Meeting created successfully!");
        await addToUserHistory(meetingCode, password);
    } catch (error) {
        console.error("Error creating meeting:", error);
        alert("Unable to create the meeting at this time.");
    }
};

// Update handleJoinVideoCall:
const handleJoinVideoCall = async () => {
  if (!meetingCode) {
    alert("Please enter a meeting code.");
    return;
  }

  const password = prompt("Please enter the meeting password:");
  if (!password) return;

  try {
    const response = await fetch("/api/v1/meetings/join_meeting", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ meetingCode, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message);
      return;
    }

    alert("Joined meeting successfully!");
    navigate(`/${meetingCode}`);
  } catch (error) {
    console.error("Error joining meeting:", error);
    alert("Unable to join the meeting at this time.");
  }
};

    return (
        <>
            <div className="navBar">
                <div style={{ display: "flex", alignItems: "center" }}>
                    <h2>LinkUp</h2>
                </div>
                <div style={{ display: "flex", alignItems: "center" }}>
                    <IconButton onClick={() => navigate("/history")}>
                        <RestoreIcon />
                    </IconButton>
                    <p>History</p>
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
                    <div>
                        <h2>Providing Quality Video Call Just Like Quality Education</h2>
                        <div style={{ display: "flex", gap: "10px" }}>
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
                    </div>
                </div>
                <div className="rightPanel">
          <img src="/logo3.png" alt="" />
        </div>
            </div>
        </>
    );
}

export default withAuth(HomeComponent);
