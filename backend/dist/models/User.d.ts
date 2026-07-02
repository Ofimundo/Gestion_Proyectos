export interface User {
    Id: number;
    Nombre: string;
    Email: string;
    PasswordHash: string;
    Rol: string;
    Activo: boolean;
    FechaCreacion: string;
    FechaActualizacion: string | null;
    UltimoAcceso: string | null;
}
export interface CreateUserDTO {
    nombre: string;
    email: string;
    password: string;
    username?: string;
    empresa?: string;
    role?: string;
}
export declare class UserModel {
    static create(userData: CreateUserDTO): Promise<User>;
    static findByEmail(email: string): Promise<User | undefined>;
    static findByEmailOrUsername(identifier: string): Promise<User | undefined>;
    static findById(id: number): Promise<User | undefined>;
    static update(id: number, data: Partial<CreateUserDTO>): Promise<User>;
    static updatePassword(id: number, newPassword: string): Promise<boolean>;
    static delete(id: number): Promise<void>;
    static validatePassword(user: User, password: string): Promise<boolean>;
    static findAll(): Promise<User[]>;
    static toggleActive(id: number): Promise<boolean>;
    static changeRole(id: number, newRole: string): Promise<boolean>;
    static updateLastAccess(id: number): Promise<void>;
    static getStats(): Promise<any>;
}
export default UserModel;
//# sourceMappingURL=User.d.ts.map