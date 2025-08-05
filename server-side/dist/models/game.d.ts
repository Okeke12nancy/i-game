import { GameSession as GameSessionType } from "../types/index.js";
declare class GameSession implements GameSessionType {
    id: number;
    status: "waiting" | "active" | "completed";
    winning_number: number | null;
    start_time: Date | null;
    end_time: Date | null;
    created_at: Date;
    updated_at: Date;
    created_by: number;
    constructor(data?: Partial<GameSessionType>);
    static create(createdBy: number): Promise<GameSession>;
    static findActive(): Promise<GameSession | null>;
    static findById(id: number): Promise<GameSession | null>;
    static getSessionsByDate(date: string): Promise<GameSession[]>;
    static getRecentSessions(limit?: number): Promise<GameSession[]>;
    activate(): Promise<GameSession>;
    complete(winningNumber?: number | null): Promise<GameSession>;
    getParticipants(): Promise<any[]>;
    getWinners(): Promise<any[]>;
    toJSON(): GameSessionType;
}
export default GameSession;
//# sourceMappingURL=game.d.ts.map