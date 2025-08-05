import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import logger from "../utils/logger.js";
import {supabase} from "../config/supabaseConfig.js"; // Supabase client

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, "../../.env") });

async function setupDatabase(): Promise<void> {
  try {
    logger.info("Attempting to connect to Supabase...");

    // Test connection by running a simple query
    const { error: testError } = await supabase.from("users").select("count").limit(1);
    if (testError) {
      logger.warn("Users table does not exist yet. Proceeding with setup...");
    } else {
      logger.info("Connected to Supabase successfully");
    }

    logger.info("Creating tables...");

    // Users table
    await supabase.rpc("exec_sql", {
      sql: `
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          total_wins INTEGER DEFAULT 0,
          total_losses INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `,
    });
    logger.info("Users table created successfully");

    // Game sessions table
    await supabase.rpc("exec_sql", {
      sql: `
        CREATE TABLE IF NOT EXISTS game_sessions (
          id SERIAL PRIMARY KEY,
          status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'completed')),
          winning_number INTEGER,
          start_time TIMESTAMP,
          end_time TIMESTAMP,
          created_by INTEGER REFERENCES users(id),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `,
    });
    logger.info("Game sessions table created successfully");

    // Player sessions table
    await supabase.rpc("exec_sql", {
      sql: `
        CREATE TABLE IF NOT EXISTS player_sessions (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          session_id INTEGER REFERENCES game_sessions(id) ON DELETE CASCADE,
          selected_number INTEGER CHECK (selected_number >= 1 AND selected_number <= 9),
          is_winner BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, session_id)
        );
      `,
    });
    logger.info("Player sessions table created successfully");

    logger.info("Creating indexes...");
    await supabase.rpc("exec_sql", {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
        CREATE INDEX IF NOT EXISTS idx_game_sessions_status ON game_sessions(status);
        CREATE INDEX IF NOT EXISTS idx_game_sessions_created_at ON game_sessions(created_at);
        CREATE INDEX IF NOT EXISTS idx_player_sessions_user_id ON player_sessions(user_id);
        CREATE INDEX IF NOT EXISTS idx_player_sessions_session_id ON player_sessions(session_id);
        CREATE INDEX IF NOT EXISTS idx_player_sessions_winner ON player_sessions(is_winner);
      `,
    });

    logger.info("Creating triggers...");
    await supabase.rpc("exec_sql", {
      sql: `
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
        END;
        $$ language 'plpgsql';

        DROP TRIGGER IF EXISTS update_users_updated_at ON users;
        CREATE TRIGGER update_users_updated_at
          BEFORE UPDATE ON users
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();

        DROP TRIGGER IF EXISTS update_game_sessions_updated_at ON game_sessions;
        CREATE TRIGGER update_game_sessions_updated_at
          BEFORE UPDATE ON game_sessions
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();

        DROP TRIGGER IF EXISTS update_player_sessions_updated_at ON player_sessions;
        CREATE TRIGGER update_player_sessions_updated_at
          BEFORE UPDATE ON player_sessions
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
      `,
    });

    logger.info("Supabase database setup completed successfully");
    process.exit(0);
  } catch (error) {
    logger.error("Database setup failed:", error);
    process.exit(1);
  }
}

setupDatabase();
