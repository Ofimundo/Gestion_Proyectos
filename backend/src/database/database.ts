import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

let db: Database | null = null;

export async function getDatabase(): Promise<Database> {
  if (db) return db;

  const databasePath = process.env.DATABASE_PATH || path.join(__dirname, '../../../database.sqlite');

  db = await open({
    filename: databasePath,
    driver: sqlite3.Database
  });

  // Habilitar foreign keys
  await db.exec('PRAGMA foreign_keys = ON');

  return db;
}

export async function initializeDatabase() {
  const db = await getDatabase();

  // Crear tablas
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS professionals (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL,
      department TEXT,
      phone TEXT,
      specialties TEXT,
      hours_worked INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      client TEXT NOT NULL,
      leader TEXT NOT NULL,
      description TEXT,
      technologies TEXT,
      commercial_manager TEXT,
      sale_amount REAL DEFAULT 0,
      hh_implementation INTEGER DEFAULT 0,
      hh_period INTEGER DEFAULT 0,
      start_date TEXT,
      end_date TEXT,
      client_contact TEXT,
      status TEXT DEFAULT 'Activo',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS project_stages (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      name TEXT NOT NULL,
      status TEXT DEFAULT 'No Iniciada',
      hh_planificadas INTEGER DEFAULT 0,
      hh_real INTEGER DEFAULT 0,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS project_risks (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      description TEXT NOT NULL,
      action TEXT,
      responsible TEXT,
      date TEXT,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS project_resources (
      project_id TEXT NOT NULL,
      professional_id TEXT NOT NULL,
      assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (project_id, professional_id),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (professional_id) REFERENCES professionals(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS password_resets (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expires_at DATETIME NOT NULL,
      used BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  console.log('Base de datos inicializada correctamente');
}