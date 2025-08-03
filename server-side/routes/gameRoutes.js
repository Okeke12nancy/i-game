import express from 'express';
import GameController from '../controllers/gameController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import validateMiddleware from '../middleware/validateMiddleware.js';

const gameRouter = express.Router();

gameRouter.use(authMiddleware.authMiddlewares)

gameRouter.get('/session/active', GameController.getActiveSession);

gameRouter.post('/session/join', validateMiddleware.validate(validateMiddleware.schemas.selectNumber), authMiddleware.checkoutActiveSession, GameController.joinSession)

gameRouter.post('/session/leave', GameController.leaveSession);

gameRouter.get('/session/user', GameController.getUserSession);

gameRouter.get('/leaderboard', GameController.getTopPlayers);

gameRouter.get('/sessions/date/:date', GameController.getSessionsByDate);

gameRouter.get('/sessions/recent', GameController.getRecentSessions);

gameRouter.get('/sessions/:sessionId', GameController.getSessionDetails);

export default gameRouter; 
