import GameSession from "../models/game.js";
import PlayerSession from "../models/gamePlayer.js";
import User from "../models/UserModel.js";
import logger from "../utils/logger.js";
class GameService {
    activeSession = null;
    sessionTimer = null;
    sessionDuration;
    sessionInterval;
    maxPlayers;
    constructor() {
        this.activeSession = null;
        this.sessionTimer = null;
        this.sessionDuration = parseInt(process.env.SESSION_DURATION || '30000');
        this.sessionInterval = parseInt(process.env.SESSION_INTERVAL || '30000');
        this.maxPlayers = parseInt(process.env.MAX_PLAYERS_PER_SESSION || '10');
    }
    async createSession(userId) {
        try {
            this.activeSession = await GameSession.findActive();
            if (this.activeSession) {
                const timeRemaining = this.calculateTimeRemaining();
                if (timeRemaining <= 0) {
                    logger.warn(`Found expired active session ${this.activeSession.id}, completing it now...`);
                    await this.completeSession();
                }
                else {
                    logger.info(`Found existing active session: ${this.activeSession.id}`);
                    return { alreadyActive: true, session: await this.getSessionInfo() };
                }
            }
            const newSession = await this.createNewSession(userId);
            await this.activateSession(newSession.id);
            return { alreadyActive: false, session: await this.getSessionInfo() };
        }
        catch (error) {
            logger.error("Error creating a new session:", error);
            throw error;
        }
    }
    async createNewSession(createdBy) {
        try {
            const session = await GameSession.create(createdBy);
            logger.info("Created new game session:", session.id);
            return session;
        }
        catch (error) {
            logger.error("Error creating new session:", error);
            throw error;
        }
    }
    async activateSession(sessionId) {
        try {
            const session = await GameSession.findById(sessionId);
            if (!session)
                throw new Error("Session not found");
            await session.activate();
            this.activeSession = session;
            this.startSessionTimer();
            if (global.io) {
                global.io.to("game_room").emit("session_started", {
                    sessionId: sessionId,
                    timeRemaining: this.sessionDuration / 1000,
                    message: "New session started"
                });
            }
            logger.info("Activated session:", sessionId);
            return session;
        }
        catch (error) {
            logger.error("Error activating session:", error);
            throw error;
        }
    }
    async joinSession(userId, selectedNumber) {
        try {
            if (!this.activeSession || this.activeSession.status !== "active") {
                throw new Error("No active session available");
            }
            const playerCount = await PlayerSession.getSessionPlayerCount(this.activeSession.id);
            if (playerCount >= this.maxPlayers)
                throw new Error("Session is full");
            const existingPlayer = await PlayerSession.findByUserAndSession(userId, this.activeSession.id);
            if (existingPlayer)
                throw new Error("User already in session");
            const playerSession = await PlayerSession.create(userId, this.activeSession.id, selectedNumber);
            const user = await User.findById(userId);
            if (global.io && user) {
                global.io.to("game_room").emit("player_joined", {
                    sessionId: this.activeSession.id,
                    userId: userId,
                    username: user.username,
                    selectedNumber: selectedNumber
                });
            }
            logger.info(`User ${userId} joined session ${this.activeSession.id} with number ${selectedNumber}`);
            return playerSession;
        }
        catch (error) {
            logger.error("Error joining session:", error);
            throw error;
        }
    }
    async leaveSession(userId) {
        try {
            const userSession = await PlayerSession.getUserActiveSession(userId);
            if (!userSession) {
                return true;
            }
            if (!this.activeSession) {
                const removed = await PlayerSession.removeFromSession(userId, userSession.session_id);
                if (removed) {
                    logger.info(`User ${userId} removed from completed session ${userSession.session_id}`);
                }
                return removed;
            }
            const removed = await PlayerSession.removeFromSession(userId, this.activeSession.id);
            if (removed) {
                const user = await User.findById(userId);
                if (global.io && user) {
                    global.io.to("game_room").emit("player_left", {
                        sessionId: this.activeSession.id,
                        userId: userId,
                        username: user.username
                    });
                }
                logger.info(`User ${userId} left session ${this.activeSession.id}`);
            }
            return removed;
        }
        catch (error) {
            logger.error("Error leaving session:", error);
            throw error;
        }
    }
    async completeSession() {
        try {
            if (!this.activeSession || this.activeSession.status === "completed") {
                logger.warn("No active session to complete or already completed");
                return;
            }
            const sessionId = this.activeSession.id;
            const winningNumber = Math.floor(Math.random() * 9) + 1;
            await PlayerSession.markWinners(sessionId, winningNumber);
            await this.activeSession.complete(winningNumber);
            await this.updateUserStats(sessionId);
            const participants = await PlayerSession.getSessionParticipants(sessionId);
            const winners = await PlayerSession.getSessionWinners(sessionId);
            logger.info(`Completed session ${sessionId} with winning number ${winningNumber}`);
            if (global.io) {
                global.io.to("game_room").emit("session_ended", {
                    sessionId,
                    winningNumber,
                    participantCount: participants.length,
                    message: "Session ended"
                });
                global.io.to("game_room").emit("game_result", {
                    sessionId,
                    winningNumber,
                    participantCount: participants.length,
                    participants: participants.map((p) => ({
                        id: p.user_id,
                        username: p.username,
                        selectedNumber: p.selected_number,
                        isWinner: p.is_winner,
                    })),
                    winners: winners.map((w) => ({
                        id: w.user_id,
                        username: w.username,
                        selectedNumber: w.selected_number,
                    })),
                });
            }
            this.activeSession = null;
            return {
                sessionId,
                winningNumber,
                participants,
                winners,
            };
        }
        catch (error) {
            logger.error("Error completing session:", error);
            throw error;
        }
    }
    async updateUserStats(sessionId) {
        try {
            const participants = await PlayerSession.getSessionParticipants(sessionId);
            for (const participant of participants) {
                const user = await User.findById(participant.user_id);
                if (user)
                    await user.updateStats(participant.is_winner);
            }
            logger.info(`Updated stats for ${participants.length} participants`);
        }
        catch (error) {
            logger.error("Error updating user stats:", error);
            throw error;
        }
    }
    startSessionTimer() {
        if (this.sessionTimer)
            clearTimeout(this.sessionTimer);
        const countdownInterval = setInterval(() => {
            const timeRemaining = this.calculateTimeRemaining();
            if (timeRemaining <= 0) {
                clearInterval(countdownInterval);
                return;
            }
            if (global.io) {
                global.io.to("game_room").emit("countdown_update", {
                    timeRemaining: timeRemaining
                });
            }
        }, 1000);
        this.sessionTimer = setTimeout(async () => {
            try {
                clearInterval(countdownInterval);
                await this.completeSession();
            }
            catch (error) {
                logger.error("Error in session timer:", error);
            }
        }, this.sessionDuration);
    }
    async getSessionInfo() {
        if (!this.activeSession) {
            return null;
        }
        const timeRemaining = this.calculateTimeRemaining();
        if (timeRemaining <= 0 && this.activeSession.status === "active") {
            await this.completeSession();
            return null;
        }
        const playerCount = await PlayerSession.getSessionPlayerCount(this.activeSession.id);
        const participants = await PlayerSession.getSessionParticipants(this.activeSession.id);
        const creator = await User.findById(this.activeSession.created_by);
        return {
            id: this.activeSession.id,
            status: this.activeSession.status,
            startTime: this.activeSession.start_time,
            timeRemaining,
            maxPlayers: this.maxPlayers,
            playerCount,
            participants,
            createdBy: creator
                ? { id: creator.id, username: creator.username }
                : null,
        };
    }
    calculateTimeRemaining() {
        if (!this.activeSession || !this.activeSession.start_time)
            return 0;
        const startTime = new Date(this.activeSession.start_time).getTime();
        const elapsed = Date.now() - startTime;
        const remaining = this.sessionDuration - elapsed;
        return Math.max(0, Math.floor(remaining / 1000));
    }
    async getSessionParticipants(sessionId) {
        try {
            return await PlayerSession.getSessionParticipants(sessionId);
        }
        catch (error) {
            logger.error("Error getting session participants:", error);
            throw error;
        }
    }
    async getSessionWinners(sessionId) {
        try {
            return await PlayerSession.getSessionWinners(sessionId);
        }
        catch (error) {
            logger.error("Error getting session winners:", error);
            throw error;
        }
    }
    getActiveSession() {
        return this.activeSession;
    }
}
export default new GameService();
//# sourceMappingURL=gameService.js.map