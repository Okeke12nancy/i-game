// import dotenv from 'dotenv';
// import { fileURLToPath } from 'url';
// import { dirname, join } from 'path';
// import db from '../config/databaseConfig.js';
// import logger from '../utils/logger.js';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

// dotenv.config({ path: join(__dirname, '../../.env') });

// async function setupDatabase() {
//     try {
//         await db.connect();
//         logger.info('Connected to database');

//         const createUsersTable = `
//             CREATE TABLE IF NOT EXISTS users (
//                 userId SERIAL PRIMARY KEY,
//                 userName VARCHAR(30) UNIQUE NOT NULL,
//                 password VARCHAR(255) NOT NULL,
//                 totalWins INTEGER DEFAULT 0,
//                 totalLosses INTEGER DEFAULT 0,
//                 createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//                 updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//             );
//         `;

//         await db.query(createUsersTable);
//         logger.info('Users table created successfully');

//         const createGamesTable = `
//             CREATE TABLE IF NOT EXISTS games (
//                 gameId SERIAL PRIMARY KEY,
//                 userId INTEGER REFERENCES users(userId),
//                 selectedNumber INTEGER NOT NULL,
//                 computerNumber INTEGER NOT NULL,
//                 result VARCHAR(10) NOT NULL,
//                 createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//             );
//         `;

//         await db.query(createGamesTable);
//         logger.info('Games table created successfully');

//         logger.info('Database setup completed successfully');
//         process.exit(0);
//     } catch (error) {
//         logger.error('Database setup failed:', error);
//         process.exit(1);
//     }
// }

// setupDatabase(); 


import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import db from '../config/databaseConfig.js';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env') });

async function setupDatabase() {
    try {
        logger.info('Attempting to connect to database...');
        await db.connect();
        logger.info('Database connected successfully');

        // Create tables
        logger.info('Creating tables...');
        
        const createUsersTable = `
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                total_wins INTEGER DEFAULT 0,
                total_losses INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;

        await db.query(createUsersTable);
        logger.info('Users table created successfully');

        const createGameSessionsTable = `
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
        `;

        await db.query(createGameSessionsTable);
        logger.info('Game sessions table created successfully');

        const createPlayerSessionsTable = `
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
        `;

        await db.query(createPlayerSessionsTable);
        logger.info('Player sessions table created successfully');

        // Create indexes
        logger.info('Creating indexes...');

        await db.query(`
            CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)
        `);

        await db.query(`
            CREATE INDEX IF NOT EXISTS idx_game_sessions_status ON game_sessions(status)
        `);

        await db.query(`
            CREATE INDEX IF NOT EXISTS idx_game_sessions_created_at ON game_sessions(created_at)
        `);

        await db.query(`
            CREATE INDEX IF NOT EXISTS idx_player_sessions_user_id ON player_sessions(user_id)
        `);

        await db.query(`
            CREATE INDEX IF NOT EXISTS idx_player_sessions_session_id ON player_sessions(session_id)
        `);

        await db.query(`
            CREATE INDEX IF NOT EXISTS idx_player_sessions_winner ON player_sessions(is_winner)
        `);

        logger.info('Indexes created successfully');

        // Create triggers
        logger.info('Creating triggers...');

        await db.query(`
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = CURRENT_TIMESTAMP;
                RETURN NEW;
            END;
            $$ language 'plpgsql'
        `);

        await db.query(`
            DROP TRIGGER IF EXISTS update_users_updated_at ON users;
            CREATE TRIGGER update_users_updated_at
                BEFORE UPDATE ON users
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column()
        `);

        await db.query(`
            DROP TRIGGER IF EXISTS update_game_sessions_updated_at ON game_sessions;
            CREATE TRIGGER update_game_sessions_updated_at
                BEFORE UPDATE ON game_sessions
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column()
        `);

        await db.query(`
            DROP TRIGGER IF EXISTS update_player_sessions_updated_at ON player_sessions;
            CREATE TRIGGER update_player_sessions_updated_at
                BEFORE UPDATE ON player_sessions
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column()
        `);

        logger.info('Triggers created successfully');

        logger.info('Database setup completed successfully');
        await db.close();
        process.exit(0);
    } catch (error) {
        logger.error('Database setup failed:', error);
        try {
            await db.close();
        } catch (closeError) {
            logger.error('Error closing database connection:', closeError);
        }
        process.exit(1);
    }
}

setupDatabase();