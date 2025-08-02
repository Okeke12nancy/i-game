import db from '../config/databaseConfig.js';
import bcrypt from 'bcryptjs';
import logger from '../utils/logger.js';

class User {
    constructor(data){
        this.userId = data.userId;
        this.userName = data.userName;
        this.password = data.password;
        this.totalWins = data.totalWins || 0;
        this.totalLosses = data.totalLosses || 0;
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;
    }

    static async create(userName, password){
        try{
            const hashedPassword = await bcrypt.hash(password, 12);
            const query = `INSERT INTO users (userName, password, totalWins, totalLosses) VALUES ($1, $2, $3, $4) RETURNING *`;
            const values = [userName, hashedPassword, 0, 0];
            const result = await db.query(query, values);

            return new User(result.rows[0]);
        }catch (error){
            logger.error('Error creating user:', error);
            throw error;
        }
    }

    static async findByUserName(userName){
        try{
            const query = 'SELECT * FROM users WHERE userName = $1';
            const result = await db.query(query, [userName]);
            
            if (result.rows.length === 0) {
                return null;
            }
            
            return new User(result.rows[0]);
        }catch (error){
            logger.error('Error finding user by username:', error);
            throw error;
        }
    }

    static async findById(userId){
        try{
            const query = 'SELECT * FROM users WHERE userId = $1';
            const result = await db.query(query, [userId]);
            
            if (result.rows.length === 0) {
                return null;
            }
            
            return new User(result.rows[0]);
        }catch (error){
            logger.error('Error finding user by ID:', error);
            throw error;
        }
    }

    async validatePassword(password){
        return await bcrypt.compare(password, this.password);
    }

    toJSON(){
        return{
            id: this.userId,
            userName: this.userName,
            totalWins: this.totalWins,
            totalLosses: this.totalLosses,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}

export default User;