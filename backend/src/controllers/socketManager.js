import { Server } from "socket.io";
import bcrypt from "bcrypt"; // Ensure bcrypt is imported
import { Meeting } from "../models/meeting.model.js";

let connections = {};
let messages = {};
let timeOnline = {};

export const connectToSocket = (server) => {
 const io = new Server(server, {
  cors: {
    origin: "https://deploy-a862.onrender.com", // Replace with your actual frontend URL
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  },
  path: "/socket.io", // Ensure the path matches the frontend
  transports: ["websocket", "polling"], // Allows both WebSocket and polling as a fallback
});


  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);
    socket.on("schedule-meeting", async ({ meetingCode, password, scheduledDateTime, scheduledTitle }) => {
      try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const meeting = new Meeting({
          meetingCode,
          password: hashedPassword,
          isScheduled: true,
          scheduledDateTime: new Date(scheduledDateTime),
          scheduledTitle,
          status: 'pending',
          user_id: socket.user_id // Assuming you're passing user_id with socket connection
        });

        await meeting.save();
        socket.emit("meeting-scheduled", { 
          meetingCode: meeting.meetingCode,
          scheduledDateTime: meeting.scheduledDateTime,
          scheduledTitle: meeting.scheduledTitle 
        });
      } catch (error) {
        console.error("Scheduling error:", error);
        socket.emit("scheduling-error", { message: error.message });
      }
    });

    // Add event to fetch scheduled meetings
    socket.on("get-scheduled-meetings", async (userId) => {
      try {
        const scheduledMeetings = await Meeting.find({
          user_id: userId,
          isScheduled: true,
          status: { $in: ['pending', 'active'] }
        }).sort({ scheduledDateTime: 1 });
        
        socket.emit("scheduled-meetings-list", scheduledMeetings);
      } catch (error) {
        console.error("Error fetching scheduled meetings:", error);
        socket.emit("scheduling-error", { message: error.message });
      }
    });

    // Add event to cancel scheduled meeting
    socket.on("cancel-scheduled-meeting", async ({ meetingCode, userId }) => {
      try {
        const meeting = await Meeting.findOne({ 
          meetingCode, 
          user_id: userId,
          isScheduled: true,
          status: 'pending'
        });

        if (meeting) {
          meeting.status = 'cancelled';
          await meeting.save();
          socket.emit("meeting-cancelled", { meetingCode });
        } else {
          socket.emit("scheduling-error", { message: "Meeting not found or cannot be cancelled" });
        }
      } catch (error) {
        console.error("Error cancelling meeting:", error);
        socket.emit("scheduling-error", { message: error.message });
      }
    });


    // Event for joining a meeting with password validation
    socket.on("join-meeting", async ({ meetingCode, password }) => {
      try {
        const meeting = await Meeting.findOne({ meetingCode });
        if (!meeting) {
          return socket.emit("join-failed", "Meeting not found");
        }

        const isPasswordCorrect = await bcrypt.compare(password, meeting.password);
        if (!isPasswordCorrect) {
          return socket.emit("join-failed", "Invalid password");
        }

        // Add user to the meeting if password is valid
        if (!connections[meetingCode]) {
          connections[meetingCode] = [];
        }
        connections[meetingCode].push(socket.id);
        timeOnline[socket.id] = new Date();

        // Notify other users in the meeting about the new connection
        connections[meetingCode].forEach((connId) => {
          io.to(connId).emit("user-joined", socket.id, connections[meetingCode]);
        });

        // Send existing messages to the new participant
        if (messages[meetingCode]) {
          messages[meetingCode].forEach((msg) => {
            io.to(socket.id).emit("chat-message", msg.data, msg.sender, msg["socket-id-sender"]);
          });
        }
      } catch (error) {
        console.error("Error during join-meeting:", error);
        socket.emit("join-failed", "Error joining meeting");
      }
    });

    // Handle signaling for WebRTC
    socket.on("signal", (toId, message) => {
      io.to(toId).emit("signal", socket.id, message);
    });

    // Handle chat messages
    socket.on("chat-message", (data, sender) => {
      const room = Object.keys(connections).find((key) => connections[key].includes(socket.id));

      if (room) {
        if (!messages[room]) {
          messages[room] = [];
        }
        messages[room].push({
          sender,
          data,
          "socket-id-sender": socket.id,
        });

        connections[room].forEach((connId) => {
          io.to(connId).emit("chat-message", data, sender, socket.id);
        });
      }
    });

    // Handle disconnections
    socket.on("disconnect", () => {
      const disconnectedTime = Math.abs(timeOnline[socket.id] - new Date());
      for (const [room, connIds] of Object.entries(connections)) {
        if (connIds.includes(socket.id)) {
          connIds.forEach((connId) => io.to(connId).emit("user-left", socket.id));

          // Remove user from room
          connections[room] = connIds.filter((id) => id !== socket.id);
          if (connections[room].length === 0) {
            delete connections[room];
          }
          break;
        }
      }
      delete timeOnline[socket.id];
    });
  });

  return io;
};
