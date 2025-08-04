import PlayerSession from "../models/gamePlayer.js";
import logger from "../utils/logger.js";

const preventLogoutIfInSession = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
    }

    const activeSession = await PlayerSession.getUserActiveSession(req.user.id);

    if (activeSession) {
      return res.status(400).json({
        success: false,
        message:
          "You cannot log out while participating in an active session. Please leave the session first.",
      });
    }

    next();
  } catch (error) {
    logger.error("Error checking active session before logout:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to verify active session." });
  }
};

export default preventLogoutIfInSession;
