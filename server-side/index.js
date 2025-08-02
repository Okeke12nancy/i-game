import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import express from 'express';
import db from './config/databaseConfig.js';
import logger from './utils/logger.js';
import { createServer } from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

class Server {
    constructor(){
        this.app = express()
        this.server = createServer(this.app)
        this.port = process.env.PORT || 3000
    }

    async initialize(){
        try {
            await db.connect()
            logger.info('Database successfully connected')
            logger.info('Server Connected Successfully')
        } catch (error){
            logger.info("server initialization failed", error)
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
        logger.info('Server disconnected')

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