import { Request, Response, NextFunction } from 'express';
import { Socket } from 'socket.io';
export interface User {
    id: number;
    username: string;
    password: string;
    total_wins: number;
    total_losses: number;
    created_at: Date;
    updated_at: Date;
}
export interface UserWithoutPassword extends Omit<User, 'password'> {
}
export interface GameSession {
    id: number;
    created_by: number;
    status: 'pending' | 'active' | 'completed';
    start_time: Date | null;
    end_time: Date | null;
    winning_number: number | null;
    created_at: Date;
    updated_at: Date;
}
export interface PlayerSession {
    id: number;
    user_id: number;
    session_id: number;
    selected_number: number;
    is_winner: boolean;
    created_at: Date;
    updated_at: Date;
}
export interface AuthenticatedRequest extends Request {
    user?: UserWithoutPassword;
    userId?: number;
}
export interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    error?: string;
}
export interface SessionInfo {
    id: number;
    status: string;
    startTime: Date | null;
    timeRemaining: number;
    maxPlayers: number;
    playerCount: number;
    participants: Participant[];
    createdBy: {
        id: number;
        username: string;
    } | null;
}
export interface Participant {
    id: number;
    username: string;
    selectedNumber: number | null;
    isWinner: boolean;
}
export interface Winner {
    id: number;
    username: string;
    selectedNumber: number;
}
export interface SessionResult {
    sessionId: number;
    winningNumber: number;
    participants: Participant[];
    winners: Winner[];
}
export interface AuthenticatedSocket extends Socket {
    userId?: number;
}
export interface EnvironmentVariables {
    PORT: string;
    NODE_ENV: string;
    JWT_SECRET: string;
    DB_HOST: string;
    DB_USER: string;
    DB_PASSWORD: string;
    DB_NAME: string;
    DB_PORT: string;
    SESSION_DURATION: string;
    SESSION_INTERVAL: string;
    MAX_PLAYERS_PER_SESSION: string;
}
export interface DatabaseConfig {
    host: string;
    user: string;
    password: string;
    database: string;
    port: number;
}
export interface AuthMiddleware {
    (req: AuthenticatedRequest, res: Response, next: NextFunction): void;
}
export interface Controller {
    [key: string]: (req: AuthenticatedRequest, res: Response) => Promise<void>;
}
export interface GameServiceInterface {
    activeSession: GameSession | null;
    sessionTimer: NodeJS.Timeout | null;
    sessionDuration: number;
    sessionInterval: number;
    maxPlayers: number;
    createSession(userId: number): Promise<{
        alreadyActive: boolean;
        session: SessionInfo | null;
    }>;
    createNewSession(createdBy: number): Promise<GameSession>;
    activateSession(sessionId: number): Promise<GameSession>;
    joinSession(userId: number, selectedNumber: number): Promise<PlayerSession>;
    leaveSession(userId: number): Promise<boolean>;
    completeSession(): Promise<SessionResult | undefined>;
    updateUserStats(sessionId: number): Promise<void>;
    startSessionTimer(): void;
    getSessionInfo(): Promise<SessionInfo | null>;
    calculateTimeRemaining(): number;
    getSessionParticipants(sessionId: number): Promise<Participant[]>;
    getSessionWinners(sessionId: number): Promise<Winner[]>;
    getActiveSession(): GameSession | null;
}
//# sourceMappingURL=index.d.ts.map