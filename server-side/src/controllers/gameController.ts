import { Request, Response } from "express";
import GameService from "../service/gameService.js";
import GameSession from "../models/game.js";
import PlayerSession from "../models/gamePlayer.js";
import User from "../models/UserModel.js";
import logger from "../utils/logger.js";
import gameService from "../service/gameService.js";
import { AuthenticatedRequest } from "../types/index.js";

class GameController {
  async getActiveSession(req: Request, res: Response): Promise<void> {
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

      const playerCount = await PlayerSession.getSessionPlayerCount(
        sessionInfo.id
      );
      const participants = await GameService.getSessionParticipants(
        sessionInfo.id
      );

      res.json({
        success: true,
        data: {
          activeSession: {
            ...sessionInfo,
            playerCount,
            participants: participants.map((p: any) => ({
              id: p.user_id,
              username: p.username,
              selectedNumber: p.selected_number,
              isWinner: p.is_winner,
            })),
          },
        },
      });
    } catch (error: any) {
      logger.error("Get active session error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get active session",
        error: error.message,
      });
    }
  }

  async createSession(req: AuthenticatedRequest, res: Response): Promise<void> {
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
    } catch (error: any) {
      console.error("Error creating session:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create game session",
        error: error.message,
      });
    }
  }

  async joinSession(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const playerSession = await GameService.joinSession(
        userId,
        selectedNumber
      );

      res.json({
        success: true,
        message: "Successfully joined session",
        data: {
          playerSession: playerSession.toJSON(),
        },
      });
    } catch (error: any) {
      logger.error("Join session error:", error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async leaveSession(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      // Always return success, even if user wasn't in a session
      // This handles cases where session has ended but user tries to leave
      res.json({
        success: true,
        message: removed
          ? "Successfully left session"
          : "No active session to leave",
      });
    } catch (error: any) {
      logger.error("Leave session error:", error);
      // Even on error, return success to allow user to navigate away
      res.json({
        success: true,
        message: "Session cleanup completed",
      });
    }
  }

  async getUserSession(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
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
      const participants = await GameService.getSessionParticipants(
        activeSession.session_id
      );

      res.json({
        success: true,
        data: {
          userSession: {
            ...activeSession.toJSON(),
            session: session?.toJSON(),
            participants: participants.map((p: any) => ({
              id: p.user_id,
              username: p.username,
              selectedNumber: p.selected_number,
              isWinner: p.is_winner,
            })),
          },
        },
      });
    } catch (error: any) {
      logger.error("Get user session error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get user session",
        error: error.message,
      });
    }
  }

  async getTopPlayers(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const players = await User.getTopPlayers(limit);

      res.json({
        success: true,
        data: {
          players: players.map((player) => player.toJSON()),
        },
      });
    } catch (error: any) {
      logger.error("Get top players error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get top players",
        error: error.message,
      });
    }
  }

  async getSessionsByDate(req: Request, res: Response): Promise<any> {
    try {
      const { date } = req.params;
      if (!date) {
        return res.status(400).json({
          success: false,
          message: "Date parameter is required",
        });
      }
      const sessions = await GameSession.getSessionsByDate(date);

      const sessionsWithDetails = await Promise.all(
        sessions.map(async (session) => {
          const participants = await GameService.getSessionParticipants(
            session.id
          );
          const winners = await GameService.getSessionWinners(session.id);

          return {
            ...session.toJSON(),
            participantCount: participants.length,
            winnerCount: winners.length,
            participants: participants.map((p: any) => ({
              id: p.user_id,
              username: p.username,
              selectedNumber: p.selected_number,
              isWinner: p.is_winner,
            })),
            winners: winners.map((w: any) => ({
              id: w.user_id,
              username: w.username,
              selectedNumber: w.selected_number,
            })),
          };
        })
      );

      res.json({
        success: true,
        data: {
          date,
          sessions: sessionsWithDetails,
        },
      });
    } catch (error: any) {
      logger.error("Get sessions by date error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get sessions by date",
        error: error.message,
      });
    }
  }

  async getRecentSessions(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const sessions = await GameSession.getRecentSessions(limit);

      const sessionsWithDetails = await Promise.all(
        sessions.map(async (session) => {
          const participants = await GameService.getSessionParticipants(
            session.id
          );
          const winners = await GameService.getSessionWinners(session.id);

          return {
            ...session.toJSON(),
            participantCount: participants.length,
            winnerCount: winners.length,
            participants: participants.map((p: any) => ({
              id: p.user_id,
              username: p.username,
              selectedNumber: p.selected_number,
              isWinner: p.is_winner,
            })),
            winners: winners.map((w: any) => ({
              id: w.user_id,
              username: w.username,
              selectedNumber: w.selected_number,
            })),
          };
        })
      );

      res.json({
        success: true,
        data: {
          sessions: sessionsWithDetails,
        },
      });
    } catch (error: any) {
      logger.error("Get recent sessions error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get recent sessions",
        error: error.message,
      });
    }
  }

  async getSessionDetails(req: Request, res: Response): Promise<any> {
    try {
      const { sessionId } = req.params;
      if (!sessionId) {
        return res.status(400).json({
          success: false,
          message: "Session ID is required",
        });
      }
      const session = await GameSession.findById(parseInt(sessionId));

      if (!session) {
        res.status(404).json({
          success: false,
          message: "Session not found",
        });
        return;
      }
      if (!sessionId) {
        return res.status(400).json({
          success: false,
          message: "Session ID is required",
        });
      }
      const participants = await GameService.getSessionParticipants(
        parseInt(sessionId)
      );
      const winners = await GameService.getSessionWinners(parseInt(sessionId));

      res.json({
        success: true,
        data: {
          session: {
            ...session.toJSON(),
            participantCount: participants.length,
            winnerCount: winners.length,
            participants: participants.map((p: any) => ({
              id: p.user_id,
              username: p.username,
              selectedNumber: p.selected_number,
              isWinner: p.is_winner,
            })),
            winners: winners.map((w: any) => ({
              id: w.user_id,
              username: w.username,
              selectedNumber: w.selected_number,
            })),
          },
        },
      });
    } catch (error: any) {
      logger.error("Get session details error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get session details",
        error: error.message,
      });
    }
  }

  async getUserStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const user = await User.findById(userId);

      if (!user) {
        res.status(404).json({
          success: false,
          message: "User not found",
        });
        return;
      }

      res.json({
        success: true,
        data: {
          stats: {
            totalWins: user.total_wins,
            totalLosses: user.total_losses,
          },
        },
      });
    } catch (error: any) {
      logger.error("Get user stats error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get user stats",
        error: error.message,
      });
    }
  }
}

export default new GameController();
