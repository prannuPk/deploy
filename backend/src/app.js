import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import { connectToSocket } from "./controllers/socketManager.js";
import cors from "cors";
import userRoutes from "./routes/users.routes.js";

const app = express();
const server = createServer(app);
const io = connectToSocket(server);

app.set("port", process.env.PORT || 8000);

const corsOptions = {
   origin: 'https://deploy-1-dxg9.onrender.com', 
   methods: 'GET, POST, PUT, DELETE',
   allowedHeaders: 'Content-Type, Authorization',
   credentials: true
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); 

app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));
app.use("/api/v1/users", userRoutes); 

const start = async () => {
   try {
      const connectionDb = await mongoose.connect(
         "mongodb+srv://praneethapkr1218:iompProject@cluster0.dakiq.mongodb.net/"
      );
      console.log(`MONGO Connected DB Host: ${connectionDb.connection.host}`);
      
      server.listen(app.get("port"), () => {
         console.log(`Listening on port ${app.get("port")}`);
      });
   } catch (error) {
      console.error("Error connecting to the database:", error);
   }
};

start();
