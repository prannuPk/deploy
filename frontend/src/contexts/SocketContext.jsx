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
      alert(message);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from WebSocket");
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const scheduleMeeting = (meetingDetails) => {
    socket.emit("schedule-meeting", meetingDetails);
  };

  const getScheduledMeetings = (userId) => {
    socket.emit("get-scheduled-meetings", userId);
  };

  const cancelScheduledMeeting = (meetingCode, userId) => {
    socket.emit("cancel-scheduled-meeting", { meetingCode, userId });
  };

  const sendMessage = (message) => {
    socket.emit("message", message);
  };

  const data = {
    messages,
    sendMessage,
    scheduledMeetings,
    scheduleMeeting,
    getScheduledMeetings,
    cancelScheduledMeeting,
  };

  return (
    <SocketContext.Provider value={data}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => {
  return useContext(SocketContext);
};
