import { createContext, useContext, useEffect, useState } from "react";
import io from "socket.io-client";
import server from "../environment";

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [scheduledMeetings, setScheduledMeetings] = useState([]);
  const socket = io(server);

  useEffect(() => {
    socket.on("connect", () => {
      console.log("Connected to WebSocket");
    });

    socket.on("message", (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    socket.on("meeting-scheduled", (meeting) => {
      setScheduledMeetings(prev => [...prev, meeting]);
    });

    socket.on("scheduled-meetings-list", (meetings) => {
      setScheduledMeetings(meetings);
    });

    socket.on("meeting-cancelled", ({ meetingCode }) => {
      setScheduledMeetings(prev => 
        prev.filter(meeting => meeting.meetingCode !== meetingCode)
      );
    });

    socket.on("scheduling-error", ({ message }) => {
      console.error("Scheduling error:", message);
      alert(message); // Alert user of scheduling error
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from WebSocket");
    });

    return () => {
      socket.disconnect();
    };
  }, [socket]);

  const scheduleMeeting = (meetingDetails) => {
    socket.emit("schedule-meeting", meetingDetails, (response) => {
      if (response.error) {
        console.error("Error scheduling meeting:", response.error);
        alert(response.error); // Alert user of scheduling error
      } else {
        console.log("Meeting scheduled successfully:", response);
      }
    });
  };

  const getScheduledMeetings = () => {
    socket.emit("get-scheduled-meetings", (response) => {
      if (response.error) {
        console.error("Error fetching scheduled meetings:", response.error);
        alert(response.error); // Alert user of fetching error
      } else {
        setScheduledMeetings(response.meetings);
      }
    });
  };

  const cancelScheduledMeeting = (meetingCode) => {
    socket.emit("cancel-scheduled-meeting", { meetingCode }, (response) => {
      if (response.error) {
        console.error("Error cancelling meeting:", response.error);
        alert(response.error); // Alert user of cancellation error
      } else {
        console.log("Meeting cancelled successfully:", response);
      }
    });
  };

  const data = {
    messages,
    scheduledMeetings,
    scheduleMeeting,
    getScheduledMeetings,
    cancelScheduledMeeting,
  };

  return <SocketContext.Provider value={data}>{children}</SocketContext.Provider>;
};
