import bcrypt from "bcryptjs";
import logger from '../utils/logger.js';
import { supabase } from '../config/supabaseConfig';
class User {
    id;
    username;
    password;
    total_wins;
    total_losses;
    created_at;
    updated_at;
    constructor(data = {}) {
        this.id = data.id || 0;
        this.username = data.username || '';
        this.password = data.password || '';
        this.total_wins = data.total_wins || 0;
        this.total_losses = data.total_losses || 0;
        this.created_at = data.created_at || new Date();
        this.updated_at = data.updated_at || new Date();
    }
    async create(username, password) {
        try {
            const hashedPassword = await bcrypt.hash(password, 12);
            const { data, error } = await supabase
                .from('users')
                .insert([{ username, password: hashedPassword, total_wins: 0, total_losses: 0 }])
                .select('*')
                .single();
            if (error)
                throw error;
            return new User(data);
        }
        catch (error) {
            logger.error('Error creating user:', error);
            throw error;
        }
    }
    async findByUsername(username) {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('username', username)
                .single();
            if (error && error.code !== 'PGRST116')
                throw error;
            return data ? new User(data) : null;
        }
        catch (error) {
            logger.error('Error finding user by username:', error);
            throw error;
        }
    }
    async findById(id) {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', id)
                .single();
            if (error && error.code !== 'PGRST116')
                throw error;
            return data ? new User(data) : null;
        }
        catch (error) {
            logger.error('Error finding user by ID:', error);
            throw error;
        }
    }
    async getTopPlayers(limit = 10) {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('id, username, total_wins, total_losses, created_at, updated_at')
                .order('total_wins', { ascending: false })
                .order('total_losses', { ascending: true })
                .limit(limit);
            if (error)
                throw error;
            return data.map((row) => new User(row));
        }
        catch (error) {
            logger.error('Error getting top players:', error);
            throw error;
        }
    }
    async updateStats(isWinner) {
        try {
            const field = isWinner ? 'total_wins' : 'total_losses';
            const { data, error } = await supabase
                .from('users')
                .update({ [field]: this[field] + 1, updated_at: new Date() })
                .eq('id', this.id)
                .select('*')
                .single();
            if (error)
                throw error;
            const updatedUser = new User(data);
            Object.assign(this, updatedUser);
            return this;
        }
        catch (error) {
            logger.error('Error updating user stats:', error);
            throw error;
        }
    }
    async validatePassword(password) {
        return await bcrypt.compare(password, this.password);
    }
    toJSON() {
        return {
            id: this.id,
            username: this.username,
            total_wins: this.total_wins,
            total_losses: this.total_losses,
            created_at: this.created_at,
            updated_at: this.updated_at,
        };
    }
}
export default new User();
//# sourceMappingURL=UserModel.js.map