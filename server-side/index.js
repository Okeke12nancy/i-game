import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import express from 'express';
import db from './config/databaseConfig.js';
import logger from './utils/logger.js';
import { createServer } from 'http';

import authRouter from './routes/authRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

class Server {
    constructor(){
        this.app = express()
        this.server = createServer(this.app)
        this.port = process.env.PORT || 3000
    }

    setupMiddleware() {
        // Body parsing middleware
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        
        // CORS middleware
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
            if (req.method === 'OPTIONS') {
                res.sendStatus(200);
            } else {
                next();
            }
        });
    }

    setupRoutes() {
        // Health check endpoint
        this.app.get('/health', (req, res) => {
            res.json({
                success: true,
                message: 'Server is running',
                timestamp: new Date().toISOString(),
                uptime: process.uptime()
            });
        });

        // API routes
        this.app.use('/api/auth', authRouter);

        // 404 handler
        this.app.use('*', (req, res) => {
            res.status(404).json({
                success: false,
                message: 'Route not found'
            });
        });
    }

    setupErrorHandling() {
        // Global error handler
        this.app.use((error, req, res, next) => {
            logger.error('Unhandled error:', error);
            
            res.status(error.status || 500).json({
                success: false,
                message: error.message || 'Internal server error'
            });
        });
    }

    async initialize(){
        try {
            await db.connect()
            logger.info('Database successfully connected')
            
            this.setupMiddleware()
            this.setupRoutes()
            this.setupErrorHandling()
            
            logger.info('Server Connected Successfully')
        } catch (error){
            logger.error("Server initialization failed", error)
            process.exit(1)
        }
    }
    
    start(){
        this.server.listen(this.port, ()=>{
            logger.info(`Server is running on port ${this.port}`)
            logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
        })
    }

    async disconnect(){
        logger.info('Server disconnecting...')

        try{
            await db.close()
            this.server.close(()=>{
                logger.info('Server Closed')
                process.exit(0)
            })

        }catch (error){
            logger.error('Error during disconnection', error)
            process.exit(1)
        }
    }
}

const server = new Server();

process.on('SIGTERM', () => server.disconnect());
process.on('SIGINT', () => server.disconnect());

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

server.initialize().then(() => {
  server.start();
}); 