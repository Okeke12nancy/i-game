import { Request, Response, NextFunction } from 'express';
import { Socket } from 'socket.io';

// User types
export interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  total_wins: number;
  total_losses: number;
  created_at: Date;
  updated_at: Date;
}

export interface UserWithoutPassword extends Omit<User, 'password'> {}

// Session types
export interface GameSession {
  id: number;
  created_by: number;
  status: 'waiting' | 'active' | 'completed';
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

// Request types
export interface AuthenticatedRequest extends Request {
  user?: UserWithoutPassword;
  userId?: number;
}

// Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// Game service types
export interface SessionInfo {
  id: number;
  status: string;
  startTime: Date | null;
  timeRemaining: number;
  maxPlayers: number;
  playerCount: number;
  participants: Participant[];
  createdBy: { id: number; username: string } | null;
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

// Socket types
export interface AuthenticatedSocket extends Socket {
  userId?: number;
}

// Environment variables
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

// Database types
export interface DatabaseConfig {
  host: string;
  user: string;
  password: string;
  database: string;
  port: number;
}

// Middleware types
export interface AuthMiddleware {
  (req: AuthenticatedRequest, res: Response, next: NextFunction): void;
}

// Controller types
export interface Controller {
  [key: string]: (req: AuthenticatedRequest, res: Response) => Promise<void>;
}

// Service types
export interface GameServiceInterface {
  activeSession: GameSession | null;
  sessionTimer: NodeJS.Timeout | null;
  sessionDuration: number;
  sessionInterval: number;
  maxPlayers: number;
  
  createSession(userId: number): Promise<{ alreadyActive: boolean; session: SessionInfo | null }>;
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