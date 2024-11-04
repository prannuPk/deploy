import { Server } from "socket.io";
import { Meeting } from "../models/meeting.model.js"; // Import Meeting model

let connections = {};
let messages = {};
let timeOnline = {};

export const connectToSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      allowedHeaders: ["*"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("SOMETHING CONNECTED");

    // New event for joining a meeting with validation
    socket.on("join-meeting", async ({ meetingCode, password }) => {
      try {
        const meeting = await Meeting.findOne({ meetingCode });
        if (!meeting) {
          return socket.emit("join-failed", "Meeting not found");
        }

        const isPasswordCorrect = await bcrypt.compare(
          password,
          meeting.password
        );
        if (!isPasswordCorrect) {
          return socket.emit("join-failed", "Invalid password");
        }

        // Proceed to join the meeting if password is valid
        if (connections[meetingCode] === undefined) {
          connections[meetingCode] = [];
        }
        connections[meetingCode].push(socket.id);

        timeOnline[socket.id] = new Date();

        for (let a = 0; a < connections[meetingCode].length; a++) {
          io.to(connections[meetingCode][a]).emit(
            "user-joined",
            socket.id,
            connections[meetingCode]
          );
        }

        if (messages[meetingCode] !== undefined) {
          for (let a = 0; a < messages[meetingCode].length; ++a) {
            io.to(socket.id).emit(
              "chat-message",
              messages[meetingCode][a]["data"],
              messages[meetingCode][a]["sender"],
              messages[meetingCode][a]["socket-id-sender"]
            );
          }
        }
      } catch (error) {
        console.error(error);
        socket.emit("join-failed", "Error joining meeting");
      }
    });

    socket.on("signal", (toId, message) => {
      io.to(toId).emit("signal", socket.id, message);
    });

    socket.on("chat-message", (data, sender) => {
      const [matchingRoom, found] = Object.entries(connections).reduce(
        ([room, isFound], [roomKey, roomValue]) => {
          if (!isFound && roomValue.includes(socket.id)) {
            return [roomKey, true];
          }
          return [room, isFound];
        },
        ["", false]
      );

      if (found === true) {
        if (messages[matchingRoom] === undefined) {
          messages[matchingRoom] = [];
        }

        messages[matchingRoom].push({
          sender: sender,
          data: data,
          "socket-id-sender": socket.id,
        });
        console.log("message", matchingRoom, ":", sender, data);

        connections[matchingRoom].forEach((elem) => {
          io.to(elem).emit("chat-message", data, sender, socket.id);
        });
      }
    });

    socket.on("disconnect", () => {
      var diffTime = Math.abs(timeOnline[socket.id] - new Date());
      var key;

      for (const [k, v] of JSON.parse(
        JSON.stringify(Object.entries(connections))
      )) {
        for (let a = 0; a < v.length; ++a) {
          if (v[a] === socket.id) {
            key = k;
            for (let a = 0; a < connections[key].length; ++a) {
              io.to(connections[key][a]).emit("user-left", socket.id);
            }

            var index = connections[key].indexOf(socket.id);
            connections[key].splice(index, 1);

            if (connections[key].length === 0) {
              delete connections[key];
            }
          }
        }
      }
    });
  });

  return io;
};
