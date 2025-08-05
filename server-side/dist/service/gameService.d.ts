import { GameServiceInterface, SessionInfo, SessionResult, Participant, Winner } from "../types/index.js";
declare class GameService implements GameServiceInterface {
    activeSession: any;
    sessionTimer: NodeJS.Timeout | null;
    sessionDuration: number;
    sessionInterval: number;
    maxPlayers: number;
    constructor();
    createSession(userId: number): Promise<{
        alreadyActive: boolean;
        session: SessionInfo | null;
    }>;
    createNewSession(createdBy: number): Promise<any>;
    activateSession(sessionId: number): Promise<any>;
    joinSession(userId: number, selectedNumber: number): Promise<any>;
    leaveSession(userId: number): Promise<boolean>;
    completeSession(): Promise<SessionResult | undefined>;
    updateUserStats(sessionId: number): Promise<void>;
    startSessionTimer(): void;
    getSessionInfo(): Promise<SessionInfo | null>;
    calculateTimeRemaining(): number;
    getSessionParticipants(sessionId: number): Promise<Participant[]>;
    getSessionWinners(sessionId: number): Promise<Winner[]>;
    getActiveSession(): any;
}
declare const _default: GameService;
export default _default;
//# sourceMappingURL=gameService.d.ts.map