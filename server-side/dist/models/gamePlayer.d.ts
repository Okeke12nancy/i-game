import { PlayerSession as PlayerSessionType } from '../types/index.js';
declare class PlayerSession implements PlayerSessionType {
    id: number;
    user_id: number;
    session_id: number;
    selected_number: number;
    is_winner: boolean;
    created_at: Date;
    updated_at: Date;
    constructor(data?: Partial<PlayerSessionType>);
    create(userId: number, sessionId: number, selectedNumber: number): Promise<PlayerSession>;
    findByUserAndSession(userId: number, sessionId: number): Promise<PlayerSession | null>;
    getUserActiveSession(userId: number): Promise<PlayerSession | null>;
    getSessionParticipants(sessionId: number): Promise<any[]>;
    getSessionWinners(sessionId: number): Promise<any[]>;
    markWinners(sessionId: number, winningNumber: number): Promise<number>;
    removeFromSession(userId: number, sessionId: number): Promise<boolean>;
    getSessionPlayerCount(sessionId: number): Promise<number>;
    toJSON(): PlayerSessionType;
}
declare const _default: PlayerSession;
export default _default;
//# sourceMappingURL=gamePlayer.d.ts.map