import db from '../config/databaseConfig.js';
import bcrypt from 'bcryptjs';
import logger from '../utils/logger.js';

class User {
  constructor(data = {}) {
    this.id = data.id;
    this.username = data.username;
    this.password = data.password;
    this.total_wins = data.total_wins || 0;
    this.total_losses = data.total_losses || 0;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  async create(username, password) {
    try {
      const hashedPassword = await bcrypt.hash(password, 12);
      const query = `
        INSERT INTO users (username, password, total_wins, total_losses)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;
      const values = [username, hashedPassword, 0, 0];
      const result = await db.query(query, values);
      return new User(result.rows[0]);
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  async findByUsername(username) {
    try {
      const query = 'SELECT * FROM users WHERE username = $1';
      const result = await db.query(query, [username]);
      return result.rows[0] ? new User(result.rows[0]) : null;
    } catch (error) {
      logger.error('Error finding user by username:', error);
      throw error;
    }
  }

  async findById(id) {
    try {
      const query = 'SELECT * FROM users WHERE id = $1';
      const result = await db.query(query, [id]);
      return result.rows[0] ? new User(result.rows[0]) : null;
    } catch (error) {
      logger.error('Error finding user by id:', error);
      throw error;
    }
  }

  async getTopPlayers(limit = 10) {
    try {
      const query = `
        SELECT id, username, total_wins, total_losses, 
               (total_wins + total_losses) as total_games
        FROM users 
        ORDER BY total_wins DESC, total_losses ASC
        LIMIT $1
      `;
      const result = await db.query(query, [limit]);
      return result.rows.map(row => new User(row));
    } catch (error) {
      logger.error('Error getting top players:', error);
      throw error;
    }
  }

  async updateStats(isWinner) {
    try {
      const field = isWinner ? 'total_wins' : 'total_losses';
      const query = `
        UPDATE users 
        SET ${field} = ${field} + 1, updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `;
      const result = await db.query(query, [this.id]);
      const updatedUser = new User(result.rows[0]);
      Object.assign(this, updatedUser);
      return this;
    } catch (error) {
      logger.error('Error updating user stats:', error);
      throw error;
    }
  }

  async validatePassword(password) {
    return await bcrypt.compare(password, this.password);
  }

  toJSON() {
    return {
      id: this.id,
      username: this.username,
      total_wins: this.total_wins,
      total_losses: this.total_losses,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

export default new User; 