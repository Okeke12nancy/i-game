import jwt from 'jsonwebtoken';
import User from '../models/UserModel.js';
import logger from '../utils/logger.js';

class AuthMiddleware{
    static async authMiddleware(req, res, next){
        try{
            const authHeader = req.headers['authorization'];
            const token = authHeader && authHeader.split(' ')[1];

            if (!token){
                return res.status(401).json({
                    success: false,
                    message: 'Access token required'
                });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.userId);

            if(!user){
                return res.status(401).json({
                    success: false,
                    message: "Invalid token"
                });
            }

            req.user = user;
            next();

        }catch (error){
            logger.error('Authentication error', error);

            if (error.name === 'JsonWebTokenError'){
                return res.status(401).json({
                    success: false,
                    message: 'Invalid token'
                });
            }
            
            if (error.name === 'TokenExpiredError'){
                return res.status(401).json({
                    success: false,
                    message: 'Token expired'
                });
            }
            
            return res.status(500).json({
                success: false,
                message: 'Authentication failed'
            });
        }
    }

    static generateToken(userId) {
        return jwt.sign(
            { userId },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );
    }
}

export default AuthMiddleware;