import db from '../config/databaseConfig';
import logger from '../utils/logger';

class GameSession {
    constructor(data = {}){
        this.id = data.id;
        this.status = data.status || 'waiting';
        this.winning_number = data.winning_number;
        this.start_time = data.start_time;
        this.end_time = data.end_time;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    async create(createdBy){
        try{
            const query = ` INSERT INTO game_sessions (status, created_by, start_time) VALUES ($1, $2, NOW())
            RETURNING * `;
            const values = ['waiting', createdBy];
            const result = await db.query(query, values);
            return new GameSession(result.rows[0])
        } catch (error){
            logger.error('Error creating game session', error)
            throw error;
        }
    }
     async findActive(){
        try{
            const query = `SELECT * FROM game_sessions WHERE status = 'active' ORDER BY created_at DESC LIMIT 1`;
            const result = await db.query(query);
            return result.rows[0] ? new GameSession(result.rows[0]) : null;
        } catch (error) {
            logger.error('Error finding active session:', error)
            throw error
        }
     }
     async findById(id){
        try{
            const query = `SELECT * FROM game_sessions WHERE id = $1`;
            const result = await db.query(query, [id]);
            return result.row[0] ? new GameSession(result.row[0]) : null;
        } catch (error){
            logger.error('Error finding games session by id:', error)
            throw error;
        }
     }

     async getSessionByDate(date){
        try{
            const query = `SELECT * FROM game_sessions WHERE DATE(created_at) = $1 ORDER BY created_at DESC`;
            const result = await db.query(query, [date]);
            return result.rows.map(rows => new GameSession (rows));
        } catch (error){
            logger.error('Error getting sessions by date:', error)
            throw error;
        }
     }

    async getRecentSessions(limit = 10) {
    try {
      const query = `
        SELECT * FROM game_sessions 
        ORDER BY created_at DESC 
        LIMIT $1
      `;
      const result = await db.query(query, [limit]);
      return result.rows.map(row => new GameSession(row));
    } catch (error) {
      logger.error('Error getting recent sessions:', error);
      throw error;
    }
  }
  async activate(){
    try{
        const query = `UPDATE game_sessions SET status = 'active, start_time = NOW(), updated_at= NOW()
         WHERE id =$1 RETURNING *
        `;
        const result = await db.query(query, [this.id]);
        Object.assign(this, result.rows[0]);
        return this;

    } catch (error){
        logger.error('Erroring activating session:', error)
        throw error;
    }
  }
async complete (winningNumber){
try {
    const query = `
    UPDATE game_sessions SET status = 'completed', winning_number = $1, end_time =NOW. updated_at = NOW() WHERE id =$1 RETURNING *`;

    const result = await db.query(query, [winningNumber, this.id]);
    Object.assign(this, result.rows[0]);
    return this;
}catch (error){
    logger.error('Error completing session', error)
    throw error;
}
}
async getParticipants() {
    try {
      const query = `
        SELECT u.id, u.username, ps.selected_number, ps.is_winner, ps.created_at
        FROM player_sessions ps
        JOIN users u ON ps.user_id = u.id
        WHERE ps.session_id = $1
        ORDER BY ps.created_at ASC
      `;
      const result = await db.query(query, [this.id]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting session participants:', error);
      throw error;
    }
  }

  async getWinners() {
    try {
      const query = `
        SELECT u.id, u.username, ps.selected_number
        FROM player_sessions ps
        JOIN users u ON ps.user_id = u.id
        WHERE ps.session_id = $1 AND ps.is_winner = true
        ORDER BY ps.created_at ASC
      `;
      const result = await db.query(query, [this.id]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting session winners:', error);
      throw error;
    }
  }

  toJSON() {
    return {
      id: this.id,
      status: this.status,
      winning_number: this.winning_number,
      start_time: this.start_time,
      end_time: this.end_time,
      created_at: this.created_at,
      updated_at: this.updated_at,
      created_by: this.created_by
    };
  }
}

export default new GameSession; 
