import User from "../models/UserModel.js";
import AuthMiddleware from "../middleware/authMiddleware.js";
import logger from "../utils/logger.js";
class AuthController {
    async register(req, res) {
        try {
            const { username, password } = req.body;
            const existingUser = await User.findByUsername(username);
            if (existingUser) {
                res.status(400).json({
                    success: false,
                    message: "Username already exists",
                });
                return;
            }
            const user = await User.create(username, password);
            const token = AuthMiddleware.generateToken(user.id);
            logger.info("User registered successfully:", { username: user.username });
            res.status(201).json({
                success: true,
                message: "User registered successfully",
                data: {
                    user: user.toJSON(),
                    token,
                },
            });
        }
        catch (error) {
            logger.error("Registration error:", error);
            res.status(500).json({
                success: false,
                message: "User registration failed",
                error: error.message,
            });
        }
    }
    async login(req, res) {
        try {
            const { username, password } = req.body;
            const user = await User.findByUsername(username);
            if (!user) {
                res.status(401).json({
                    success: false,
                    message: "Invalid credentials",
                });
                return;
            }
            const isValidPassword = await user.validatePassword(password);
            if (!isValidPassword) {
                res.status(401).json({
                    success: false,
                    message: "Invalid credentials",
                });
                return;
            }
            const token = AuthMiddleware.generateToken(user.id);
            logger.info("User logged in successfully:", { username: user.username });
            res.json({
                success: true,
                message: "Login successful",
                data: {
                    user: user.toJSON(),
                    token,
                },
            });
        }
        catch (error) {
            logger.error("Login error:", error);
            res.status(500).json({
                success: false,
                message: "Login failed",
                error: error.message,
            });
        }
    }
    async getProfile(req, res) {
        try {
            const user = req.user;
            if (!user) {
                res.status(401).json({
                    success: false,
                    message: "User not authenticated",
                });
                return;
            }
            res.json({
                success: true,
                data: {
                    user: user,
                },
            });
        }
        catch (error) {
            logger.error("Get profile error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to get profile",
                error: error.message,
            });
        }
    }
    async logout(req, res) {
        try {
            req.session.destroy((err) => {
                if (err) {
                    res.status(500).json({
                        success: false,
                        message: "Failed to log out. Please try again.",
                    });
                    return;
                }
                res.status(200).json({
                    success: true,
                    message: "Logged out successfully. Your session has ended.",
                });
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: "Logout failed",
                error: error.message,
            });
        }
    }
}
export default new AuthController();
//# sourceMappingURL=AuthController.js.map