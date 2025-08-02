import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import db from './config/databaseConfig.js';
import logger from './utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

async function setupDatabase() {
    try {
        console.log('Connecting to database...');
        await db.connect();
        console.log('Connected to database successfully');

        // Create users table
        console.log('Creating users table...');
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
        console.log('Users table created successfully');

        // Create games table for game history
        console.log('Creating games table...');
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
        console.log('Games table created successfully');

        console.log('Database setup completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Database setup failed:', error);
        process.exit(1);
    }
}

setupDatabase(); 