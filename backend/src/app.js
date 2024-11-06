import express from "express";
import { createServer } from "node:http";
import mongoose from "mongoose";
import cors from "cors";
import userRoutes from "./routes/users.routes.js";
import meetingRoutes from "./routes/meeting.routes.js";
import { connectToSocket } from "./controllers/socketManager.js";

const app = express();
const server = createServer(app);

// Configure CORS for Express
const corsOptions = {
    origin: 'https://deploy-1-dxg9.onrender.com',
    methods: 'GET, POST, PUT, DELETE',
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};

// Use CORS middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Middleware to parse JSON and URL-encoded data
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

// Define API routes
app.use("/api", userRoutes); // Changed to match the frontend URL
app.use("/api/v1/meetings", meetingRoutes);

// Add a basic error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: "Internal server error",
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Add a route not found handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found"
    });
});

// Configure Socket.IO with CORS settings
const io = connectToSocket(server, {
    cors: {
        origin: 'https://deploy-1-dxg9.onrender.com',
        methods: ["GET", "POST"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true
    }
});

// Set the port
app.set("port", process.env.PORT || 8000);

// Connect to the database and start the server
const start = async () => {
    try {
        const connectionDb = await mongoose.connect(
            "mongodb+srv://praneethapkr1218:iompProject@cluster0.dakiq.mongodb.net/",
            {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            }
        );
        
        console.log(`MongoDB Connected: ${connectionDb.connection.host}`);
        
        server.listen(app.get("port"), () => {
            console.log(`Server is running on port ${app.get("port")}`);
            console.log(`API is available at http://localhost:${app.get("port")}/api`);
        });
    } catch (error) {
        console.error("Error starting server:", error);
        process.exit(1);
    }
};

// Add graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        mongoose.connection.close(false, () => {
            console.log('MongoDB connection closed');
            process.exit(0);
        });
    });
});

// Call the start function
start();
