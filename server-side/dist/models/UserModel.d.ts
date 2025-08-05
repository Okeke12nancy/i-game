import { User as UserType, UserWithoutPassword } from '../types/index.js';
declare class User implements UserType {
    id: number;
    username: string;
    password: string;
    total_wins: number;
    total_losses: number;
    created_at: Date;
    updated_at: Date;
    constructor(data?: Partial<UserType>);
    create(username: string, password: string): Promise<User>;
    findByUsername(username: string): Promise<User | null>;
    findById(id: number): Promise<User | null>;
    getTopPlayers(limit?: number): Promise<User[]>;
    updateStats(isWinner: boolean): Promise<User>;
    validatePassword(password: string): Promise<boolean>;
    toJSON(): UserWithoutPassword;
}
declare const _default: User;
export default _default;
//# sourceMappingURL=UserModel.d.ts.map