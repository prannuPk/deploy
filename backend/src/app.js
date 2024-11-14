import express from "express";
import { createServer } from "node:http";
import mongoose from "mongoose";
import cors from "cors";
import userRoutes from "./routes/users.routes.js";
import meetingRoutes from "./routes/meeting.routes.js";
import { connectToSocket } from "./controllers/socketManager.js";
import { startScheduler } from "./controllers/schedulerService.js";

const app = express();
const server = createServer(app);

// Configure CORS for Express
const corsOptions = {
    origin: ['https://deploy-a862.onrender.com', 'http://localhost:3000'],
    methods: 'GET, POST, PUT, DELETE',
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

// Routes
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/meetings", meetingRoutes);

// Configure Socket.IO
const io = connectToSocket(server, {
    cors: {
        origin: 'https://deploy-a862.onrender.com',
        methods: ["GET", "POST"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

app.set("port", process.env.PORT || 8000);

const start = async () => {
   try {
      const connectionDb = await mongoose.connect(
         "mongodb+srv://yeetboy1218:Prannu1218@cluster0.zahon.mongodb.net/"
      );
      console.log(`MONGO Connected DB Host: ${connectionDb.connection.host}`);
      
      // Start the scheduler after database connection
      startScheduler();
      console.log('Meeting scheduler service started');
      
      server.listen(app.get("port"), () => {
         console.log(`Server is listening on port ${app.get("port")}`);
      });

      // Graceful shutdown handlers
      process.on('SIGTERM', gracefulShutdown);
      process.on('SIGINT', gracefulShutdown);

   } catch (error) {
      console.error("Error connecting to the database:", error);
      process.exit(1);
   }
};

// Graceful shutdown function
const gracefulShutdown = async () => {
    try {
        console.log('Starting graceful shutdown...');
        
        // Close database connection
        await mongoose.connection.close();
        console.log('Database connection closed.');
        
        // Close server
        server.close(() => {
            console.log('Server closed.');
            process.exit(0);
        });
        
        // Force close after 10 seconds
        setTimeout(() => {
            console.error('Could not close connections in time, forcefully shutting down');
            process.exit(1);
        }, 10000);
        
    } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
    }
};

start();
