import jwt from "jsonwebtoken";
import User from "../models/UserModel.js";
import logger from "../utils/logger.js";
import PlayerSession from "../models/gamePlayer.js";

class AuthMiddleware {
  async authMiddlewares(req, res, next) {
    try {
      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.split(" ")[1];

      if (!token) {
        return res.status(401).json({
          success: false,
          message: "Access token required",
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid token",
        });
      }

      req.user = user;
      req.userId = user.id;
      //   req.userId = user.id;
      next();
    } catch (error) {
      logger.error("Authentication error", error);

      if (error.name === "JsonWebTokenError") {
        return res.status(401).json({
          success: false,
          message: "Invalid token",
        });
      }

      if (error.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Token expired",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Authentication failed",
      });
    }
  }

  generateToken(userId) {
    return jwt.sign({ userId }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "48h",
    });
  }

  async checkoutActiveSession(req, res, next) {
    try {
      const activeSession = await PlayerSession.getUserActiveSession(
        req.user.id
      );

      if (activeSession) {
        return res.status(400).json({
          success: false,
          message: "User already has an active session",
        });
      }
      next();
    } catch (error) {
      logger.error("Check active session error:", error);
      return res.status(500).json({
        success: false,
        message: "Falied to check active session",
      });
    }
  }
}

export default new AuthMiddleware();
