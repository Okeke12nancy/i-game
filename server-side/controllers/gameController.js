import GameService from '../services/GameService.js';
import GameSession from '../models/GameSession.js';
import PlayerSession from '../models/PlayerSession.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';

class GameController {
  static async getActiveSession(req, res) {
    try {
      const sessionInfo = GameService.getSessionInfo();
      
      if (!sessionInfo) {
        return res.json({
          success: true,
          data: {
            activeSession: null,
            message: 'No active session'
          }
        });
      }

      const playerCount = await PlayerSession.getSessionPlayerCount(sessionInfo.id);
      const participants = await GameService.getSessionParticipants(sessionInfo.id);

      res.json({
        success: true,
        data: {
          activeSession: {
            ...sessionInfo,
            playerCount,
            participants: participants.map(p => ({
              id: p.user_id,
              username: p.username,
              selectedNumber: p.selected_number,
              isWinner: p.is_winner
            }))
          }
        }
      });
    } catch (error) {
      logger.error('Get active session error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get active session',
        error: error.message
      });
    }
  }

  static async joinSession(req, res) {
    try {
      const { selectedNumber } = req.body;
      const userId = req.user.id;

      const playerSession = await GameService.joinSession(userId, selectedNumber);

      res.json({
        success: true,
        message: 'Successfully joined session',
        data: {
          playerSession: playerSession.toJSON()
        }
      });
    } catch (error) {
      logger.error('Join session error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  static async leaveSession(req, res) {
    try {
      const userId = req.user.id;
      const removed = await GameService.leaveSession(userId);

      if (removed) {
        res.json({
          success: true,
          message: 'Successfully left session'
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Not found in any active session'
        });
      }
    } catch (error) {
      logger.error('Leave session error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to leave session',
        error: error.message
      });
    }
  }

  static async getUserSession(req, res) {
    try {
      const userId = req.user.id;
      const activeSession = await PlayerSession.getUserActiveSession(userId);

      if (!activeSession) {
        return res.json({
          success: true,
          data: {
            userSession: null,
            message: 'No active session'
          }
        });
      }

      const session = await GameSession.findById(activeSession.session_id);
      const participants = await GameService.getSessionParticipants(activeSession.session_id);

      res.json({
        success: true,
        data: {
          userSession: {
            ...activeSession.toJSON(),
            session: session.toJSON(),
            participants: participants.map(p => ({
              id: p.user_id,
              username: p.username,
              selectedNumber: p.selected_number,
              isWinner: p.is_winner
            }))
          }
        }
      });
    } catch (error) {
      logger.error('Get user session error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user session',
        error: error.message
      });
    }
  }

  static async getTopPlayers(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const players = await User.getTopPlayers(limit);

      res.json({
        success: true,
        data: {
          players: players.map(player => player.toJSON())
        }
      });
    } catch (error) {
      logger.error('Get top players error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get top players',
        error: error.message
      });
    }
  }

  static async getSessionsByDate(req, res) {
    try {
      const { date } = req.params;
      const sessions = await GameSession.getSessionsByDate(date);

      const sessionsWithDetails = await Promise.all(
        sessions.map(async (session) => {
          const participants = await GameService.getSessionParticipants(session.id);
          const winners = await GameService.getSessionWinners(session.id);
          
          return {
            ...session.toJSON(),
            participantCount: participants.length,
            winnerCount: winners.length,
            participants: participants.map(p => ({
              id: p.user_id,
              username: p.username,
              selectedNumber: p.selected_number,
              isWinner: p.is_winner
            })),
            winners: winners.map(w => ({
              id: w.user_id,
              username: w.username,
              selectedNumber: w.selected_number
            }))
          };
        })
      );

      res.json({
        success: true,
        data: {
          date,
          sessions: sessionsWithDetails
        }
      });
    } catch (error) {
      logger.error('Get sessions by date error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get sessions by date',
        error: error.message
      });
    }
  }

  static async getRecentSessions(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const sessions = await GameSession.getRecentSessions(limit);

      const sessionsWithDetails = await Promise.all(
        sessions.map(async (session) => {
          const participants = await GameService.getSessionParticipants(session.id);
          const winners = await GameService.getSessionWinners(session.id);
          
          return {
            ...session.toJSON(),
            participantCount: participants.length,
            winnerCount: winners.length,
            participants: participants.map(p => ({
              id: p.user_id,
              username: p.username,
              selectedNumber: p.selected_number,
              isWinner: p.is_winner
            })),
            winners: winners.map(w => ({
              id: w.user_id,
              username: w.username,
              selectedNumber: w.selected_number
            }))
          };
        })
      );

      res.json({
        success: true,
        data: {
          sessions: sessionsWithDetails
        }
      });
    } catch (error) {
      logger.error('Get recent sessions error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get recent sessions',
        error: error.message
      });
    }
  }

  static async getSessionDetails(req, res) {
    try {
      const { sessionId } = req.params;
      const session = await GameSession.findById(sessionId);

      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Session not found'
        });
      }

      const participants = await GameService.getSessionParticipants(sessionId);
      const winners = await GameService.getSessionWinners(sessionId);

      res.json({
        success: true,
        data: {
          session: {
            ...session.toJSON(),
            participantCount: participants.length,
            winnerCount: winners.length,
            participants: participants.map(p => ({
              id: p.user_id,
              username: p.username,
              selectedNumber: p.selected_number,
              isWinner: p.is_winner
            })),
            winners: winners.map(w => ({
              id: w.user_id,
              username: w.username,
              selectedNumber: w.selected_number
            }))
          }
        }
      });
    } catch (error) {
      logger.error('Get session details error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get session details',
        error: error.message
      });
    }
  }
}

export default GameController; 