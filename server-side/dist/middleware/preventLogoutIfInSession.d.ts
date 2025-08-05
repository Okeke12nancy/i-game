import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types/index.js";
declare const preventLogoutIfInSession: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export default preventLogoutIfInSession;
//# sourceMappingURL=preventLogoutIfInSession.d.ts.map