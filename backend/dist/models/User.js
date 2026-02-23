"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const database_1 = require("../database/database");
const bcrypt_1 = __importDefault(require("bcrypt"));
const uuid_1 = require("uuid");
class UserModel {
    static async create(userData) {
        const db = await (0, database_1.getDatabase)();
        const id = (0, uuid_1.v4)();
        const hashedPassword = await bcrypt_1.default.hash(userData.password, 10);
        await db.run(`INSERT INTO users (id, name, email, password, role, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`, [id, userData.name, userData.email, hashedPassword, 'user']);
        const user = await db.get('SELECT * FROM users WHERE id = ?', [id]);
        return user;
    }
    static async findByEmail(email) {
        const db = await (0, database_1.getDatabase)();
        return db.get('SELECT * FROM users WHERE email = ?', [email]);
    }
    static async findById(id) {
        const db = await (0, database_1.getDatabase)();
        return db.get('SELECT * FROM users WHERE id = ?', [id]);
    }
    static async update(id, data) {
        const db = await (0, database_1.getDatabase)();
        const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
        const values = [...Object.values(data), id];
        await db.run(`UPDATE users SET ${fields}, updated_at = datetime('now') WHERE id = ?`, values);
        return this.findById(id);
    }
    static async delete(id) {
        const db = await (0, database_1.getDatabase)();
        await db.run('DELETE FROM users WHERE id = ?', [id]);
    }
    static async validatePassword(user, password) {
        return bcrypt_1.default.compare(password, user.password);
    }
}
exports.UserModel = UserModel;
