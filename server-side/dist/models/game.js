import logger from "../utils/logger.js";
import { supabase } from "../config/supabaseConfig.js";
class GameSession {
    id;
    status;
    winning_number;
    start_time;
    end_time;
    created_at;
    updated_at;
    created_by;
    constructor(data = {}) {
        this.id = data.id || 0;
        this.status = data.status || "waiting";
        this.winning_number = data.winning_number || null;
        this.start_time = data.start_time || null;
        this.end_time = data.end_time || null;
        this.created_at = data.created_at || new Date();
        this.updated_at = data.updated_at || new Date();
        this.created_by = data.created_by || 0;
    }
    static async create(createdBy) {
        try {
            const { data, error } = await supabase
                .from("game_sessions")
                .insert([{ status: "waiting", created_by: createdBy, start_time: new Date() }])
                .select("*")
                .single();
            if (error)
                throw error;
            return new GameSession(data);
        }
        catch (error) {
            logger.error("Error creating game session:", error);
            throw error;
        }
    }
    static async findActive() {
        try {
            const { data, error } = await supabase
                .from("game_sessions")
                .select("*")
                .eq("status", "active")
                .order("created_at", { ascending: false })
                .limit(1)
                .maybeSingle();
            if (error)
                throw error;
            return data ? new GameSession(data) : null;
        }
        catch (error) {
            logger.error("Error finding active session:", error);
            throw error;
        }
    }
    static async findById(id) {
        try {
            const { data, error } = await supabase
                .from("game_sessions")
                .select("*")
                .eq("id", id)
                .maybeSingle();
            if (error)
                throw error;
            return data ? new GameSession(data) : null;
        }
        catch (error) {
            logger.error("Error finding game session by ID:", error);
            throw error;
        }
    }
    static async getSessionsByDate(date) {
        try {
            const { data, error } = await supabase
                .from("game_sessions")
                .select("*")
                .filter("created_at", "gte", `${date} 00:00:00`)
                .filter("created_at", "lte", `${date} 23:59:59`)
                .order("created_at", { ascending: false });
            if (error)
                throw error;
            return data.map((row) => new GameSession(row));
        }
        catch (error) {
            logger.error("Error getting sessions by date:", error);
            throw error;
        }
    }
    static async getRecentSessions(limit = 10) {
        try {
            const { data, error } = await supabase
                .from("game_sessions")
                .select("*")
                .order("created_at", { ascending: false })
                .limit(limit);
            if (error)
                throw error;
            return data.map((row) => new GameSession(row));
        }
        catch (error) {
            logger.error("Error getting recent sessions:", error);
            throw error;
        }
    }
    async activate() {
        try {
            const { data, error } = await supabase
                .from("game_sessions")
                .update({ status: "active", start_time: new Date(), updated_at: new Date() })
                .eq("id", this.id)
                .select("*")
                .single();
            if (error)
                throw error;
            Object.assign(this, data);
            return this;
        }
        catch (error) {
            logger.error("Error activating session:", error);
            throw error;
        }
    }
    async complete(winningNumber = null) {
        try {
            const updateData = {
                status: "completed",
                end_time: new Date(),
                updated_at: new Date(),
            };
            if (winningNumber !== null)
                updateData.winning_number = winningNumber;
            const { data, error } = await supabase
                .from("game_sessions")
                .update(updateData)
                .eq("id", this.id)
                .select("*")
                .single();
            if (error)
                throw error;
            Object.assign(this, data);
            return this;
        }
        catch (error) {
            logger.error("Error completing session:", error);
            throw error;
        }
    }
    async getParticipants() {
        try {
            const { data, error } = await supabase
                .from("player_sessions")
                .select("selected_number, is_winner, created_at, users:users!inner(id, username)")
                .eq("session_id", this.id)
                .order("created_at", { ascending: true });
            if (error)
                throw error;
            return data.map((row) => ({
                id: row.users?.[0]?.id,
                username: row?.users?.[0]?.username,
                selected_number: row.selected_number,
                is_winner: row.is_winner,
                created_at: row.created_at,
            }));
        }
        catch (error) {
            logger.error("Error getting session participants:", error);
            throw error;
        }
    }
    async getWinners() {
        try {
            const { data, error } = await supabase
                .from("player_sessions")
                .select("selected_number, users:users!inner(id, username)")
                .eq("session_id", this.id)
                .eq("is_winner", true)
                .order("created_at", { ascending: true });
            if (error)
                throw error;
            return data.map((row) => ({
                id: row?.users?.[0]?.id,
                username: row?.users?.[0]?.username,
                selected_number: row.selected_number,
            }));
        }
        catch (error) {
            logger.error("Error getting session winners:", error);
            throw error;
        }
    }
    toJSON() {
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
//# sourceMappingURL=game.js.map