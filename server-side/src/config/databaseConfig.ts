import { Pool, PoolClient, QueryResult } from 'pg';
import logger from '../utils/logger.js';

class Database {
  private pool: Pool | null;
  private connected: boolean;

  constructor() {
    this.pool = null;
    this.connected = false;
  }

  async connect(): Promise<Pool> {
    try {
      this.pool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'i-game',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 100000,
      });

      this.pool.on('connect', () => {
        logger.info('Client connected to PostgreSQL database');
        this.connected = true;
      });

      this.pool.on('error', (err: Error) => {
        logger.error('Unexpected error on idle client', err);
        this.connected = false;
      });

      await this.pool.query('SELECT NOW()');
      this.connected = true;
      logger.info('Database connection verified');
      
      return this.pool;
    } catch (error:any) {
      logger.error(`Database connection error: ${error.code} - ${error.message}`, error.stack);
      
      throw error;
    }
  }

  async query(text: string, params?: any[]): Promise<QueryResult> {
    if (!this.pool) {
      throw new Error('Database not connected');
    }

    try {
      const start = Date.now();
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      
      logger.debug('Executed query', { text, duration, rows: result.rowCount });
      return result;
    } catch (error) {
      logger.error('Database query error:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.connected = false;
      logger.info('Database connection closed');
    }
  }

  getPool(): Pool | null {
    return this.pool;
  }

  isConnected(): boolean {
    return this.connected;
  }
}

export default new Database(); 