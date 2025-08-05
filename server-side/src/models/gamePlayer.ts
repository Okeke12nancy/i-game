import db from '../config/databaseConfig.js';
import logger from '../utils/logger.js';
import { PlayerSession as PlayerSessionType } from '../types/index.js';

class PlayerSession implements PlayerSessionType {
  id: number;
  user_id: number;
  session_id: number;
  selected_number: number;
  is_winner: boolean;
  created_at: Date;
  updated_at: Date;

  constructor(data: Partial<PlayerSessionType> = {}) {
    this.id = data.id || 0;
    this.user_id = data.user_id || 0;
    this.session_id = data.session_id || 0;
    this.selected_number = data.selected_number || 0;
    this.is_winner = data.is_winner || false;
    this.created_at = data.created_at || new Date();
    this.updated_at = data.updated_at || new Date();
  }

  async create(userId: number, sessionId: number, selectedNumber: number): Promise<PlayerSession> {
    try {
      const query = `
        INSERT INTO player_sessions (user_id, session_id, selected_number)
        VALUES ($1, $2, $3)
        RETURNING *
      `;
      const values = [userId, sessionId, selectedNumber];
      const result = await db.query(query, values);
      return new PlayerSession(result.rows[0]);
    } catch (error) {
      logger.error('Error creating player session:', error);
      throw error;
    }
  }

  async findByUserAndSession(userId: number, sessionId: number): Promise<PlayerSession | null> {
    try {
      const query = `
        SELECT * FROM player_sessions 
        WHERE user_id = $1 AND session_id = $2
      `;
      const result = await db.query(query, [userId, sessionId]);
      return result.rows[0] ? new PlayerSession(result.rows[0]) : null;
    } catch (error) {
      logger.error('Error finding player session:', error);
      throw error;
    }
  }

  async getUserActiveSession(userId: number): Promise<PlayerSession | null> {
    try {
      const query = `
        SELECT ps.*, gs.status as session_status
        FROM player_sessions ps
        JOIN game_sessions gs ON ps.session_id = gs.id
        WHERE ps.user_id = $1 AND gs.status IN ('waiting', 'active')
        ORDER BY ps.created_at DESC
        LIMIT 1
      `;
      const result = await db.query(query, [userId]);
      return result.rows[0] ? new PlayerSession(result.rows[0]) : null;
    } catch (error) {
      logger.error('Error getting user active session:', error);
      throw error;
    }
  }

  async getSessionParticipants(sessionId: number): Promise<any[]> {
    try {
      const query = `
        SELECT ps.*, u.username
        FROM player_sessions ps
        JOIN users u ON ps.user_id = u.id
        WHERE ps.session_id = $1
        ORDER BY ps.created_at ASC
      `;
      const result = await db.query(query, [sessionId]);
      return result.rows.map(row => ({
        ...new PlayerSession(row),
        username: row.username
      }));
    } catch (error) {
      logger.error('Error getting session participants:', error);
      throw error;
    }
  }

  async getSessionWinners(sessionId: number): Promise<any[]> {
    try {
      const query = `
        SELECT ps.*, u.username
        FROM player_sessions ps
        JOIN users u ON ps.user_id = u.id
        WHERE ps.session_id = $1 AND ps.is_winner = true
        ORDER BY ps.created_at ASC
      `;
      const result = await db.query(query, [sessionId]);
      return result.rows.map(row => ({
        ...new PlayerSession(row),
        username: row.username
      }));
    } catch (error) {
      logger.error('Error getting session winners:', error);
      throw error;
    }
  }

  async markWinners(sessionId: number, winningNumber: number): Promise<number> {
    try {
      const query = `
        UPDATE player_sessions 
        SET is_winner = true, updated_at = NOW()
        WHERE session_id = $1 AND selected_number = $2
      `;
      const result = await db.query(query, [sessionId, winningNumber]);
      return result.rowCount || 0;
    } catch (error) {
      logger.error('Error marking winners:', error);
      throw error;
    }
  }

  async removeFromSession(userId: number, sessionId: number): Promise<boolean> {
    try {
      const query = `
        DELETE FROM player_sessions 
        WHERE user_id = $1 AND session_id = $2
      `;
      const result = await db.query(query, [userId, sessionId]);
      return result.rowCount > 0;
    } catch (error) {
      logger.error('Error removing player from session:', error);
      throw error;
    }
  }

  async getSessionPlayerCount(sessionId: number): Promise<number> {
    try {
      const query = `
        SELECT COUNT(*) as player_count
        FROM player_sessions 
        WHERE session_id = $1
      `;
      const result = await db.query(query, [sessionId]);
      return parseInt(result.rows[0].player_count);
    } catch (error) {
      logger.error('Error getting session player count:', error);
      throw error;
    }
  }

  toJSON(): PlayerSessionType {
    return {
      id: this.id,
      user_id: this.user_id,
      session_id: this.session_id,
      selected_number: this.selected_number,
      is_winner: this.is_winner,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

export default new PlayerSession(); 