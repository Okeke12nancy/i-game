import GameSession from "../models/game.js";
import PlayerSession from "../models/gamePlayer.js";
import User from '../models/UserModel.js';
import logger from '../utils/logger.js';

class GameService{
    constructor(){
        this.activeSession = null;
        this.sessionTimer = null;
        this.sessionDuration = parseInt(process.env.SESSION_DURATION) || 20000;
        this.sessionInterval = parseInt(process.env.SESSION_INTERVAL) || 30000;
        this.maxPlayers = parseInt(process.env.MAX_PLAYERS_PER_SESSION) || 10;
    }
    async initialize(){
        try{
            this.activeSession = await GameSession.findActive();

            if(this.activeSession){
                logger.info('Found existing active session:', this.activeSession.id);
                this.startSessionTimer();
            }else {
                this.scheduleNextSession();
            }
        } catch (error){
            logger.error('Error initializing game service:', error)
        }
    }
    async createNewSession(createdBy){
        try{
            const session = await GameSession.create(createdBy);
            logger.info('Created new game session:', session.id);
            return session;
        } catch (error){
            logger.error('Error creating new session:', error);
            throw error;
        }
    }

    async activateSession(sessionId){
        try{
            const session = await GameSession.findById(sessionId);
            if(!session){
                throw new Error('Session not found');
            }

            await session.activate();
            this.activateSession = session;
            this.startSessionTimer();

            logger.info('Activated session:', sessionId);
            return session;
        } catch (error){
            logger.error('Error activating session:', error);
            throw error;
        }
    }

      async joinSession(userId, selectedNumber) {
    try {
      if (!this.activeSession || this.activeSession.status !== 'active') {
        throw new Error('No active session available');
      }

      const playerCount = await PlayerSession.getSessionPlayerCount(this.activeSession.id);
      
      if (playerCount >= this.maxPlayers) {
        throw new Error('Session is full');
      }

      const existingPlayer = await PlayerSession.findByUserAndSession(userId, this.activeSession.id);
      if (existingPlayer) {
        throw new Error('User already in session');
      }

      const playerSession = await PlayerSession.create(userId, this.activeSession.id, selectedNumber);
      logger.info(`User ${userId} joined session ${this.activeSession.id} with number ${selectedNumber}`);
      
      return playerSession;
    } catch (error) {
      logger.error('Error joining session:', error);
      throw error;
    }
  }
  async leaveSession(userId){
    try{
        if(!this.activeSession){
            throw new Error('No active session');
        }
        const removed = await PlayerSession.removeFromSession(userId, this.activeSession.id);
        if(removed){
            logger.info(`User ${userId} left session ${this.activeSession.id}`);
        }
        return removed;
    } catch (error){
        logger.error('Error leaving session:', error);
        throw error;
    }
  }

  async completeSession(){
    try{
        if(!this.activeSession){
            logger.warn('No active session to complete');
            return;
        }

        const winningNumber = Math.floor(Math.random() * 9) + 1;

        await PlayerSession.markWinners(this.activeSession.id, winningNumber);

        await this.activeSession.complete(winningNumber);

        await this.updateUserStats(this.activeSession.id);

        logger.info(`Completed session ${this.activeSession.id} with winning number ${winningNumber}`);

        this.activeSession = null;

        this.scheduleNextSession();

        return {
            sessionId: this.activeSession?.id, winningNumber,
            participants: await PlayerSession.getSessionParticipants(this.activeSession?.id), wimmers: await PlayerSession.getSessionWinners(this.activeSession?.id)
        };

    } catch (error) {
        logger.error('Error completing session:', error);
        throw error;
    }
  }

async updateUserStats(sessionId){
    try{
        const participants = await PlayerSession.getSessionParticipants(sessionId);

        for (const participant of participants){
            const user = await User.findById(participants.userId);
            if(user){
                await user.updateStats(participants.is_winner)
            }
        }

        logger.info(`Updated stats for ${participants.length} participants`);
    } catch (error){
        logger.error('Error updating user stats:', error);
        throw error;
    }
}

startSessionTimer() {
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
    }

    this.sessionTimer = setTimeout(async () => {
      try {
        await this.completeSession();
      } catch (error) {
        logger.error('Error in session timer:', error);
      }
    }, this.sessionDuration);
  }

  scheduleNextSession() {
    setTimeout(async () => {
      try {
        const newSession = await this.createNewSession(1); // System user ID
        await this.activateSession(newSession.id);
      } catch (error) {
        logger.error('Error scheduling next session:', error);
      }
    }, this.sessionInterval);
  }

  getActiveSession() {
    return this.activeSession;
  }

  getSessionInfo() {
    if (!this.activeSession) {
      return null;
    }

    return {
      id: this.activeSession.id,
      status: this.activeSession.status,
      startTime: this.activeSession.start_time,
      timeRemaining: this.calculateTimeRemaining(),
      maxPlayers: this.maxPlayers
    };
  }
    calculateTimeRemaining() {
    if (!this.activeSession || !this.activeSession.start_time) {
      return 0;
    }

    const startTime = new Date(this.activeSession.start_time).getTime();
    const currentTime = Date.now();
    const elapsed = currentTime - startTime;
    const remaining = this.sessionDuration - elapsed;
    
    return Math.max(0, Math.floor(remaining / 1000));
  }

  async getSessionParticipants(sessionId) {
    try {
      return await PlayerSession.getSessionParticipants(sessionId);
    } catch (error) {
      logger.error('Error getting session participants:', error);
      throw error;
    }
  }

  async getSessionWinners(sessionId) {
    try {
      return await PlayerSession.getSessionWinners(sessionId);
    } catch (error) {
      logger.error('Error getting session winners:', error);
      throw error;
    }
  }
}

export default new GameService(); 