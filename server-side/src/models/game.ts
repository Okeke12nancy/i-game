import logger from "../utils/logger.js";
import { GameSession as GameSessionType } from "../types/index.js";
import { supabase } from "../config/supabaseConfig.js";

class GameSession implements GameSessionType {
  id: number;
  status: "waiting" | "active" | "completed";
  winning_number: number | null;
  start_time: Date | null;
  end_time: Date | null;
  created_at: Date;
  updated_at: Date;
  created_by: number;

  constructor(data: Partial<GameSessionType> = {}) {
    this.id = data.id || 0;
    this.status = data.status || "waiting";
    this.winning_number = data.winning_number || null;
    this.start_time = data.start_time || null;
    this.end_time = data.end_time || null;
    this.created_at = data.created_at || new Date();
    this.updated_at = data.updated_at || new Date();
    this.created_by = data.created_by || 0;
  }

  // ✅ Create a new game session
  static async create(createdBy: number): Promise<GameSession> {
    try {
      const { data, error } = await supabase
        .from("game_sessions")
        .insert([{ status: "waiting", created_by: createdBy, start_time: new Date() }])
        .select("*")
        .single();

      if (error) throw error;
      return new GameSession(data);
    } catch (error) {
      logger.error("Error creating game session:", error);
      throw error;
    }
  }

  // ✅ Find the most recent active session
  static async findActive(): Promise<GameSession | null> {
    try {
      const { data, error } = await supabase
        .from("game_sessions")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data ? new GameSession(data) : null;
    } catch (error) {
      logger.error("Error finding active session:", error);
      throw error;
    }
  }

  // ✅ Find a session by ID
  static async findById(id: number): Promise<GameSession | null> {
    try {
      const { data, error } = await supabase
        .from("game_sessions")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data ? new GameSession(data) : null;
    } catch (error) {
      logger.error("Error finding game session by ID:", error);
      throw error;
    }
  }

  // ✅ Get sessions by a specific date
  static async getSessionsByDate(date: string): Promise<GameSession[]> {
    try {
      const { data, error } = await supabase
        .from("game_sessions")
        .select("*")
        .filter("created_at", "gte", `${date} 00:00:00`)
        .filter("created_at", "lte", `${date} 23:59:59`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data.map((row: any) => new GameSession(row));
    } catch (error) {
      logger.error("Error getting sessions by date:", error);
      throw error;
    }
  }

  // ✅ Get recent sessions
  static async getRecentSessions(limit: number = 10): Promise<GameSession[]> {
    try {
      const { data, error } = await supabase
        .from("game_sessions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data.map((row: any) => new GameSession(row));
    } catch (error) {
      logger.error("Error getting recent sessions:", error);
      throw error;
    }
  }

  // ✅ Activate a session
  async activate(): Promise<GameSession> {
    try {
      const { data, error } = await supabase
        .from("game_sessions")
        .update({ status: "active", start_time: new Date(), updated_at: new Date() })
        .eq("id", this.id)
        .select("*")
        .single();

      if (error) throw error;
      Object.assign(this, data);
      return this;
    } catch (error) {
      logger.error("Error activating session:", error);
      throw error;
    }
  }

  // ✅ Complete a session
  async complete(winningNumber: number | null = null): Promise<GameSession> {
    try {
      const updateData: any = {
        status: "completed",
        end_time: new Date(),
        updated_at: new Date(),
      };
      if (winningNumber !== null) updateData.winning_number = winningNumber;

      const { data, error } = await supabase
        .from("game_sessions")
        .update(updateData)
        .eq("id", this.id)
        .select("*")
        .single();

      if (error) throw error;
      Object.assign(this, data);
      return this;
    } catch (error) {
      logger.error("Error completing session:", error);
      throw error;
    }
  }

  // ✅ Get session participants
  async getParticipants(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from("player_sessions")
        .select("selected_number, is_winner, created_at, users:users!inner(id, username)")
        .eq("session_id", this.id)
        .order("created_at", { ascending: true });

      if (error) throw error;

      return data.map((row: any) => ({
        id: row.users?.[0]?.id,
        username: row?.users?.[0]?.username,
        selected_number: row.selected_number,
        is_winner: row.is_winner,
        created_at: row.created_at,
      }));
    } catch (error) {
      logger.error("Error getting session participants:", error);
      throw error;
    }
  }

  // ✅ Get winners for this session
  async getWinners(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from("player_sessions")
        .select("selected_number, users:users!inner(id, username)")
        .eq("session_id", this.id)
        .eq("is_winner", true)
        .order("created_at", { ascending: true });

      if (error) throw error;

      return data.map((row: any) => ({
        id: row?.users?.[0]?.id,
        username: row?.users?.[0]?.username,
        selected_number: row.selected_number,
      }));
    } catch (error) {
      logger.error("Error getting session winners:", error);
      throw error;
    }
  }

  // ✅ Convert to JSON
  toJSON(): GameSessionType {
    return {
      id: this.id,
      status: this.status,
      winning_number: this.winning_number,
      start_time: this.start_time,
      end_time: this.end_time,
      created_at: this.created_at,
      updated_at: this.updated_at,
      created_by: this.created_by,
    };
  }
}

export default GameSession;
