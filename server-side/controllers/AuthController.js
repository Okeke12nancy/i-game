import User from '../models/UserModel.js';
import AuthMiddleware from "../middleware/authMiddleware.js";
import logger from '../utils/logger.js';

class AuthController{
    static async register(req, res){
        try{
            const {userName, password} = req.body;

            const existingUser = await User.findByUserName(userName);
            if(existingUser){
                return res.status(400).json({
                    success: false,
                    message: 'Username already exists'
                });
            }

            const user = await User.create(userName, password);
            const token = AuthMiddleware.generateToken(user.userId);

            logger.info('User registered successfully:', {username: user.userName});

            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                data:{
                    user: user.toJSON(),
                    token
                }
            });

        }catch (error){
            logger.error('Registration error:', error);
            res.status(500).json({
                success: false,
                message: 'User registration failed',
                error: error.message
            });
        }
    }

    static async login(req, res) {
        try {
            const { userName, password } = req.body;

            const user = await User.findByUserName(userName);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            const isValidPassword = await user.validatePassword(password);
            if (!isValidPassword) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            const token = AuthMiddleware.generateToken(user.userId);

            logger.info('User logged in successfully:', { userName: user.userName });

            res.json({
                success: true,
                message: 'Login successful',
                data: {
                    user: user.toJSON(),
                    token
                }
            });
        } catch (error) {
            logger.error('Login error:', error);
            res.status(500).json({
                success: false,
                message: 'Login failed',
                error: error.message
            });
        }
    }
}

export default AuthController;