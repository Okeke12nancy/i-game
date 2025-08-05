import {supabase} from '../config/supabaseConfig.js';
import logger from '../utils/logger.js';
import { PlayerSession as PlayerSessionType } from '../types/index.js';

class PlayerSession implements PlayerSessionType {
  id: number;
  user_id: number;
  session_id: number;
  selected_number: number;
  is_winner: boolean;
  created_at: Date;
  updated_at: Date;

  constructor(data: Partial<PlayerSessionType> = {}) {
    this.id = data.id || 0;
    this.user_id = data.user_id || 0;
    this.session_id = data.session_id || 0;
    this.selected_number = data.selected_number || 0;
    this.is_winner = data.is_winner || false;
    this.created_at = data.created_at || new Date();
    this.updated_at = data.updated_at || new Date();
  }

  // ✅ Create a new player session
  async create(userId: number, sessionId: number, selectedNumber: number): Promise<PlayerSession> {
    try {
      const { data, error } = await supabase
        .from('player_sessions')
        .insert([{ user_id: userId, session_id: sessionId, selected_number: selectedNumber }])
        .select('*')
        .single();

      if (error) throw error;
      return new PlayerSession(data);
    } catch (error) {
      logger.error('Error creating player session:', error);
      throw error;
    }
  }

  // ✅ Find player session by user and session
  async findByUserAndSession(userId: number, sessionId: number): Promise<PlayerSession | null> {
    try {
      const { data, error } = await supabase
        .from('player_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('session_id', sessionId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data ? new PlayerSession(data) : null;
    } catch (error) {
      logger.error('Error finding player session:', error);
      throw error;
    }
  }

  // ✅ Get user's active session
  async getUserActiveSession(userId: number): Promise<PlayerSession | null> {
    try {
      const { data, error } = await supabase
        .from('player_sessions')
        .select('*, game_sessions!inner(status)')
        .eq('user_id', userId)
        .in('game_sessions.status', ['waiting', 'active'])
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      return data.length ? new PlayerSession({ ...data[0], session_status: data[0].game_sessions.status }) : null;
    } catch (error) {
      logger.error('Error getting user active session:', error);
      throw error;
    }
  }

  // ✅ Get session participants with usernames
  async getSessionParticipants(sessionId: number): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('player_sessions')
        .select('*, users!inner(username)')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data.map(row => ({
        ...new PlayerSession(row),
        username: row.users.username,
      }));
    } catch (error) {
      logger.error('Error getting session participants:', error);
      throw error;
    }
  }

  // ✅ Get session winners
  async getSessionWinners(sessionId: number): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('player_sessions')
        .select('*, users!inner(username)')
        .eq('session_id', sessionId)
        .eq('is_winner', true)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data.map(row => ({
        ...new PlayerSession(row),
        username: row.users.username,
      }));
    } catch (error) {
      logger.error('Error getting session winners:', error);
      throw error;
    }
  }

  async markWinners(sessionId: number, winningNumber: number): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('player_sessions')
        .update({ is_winner: true, updated_at: new Date() })
        .eq('session_id', sessionId)
        .eq('selected_number', winningNumber)
        .select('*');

      if (error) throw error;
      return count || 0;
    } catch (error) {
      logger.error('Error marking winners:', error);
      throw error;
    }
  }

  async removeFromSession(userId: number, sessionId: number): Promise<boolean> {
    try {
      const { error, count } = await supabase
        .from('player_sessions')
        .delete()
        .eq('user_id', userId)
        .eq('session_id', sessionId)
        .select('*');

      if (error) throw error;
      return count !== null && count > 0;
    } catch (error) {
      logger.error('Error removing player from session:', error);
      throw error;
    }
  }

  async getSessionPlayerCount(sessionId: number): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('player_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', sessionId);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      logger.error('Error getting session player count:', error);
      throw error;
    }
  }

  // ✅ Convert to JSON
  toJSON(): PlayerSessionType {
    return {
      id: this.id,
      user_id: this.user_id,
      session_id: this.session_id,
      selected_number: this.selected_number,
      is_winner: this.is_winner,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }
}

export default new PlayerSession();
