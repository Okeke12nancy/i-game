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
        await db.connect();
        logger.info('Connected to database');

        const createUsersTable = `
            CREATE TABLE IF NOT EXISTS users (
                userId SERIAL PRIMARY KEY,
                userName VARCHAR(30) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                totalWins INTEGER DEFAULT 0,
                totalLosses INTEGER DEFAULT 0,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;

        await db.query(createUsersTable);
        logger.info('Users table created successfully');

        const createGamesTable = `
            CREATE TABLE IF NOT EXISTS games (
                gameId SERIAL PRIMARY KEY,
                userId INTEGER REFERENCES users(userId),
                selectedNumber INTEGER NOT NULL,
                computerNumber INTEGER NOT NULL,
                result VARCHAR(10) NOT NULL,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;

        await db.query(createGamesTable);
        logger.info('Games table created successfully');

        logger.info('Database setup completed successfully');
        process.exit(0);
    } catch (error) {
        logger.error('Database setup failed:', error);
        process.exit(1);
    }
}

setupDatabase(); 