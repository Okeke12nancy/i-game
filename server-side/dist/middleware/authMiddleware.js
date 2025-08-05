import jwt from "jsonwebtoken";
import User from "../models/UserModel.js";
import logger from "../utils/logger.js";
import PlayerSession from "../models/gamePlayer.js";
import dotenv from "dotenv";
dotenv.config();
class AuthMiddleware {
    async authMiddlewares(req, res, next) {
        try {
            const authHeader = req.headers["authorization"];
            const token = authHeader && authHeader.split(" ")[1];
            if (!token) {
                res.status(401).json({
                    success: false,
                    message: "Access token required",
                });
                return;
            }
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.userId);
            if (!user) {
                res.status(401).json({
                    success: false,
                    message: "Invalid token",
                });
                return;
            }
            req.user = user.toJSON();
            req.userId = user.id;
            next();
        }
        catch (error) {
            logger.error("Authentication error", error);
            if (error.name === "JsonWebTokenError") {
                res.status(401).json({
                    success: false,
                    message: "Invalid token",
                });
                return;
            }
            if (error.name === "TokenExpiredError") {
                res.status(401).json({
                    success: false,
                    message: "Token expired",
                });
                return;
            }
            res.status(500).json({
                success: false,
                message: "Authentication failed",
            });
        }
    }
    generateToken(userId) {
        const secret = process.env.JWT_SECRET ?? "default_secret";
        const expiresIn = process.env.JWT_EXPIRES_IN ?? "48h";
        return jwt.sign({ userId }, secret, { expiresIn });
    }
    async checkoutActiveSession(req, res, next) {
        try {
            if (!req.user?.id) {
                res.status(401).json({
                    success: false,
                    message: "User not authenticated",
                });
                return;
            }
            const activeSession = await PlayerSession.getUserActiveSession(req.user.id);
            if (activeSession) {
                res.status(400).json({
                    success: false,
                    message: "User already has an active session",
                });
                return;
            }
            next();
        }
        catch (error) {
            logger.error("Check active session error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to check active session",
            });
        }
    }
}
export default new AuthMiddleware();
//# sourceMappingURL=authMiddleware.js.map