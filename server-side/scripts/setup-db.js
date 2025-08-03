import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import db from '../config/databaseConfig.js';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env') });

class DatabaseSetup {
  constructor() {
    this.db = db;
  }

  async connect() {
    try {
      await this.db.connect();
      logger.info('Database connected successfully');
    } catch (error) {
      logger.error('Failed to connect to database:', error);
      process.exit(1);
    }
  }

  async createTables() {
    try {
      await this.db.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          total_wins INTEGER DEFAULT 0,
          total_losses INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await this.db.query(`
        CREATE TABLE IF NOT EXISTS game_sessions (
          id SERIAL PRIMARY KEY,
          status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'completed')),
          winning_number INTEGER,
          start_time TIMESTAMP,
          end_time TIMESTAMP,
          created_by INTEGER REFERENCES users(id),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create player_sessions table
      await this.db.query(`
        CREATE TABLE IF NOT EXISTS player_sessions (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          session_id INTEGER REFERENCES game_sessions(id) ON DELETE CASCADE,
          selected_number INTEGER CHECK (selected_number >= 1 AND selected_number <= 9),
          is_winner BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, session_id)
        )
      `);

      logger.info('Tables created successfully');
    } catch (error) {
      logger.error('Error creating tables:', error);
      throw error;
    }
  }

  async createIndexes() {
    try {
      await this.db.query(`
        CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)
      `);

      await this.db.query(`
        CREATE INDEX IF NOT EXISTS idx_game_sessions_status ON game_sessions(status)
      `);

      await this.db.query(`
        CREATE INDEX IF NOT EXISTS idx_game_sessions_created_at ON game_sessions(created_at)
      `);

      await this.db.query(`
        CREATE INDEX IF NOT EXISTS idx_player_sessions_user_id ON player_sessions(user_id)
      `);

      await this.db.query(`
        CREATE INDEX IF NOT EXISTS idx_player_sessions_session_id ON player_sessions(session_id)
      `);

      await this.db.query(`
        CREATE INDEX IF NOT EXISTS idx_player_sessions_winner ON player_sessions(is_winner)
      `);

      logger.info('Indexes created successfully');
    } catch (error) {
      logger.error('Error creating indexes:', error);
      throw error;
    }
  }

  async createTriggers() {
    try {
      await this.db.query(`
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
        END;
        $$ language 'plpgsql'
      `);

      await this.db.query(`
        DROP TRIGGER IF EXISTS update_users_updated_at ON users;
        CREATE TRIGGER update_users_updated_at
          BEFORE UPDATE ON users
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column()
      `);

      await this.db.query(`
        DROP TRIGGER IF EXISTS update_game_sessions_updated_at ON game_sessions;
        CREATE TRIGGER update_game_sessions_updated_at
          BEFORE UPDATE ON game_sessions
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column()
      `);

      await this.db.query(`
        DROP TRIGGER IF EXISTS update_player_sessions_updated_at ON player_sessions;
        CREATE TRIGGER update_player_sessions_updated_at
          BEFORE UPDATE ON player_sessions
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column()
      `);

      logger.info('Triggers created successfully');
    } catch (error) {
      logger.error('Error creating triggers:', error);
      throw error;
    }
  }

  async setup() {
    try {
      await this.connect();
      await this.createTables();
      await this.createIndexes();
      await this.createTriggers();
      
      logger.info('Database setup completed successfully');
      process.exit(0);
    } catch (error) {
      logger.error('Database setup failed:', error);
      process.exit(1);
    }
  }
}

if (require.main === module) {
  const setup = new DatabaseSetup();
  setup.setup();
}

module.exports = DatabaseSetup; 