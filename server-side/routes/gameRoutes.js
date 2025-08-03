import express from 'express';
import GameController from '../controllers/gameController';
import authMiddleware from '../middleware/authMiddleware';
import validateMiddleware from '../middleware/validateMiddleware';

const gameRouter = express.Router();

gameRouter.use(authMiddleware.authMiddleware)

gameRouter.get('/session/active', GameController.getActiveSession);

gameRouter.post('./session/join', validateMiddleware.validate(validateMiddleware.schemas.selectNumber), authMiddleware.checkoutActiveSession, GameController.joinSession)

router.post('/session/leave', GameController.leaveSession);

router.get('/session/user', GameController.getUserSession);

router.get('/leaderboard', GameController.getTopPlayers);

router.get('/sessions/date/:date', GameController.getSessionsByDate);

router.get('/sessions/recent', GameController.getRecentSessions);

router.get('/sessions/:sessionId', GameController.getSessionDetails);

export default router; 
