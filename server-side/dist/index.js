import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import express from "express";
import db from "./config/databaseConfig.js";
import logger from "./utils/logger.js";
import { createServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import authRouter from "./routes/authRoutes.js";
import gameRouter from "./routes/gameRoutes.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "../../.env") });
class StartUpServer {
    app;
    server;
    io;
    port;
    constructor() {
        this.app = express();
        this.server = createServer(this.app);
        this.io = new Server(this.server, {
            cors: {
                origin: "http://localhost:3001",
                methods: ["GET", "POST"],
            },
        });
        this.port = process.env.PORT || 3000;
    }
    setupMiddleware() {
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        this.app.use((req, res, next) => {
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
            if (req.method === "OPTIONS") {
                res.sendStatus(200);
            }
            else {
                next();
            }
        });
    }
    setupRoutes() {
        this.app.get("/health", (req, res) => {
            res.json({
                success: true,
                message: "Server is running",
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
            });
        });
        this.app.use("/api/auth", authRouter);
        this.app.use("/api/game", gameRouter);
        this.app.use("*", (req, res) => {
            res.status(404).json({
                success: false,
                message: "Route not found",
            });
        });
    }
    setupErrorHandling() {
        this.app.use((error, req, res, next) => {
            logger.error("Unhandled error:", error);
            res.status(500).json({
                success: false,
                message: error.message || "Internal server error",
            });
        });
    }
    setupSocketIO() {
        this.io.on("connection", (socket) => {
            logger.info("Client connected:", socket.id);
            socket.on("authenticate", (token) => {
                try {
                    const decoded = jwt.verify(token, process.env.JWT_SECRET);
                    socket.userId = decoded.userId;
                    socket.join(`user_${decoded.userId}`);
                    logger.info("Socket authenticated for user:", decoded.userId);
                }
                catch (error) {
                    logger.error("Socket authentication failed:", error);
                    socket.emit("auth_error", { message: "Authentication failed" });
                }
            });
            socket.on("join_game_room", () => {
                socket.join("game_room");
                logger.info("Client joined game room:", socket.id);
            });
            socket.on("leave_game_room", () => {
                socket.leave("game_room");
                logger.info("Client left game room:", socket.id);
            });
            socket.on("disconnect", () => {
                logger.info("Client disconnected:", socket.id);
            });
        });
        global.io = this.io;
    }
    async initialize() {
        logger.info('DB Conneccccccction Info:', {
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            database: process.env.DB_NAME,
            user: process.env.DB_USER,
        });
        try {
            await db.connect();
            logger.info("Database connected successfully");
            this.setupMiddleware();
            this.setupRoutes();
            this.setupErrorHandling();
            this.setupSocketIO();
            logger.info("Server initialized successfully");
        }
        catch (error) {
            logger.error("Server initialization failed:", error);
            process.exit(1);
        }
    }
    start() {
        this.server.listen(this.port, () => {
            logger.info(`Server is running on port ${this.port}`);
            logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
        });
    }
    async disconnect() {
        logger.info("Server disconnecting...");
        try {
            await db.close();
            this.server.close(() => {
                logger.info("Server Closed");
                process.exit(0);
            });
        }
        catch (error) {
            logger.error("Error during disconnection", error);
            process.exit(1);
        }
    }
}
const server = new StartUpServer();
process.on("SIGTERM", () => server.disconnect());
process.on("SIGINT", () => server.disconnect());
process.on("uncaughtException", (error) => {
    logger.error("Uncaught Exception:", error);
    process.exit(1);
});
process.on("unhandledRejection", (reason, promise) => {
    logger.error("Unhandled Rejection at:", promise, "reason:", reason);
    process.exit(1);
});
server.initialize().then(() => {
    server.start();
});
//# sourceMappingURL=index.js.map