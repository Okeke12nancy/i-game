import { Request, Response, NextFunction } from "express";
import PlayerSession from "../models/gamePlayer.js";
import logger from "../utils/logger.js";
import { AuthenticatedRequest } from "../types/index.js";

const preventLogoutIfInSession = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    const activeSession = await PlayerSession.getUserActiveSession(req.user.id);

    if (activeSession) {
      res.status(400).json({
        success: false,
        message:
          "You cannot log out while participating in an active session. Please leave the session first.",
      });
      return;
    }

    next();
  } catch (error: any) {
    logger.error("Error checking active session before logout:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to verify active session." });
  }
};

export default preventLogoutIfInSession; 