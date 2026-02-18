import { getDatabase } from '../database/database';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export interface CreateUserDTO {
  name: string;
  email: string;
  password: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export class UserModel {
  static async create(userData: CreateUserDTO): Promise<User> {
    const db = await getDatabase();
    const id = uuidv4();
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    await db.run(
      `INSERT INTO users (id, name, email, password, role, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [id, userData.name, userData.email, hashedPassword, 'user']
    );

    const user = await db.get('SELECT * FROM users WHERE id = ?', [id]);
    return user;
  }

  static async findByEmail(email: string): Promise<User | undefined> {
    const db = await getDatabase();
    return db.get('SELECT * FROM users WHERE email = ?', [email]);
  }

  static async findById(id: string): Promise<User | undefined> {
    const db = await getDatabase();
    return db.get('SELECT * FROM users WHERE id = ?', [id]);
  }

  static async update(id: string, data: Partial<User>): Promise<User | undefined> {
    const db = await getDatabase();
    const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(data), id];

    await db.run(
      `UPDATE users SET ${fields}, updated_at = datetime('now') WHERE id = ?`,
      values
    );

    return this.findById(id);
  }

  static async delete(id: string): Promise<void> {
    const db = await getDatabase();
    await db.run('DELETE FROM users WHERE id = ?', [id]);
  }

  static async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
  }
}