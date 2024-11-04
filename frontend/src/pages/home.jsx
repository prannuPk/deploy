import React, { useContext, useState } from "react";
import withAuth from "../utils/withAuth";
import { useNavigate } from "react-router-dom";
import "../App.css";
import { Button, IconButton, TextField } from "@mui/material";
import RestoreIcon from "@mui/icons-material/Restore";
import { AuthContext } from "../contexts/AuthContext";
import { useSocket } from "../contexts/SocketContext"; // Make sure to create this context for socket management

function HomeComponent() {
  let navigate = useNavigate();
  const [meetingCode, setMeetingCode] = useState("");
  const [password, setPassword] = useState("");
  const { addToUserHistory } = useContext(AuthContext);
  const socket = useSocket(); // Use the socket context to manage socket connections

  const handleJoinVideoCall = async () => {
    // Emit the join-meeting event to the server
    socket.emit("join-meeting", { meetingCode, password });

    socket.on("join-failed", (message) => {
      alert(message); // Handle join failure
    });

    socket.on("user-joined", (userId, connections) => {
      // Handle successful join, navigate to video call page
      navigate(`/${meetingCode}`);
    });
  };

  const handleCreateMeeting = async () => {
    const meetingPassword = prompt("Please set a password for the meeting:");
    if (!meetingPassword) return; // If no password is set, return

    // Save the meeting with the password to the database (you need to create this endpoint)
    const response = await fetch("/api/meetings/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`, // Pass the token if needed
      },
      body: JSON.stringify({ meetingCode, password: meetingPassword }),
    });

    if (response.ok) {
      alert("Meeting created successfully!");
      navigate(`/${meetingCode}`);
    } else {
      alert("Error creating meeting.");
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
                id="outlined-basic"
                label="Meeting Code"
                variant="outlined"
              />
              <TextField
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                id="outlined-password"
                label="Password"
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
          <img srcSet="/logo3.png" alt="" />
        </div>
      </div>
    </>
  );
}

export default withAuth(HomeComponent);
