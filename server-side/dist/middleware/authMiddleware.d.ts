import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types/index.js";
declare class AuthMiddleware {
    authMiddlewares(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    generateToken(userId: number): string;
    checkoutActiveSession(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
}
declare const _default: AuthMiddleware;
export default _default;
//# sourceMappingURL=authMiddleware.d.ts.map