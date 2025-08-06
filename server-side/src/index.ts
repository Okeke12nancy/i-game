import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import express, { Request, Response, NextFunction } from "express";
import logger from "./utils/logger.js";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import authRouter from "./routes/authRoutes.js";
import gameRouter from "./routes/gameRoutes.js";
import gameService from "./service/gameService.js";
import session from "express-session";
import { AuthenticatedSocket } from "./types/index.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import "./config/supabaseConfig.js";

dotenv.config({ path: join(__dirname, "../../.env") });


declare global {
  var io: Server;
}

class StartUpServer {
  private app: express.Application;
  private server: ReturnType<typeof createServer>;
  private io: Server;
  private port: string | number;

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.io = new Server(this.server, {
      cors: {
        origin: process.env.CLIENT_URL,
        methods: ["GET", "POST"],
      },
    });
    this.port = process.env.PORT || 3000;
  }

  setupMiddleware(): void {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    this.app.use((req: Request, res: Response, next: NextFunction) => {
      res.header("Access-Control-Allow-Origin", "*");
      res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS"
      );
      res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization"
      );
      if (req.method === "OPTIONS") {
        res.sendStatus(200);
      } else {
        next();
      }
    });
  }

  setupRoutes(): void {
    this.app.get("/health", (req: Request, res: Response) => {
      res.json({
        success: true,
        message: "Server is running",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      });
    });

    this.app.use("/api/auth", authRouter);
    this.app.use("/api/game", gameRouter);

    this.app.use("*", (req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        message: "Route not found",
      });
    });
  }

  setupErrorHandling(): void {
    this.app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
      logger.error("Unhandled error:", error);

      res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    });
  }

  setupSocketIO(): void {
    this.io.on("connection", (socket: AuthenticatedSocket) => {
      logger.info("Client connected:", socket.id);

      socket.on("authenticate", (token: string) => {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };
          socket.userId = decoded.userId;
          socket.join(`user_${decoded.userId}`);
          logger.info("Socket authenticated for user:", decoded.userId);
        } catch (error) {
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

  async initialize(): Promise<void> {
    
    
    try {
      logger.info("Database connected successfully");

      this.setupMiddleware();
      this.setupRoutes();
      this.setupErrorHandling();
      this.setupSocketIO();

      logger.info("Server initialized successfully");
    } catch (error) {
      logger.error("Server initialization failed:", error);
      process.exit(1);
    }
  }

  start(): void {
    this.server.listen(this.port, () => {
      logger.info(`Server is running on port ${this.port}`);
      logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
    });
  }

  async disconnect(): Promise<void> {
    logger.info("Server disconnecting...");

    try {
      this.server.close(() => {
        logger.info("Server Closed");
        process.exit(0);
      });
    } catch (error) {
      logger.error("Error during disconnection", error);
      process.exit(1);
    }
  }
}

const server = new StartUpServer();

process.on("SIGTERM", () => server.disconnect());
process.on("SIGINT", () => server.disconnect());

process.on("uncaughtException", (error: Error) => {
  logger.error("Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason: any, promise: Promise<any>) => {
  logger.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

server.initialize().then(() => {
  server.start();
}); 