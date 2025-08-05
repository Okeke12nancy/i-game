import GameService from "../service/gameService.js";
import GameSession from "../models/game.js";
import PlayerSession from "../models/gamePlayer.js";
import User from "../models/UserModel.js";
import logger from "../utils/logger.js";
import gameService from "../service/gameService.js";
class GameController {
    async getActiveSession(req, res) {
        try {
            const sessionInfo = await GameService.getSessionInfo();
            if (!sessionInfo) {
                res.json({
                    success: true,
                    data: {
                        activeSession: null,
                        message: "No active session",
                    },
                });
                return;
            }
            const playerCount = await PlayerSession.getSessionPlayerCount(sessionInfo.id);
            const participants = await GameService.getSessionParticipants(sessionInfo.id);
            res.json({
                success: true,
                data: {
                    activeSession: {
                        ...sessionInfo,
                        playerCount,
                        participants: participants.map((p) => ({
                            id: p.user_id,
                            username: p.username,
                            selectedNumber: p.selected_number,
                            isWinner: p.is_winner,
                        })),
                    },
                },
            });
        }
        catch (error) {
            logger.error("Get active session error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to get active session",
                error: error.message,
            });
        }
    }
    async createSession(req, res) {
        try {
            const userId = req?.userId;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: "User does not exist",
                    data: null,
                });
                return;
            }
            const result = await gameService.createSession(userId);
            if (result.alreadyActive) {
                res.status(200).json({
                    success: true,
                    message: "There is already an active session",
                    data: { activeSession: result.session },
                });
                return;
            }
            res.status(201).json({
                success: true,
                message: "Game session created successfully",
                data: { activeSession: result.session },
            });
        }
        catch (error) {
            console.error("Error creating session:", error);
            res.status(500).json({
                success: false,
                message: "Failed to create game session",
                error: error.message,
            });
        }
    }
    async joinSession(req, res) {
        try {
            const { selectedNumber } = req.body;
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: "User not authenticated",
                });
                return;
            }
            const playerSession = await GameService.joinSession(userId, selectedNumber);
            res.json({
                success: true,
                message: "Successfully joined session",
                data: {
                    playerSession: playerSession.toJSON(),
                },
            });
        }
        catch (error) {
            logger.error("Join session error:", error);
            res.status(400).json({
                success: false,
                message: error.message,
            });
        }
    }
    async leaveSession(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: "User not authenticated",
                });
                return;
            }
            const removed = await GameService.leaveSession(userId);
            res.json({
                success: true,
                message: removed ? "Successfully left session" : "No active session to leave",
            });
        }
        catch (error) {
            logger.error("Leave session error:", error);
            res.json({
                success: true,
                message: "Session cleanup completed",
            });
        }
    }
    async getUserSession(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: "User not authenticated",
                });
                return;
            }
            const activeSession = await PlayerSession.getUserActiveSession(userId);
            if (!activeSession) {
                res.json({
                    success: true,
                    data: {
                        userSession: null,
                        message: "No active session",
                    },
                });
                return;
            }
            const session = await GameSession.findById(activeSession.session_id);
            const participants = await GameService.getSessionParticipants(activeSession.session_id);
            res.json({
                success: true,
                data: {
                    userSession: {
                        ...activeSession.toJSON(),
                        session: session?.toJSON(),
                        participants: participants.map((p) => ({
                            id: p.user_id,
                            username: p.username,
                            selectedNumber: p.selected_number,
                            isWinner: p.is_winner,
                        })),
                    },
                },
            });
        }
        catch (error) {
            logger.error("Get user session error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to get user session",
                error: error.message,
            });
        }
    }
    async getTopPlayers(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 10;
            const players = await User.getTopPlayers(limit);
            res.json({
                success: true,
                data: {
                    players: players.map((player) => player.toJSON()),
                },
            });
        }
        catch (error) {
            logger.error("Get top players error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to get top players",
                error: error.message,
            });
        }
    }
    async getSessionsByDate(req, res) {
        try {
            const { date } = req.params;
            const sessions = await GameSession.getSessionsByDate(date);
            const sessionsWithDetails = await Promise.all(sessions.map(async (session) => {
                const participants = await GameService.getSessionParticipants(session.id);
                const winners = await GameService.getSessionWinners(session.id);
                return {
                    ...session.toJSON(),
                    participantCount: participants.length,
                    winnerCount: winners.length,
                    participants: participants.map((p) => ({
                        id: p.user_id,
                        username: p.username,
                        selectedNumber: p.selected_number,
                        isWinner: p.is_winner,
                    })),
                    winners: winners.map((w) => ({
                        id: w.user_id,
                        username: w.username,
                        selectedNumber: w.selected_number,
                    })),
                };
            }));
            res.json({
                success: true,
                data: {
                    date,
                    sessions: sessionsWithDetails,
                },
            });
        }
        catch (error) {
            logger.error("Get sessions by date error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to get sessions by date",
                error: error.message,
            });
        }
    }
    async getRecentSessions(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 10;
            const sessions = await GameSession.getRecentSessions(limit);
            const sessionsWithDetails = await Promise.all(sessions.map(async (session) => {
                const participants = await GameService.getSessionParticipants(session.id);
                const winners = await GameService.getSessionWinners(session.id);
                return {
                    ...session.toJSON(),
                    participantCount: participants.length,
                    winnerCount: winners.length,
                    participants: participants.map((p) => ({
                        id: p.user_id,
                        username: p.username,
                        selectedNumber: p.selected_number,
                        isWinner: p.is_winner,
                    })),
                    winners: winners.map((w) => ({
                        id: w.user_id,
                        username: w.username,
                        selectedNumber: w.selected_number,
                    })),
                };
            }));
            res.json({
                success: true,
                data: {
                    sessions: sessionsWithDetails,
                },
            });
        }
        catch (error) {
            logger.error("Get recent sessions error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to get recent sessions",
                error: error.message,
            });
        }
    }
    async getSessionDetails(req, res) {
        try {
            const { sessionId } = req.params;
            const session = await GameSession.findById(parseInt(sessionId));
            if (!session) {
                res.status(404).json({
                    success: false,
                    message: "Session not found",
                });
                return;
            }
            const participants = await GameService.getSessionParticipants(parseInt(sessionId));
            const winners = await GameService.getSessionWinners(parseInt(sessionId));
            res.json({
                success: true,
                data: {
                    session: {
                        ...session.toJSON(),
                        participantCount: participants.length,
                        winnerCount: winners.length,
                        participants: participants.map((p) => ({
                            id: p.user_id,
                            username: p.username,
                            selectedNumber: p.selected_number,
                            isWinner: p.is_winner,
                        })),
                        winners: winners.map((w) => ({
                            id: w.user_id,
                            username: w.username,
                            selectedNumber: w.selected_number,
                        })),
                    },
                },
            });
        }
        catch (error) {
            logger.error("Get session details error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to get session details",
                error: error.message,
            });
        }
    }
}
export default new GameController();
//# sourceMappingURL=gameController.js.map