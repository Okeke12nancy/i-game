import { Request, Response } from "express";
import { AuthenticatedRequest } from "../types/index.js";
declare class GameController {
    getActiveSession(req: Request, res: Response): Promise<void>;
    createSession(req: AuthenticatedRequest, res: Response): Promise<void>;
    joinSession(req: AuthenticatedRequest, res: Response): Promise<void>;
    leaveSession(req: AuthenticatedRequest, res: Response): Promise<void>;
    getUserSession(req: AuthenticatedRequest, res: Response): Promise<void>;
    getTopPlayers(req: Request, res: Response): Promise<void>;
    getSessionsByDate(req: Request, res: Response): Promise<void>;
    getRecentSessions(req: Request, res: Response): Promise<void>;
    getSessionDetails(req: Request, res: Response): Promise<void>;
}
declare const _default: GameController;
export default _default;
//# sourceMappingURL=gameController.d.ts.map