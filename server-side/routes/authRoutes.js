import express from 'express';
import AuthController from '../controllers/AuthController.js';
import ValidationMiddleware from '../middleware/validateMiddleware.js';

const authRouter = express.Router();

authRouter.post('/register', ValidationMiddleware.validate(ValidationMiddleware.schemas.register), AuthController.register);

authRouter.post('/login', ValidationMiddleware.validate(ValidationMiddleware.schemas.login), AuthController.login);

router.get('/profile', 
  AuthMiddleware.authenticateToken,
  AuthController.getProfile
);

export default authRouter;