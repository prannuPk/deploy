import express from "express";
import { createServer } from "node:http";
import mongoose from "mongoose";
import cors from "cors";
import userRoutes from "./routes/users.routes.js";
import meetingRoutes from "./routes/meeting.routes.js"; // <-- Import the meeting routes
import { connectToSocket } from "./controllers/socketManager.js";

const app = express();
const server = createServer(app);
const io = connectToSocket(server);

app.set("port", process.env.PORT || 8000);

// Configure CORS for Express
const corsOptions = {
   origin: 'https://deploy-1-dxg9.onrender.com', // Frontend URL
   methods: 'GET, POST, PUT, DELETE',
   allowedHeaders: 'Content-Type, Authorization',
   credentials: true
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

// Define user-related routes
app.use("/api/v1/users", userRoutes);

// Define meeting-related routes
app.use("/api/v1/meetings", meetingRoutes); // <-- Add this line

// Connect to the database and start the server
const start = async () => {
   try {
      const connectionDb = await mongoose.connect(
         "mongodb+srv://praneethapkr1218:iompProject@cluster0.dakiq.mongodb.net/"
      );
      console.log(`MONGO Connected DB Host: ${connectionDb.connection.host}`);
      
      server.listen(app.get("port"), () => {
         console.log(`Server is listening on port ${app.get("port")}`);
      });
   } catch (error) {
      console.error("Error connecting to the database:", error);
   }
};

start();
