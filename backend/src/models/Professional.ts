import { getDatabase } from '../database/database';
import { v4 as uuidv4 } from 'uuid';

export interface Professional {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string | null;
  phone: string | null;
  specialties: string[];
  hours_worked: number;
  created_at: string;
  updated_at: string;
}

export interface CreateProfessionalDTO {
  name: string;
  email: string;
  role: string;
  department?: string;
  phone?: string;
  specialties?: string[];
}

export class ProfessionalModel {
  static async create(data: CreateProfessionalDTO): Promise<Professional> {
    const db = await getDatabase();
    const id = uuidv4();
    const specialties = JSON.stringify(data.specialties || []);

    await db.run(
      `INSERT INTO professionals (id, name, email, role, department, phone, specialties, hours_worked, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [id, data.name, data.email, data.role, data.department || null, data.phone || null, specialties, 0]
    );

    const professional = await this.findById(id);
    if (!professional) {
      throw new Error('Error al crear el profesional');
    }
    return professional;
  }

  static async findById(id: string): Promise<Professional | undefined> {
    const db = await getDatabase();
    const professional = await db.get('SELECT * FROM professionals WHERE id = ?', [id]);
    
    if (professional) {
      professional.specialties = JSON.parse(professional.specialties || '[]');
    }
    
    return professional;
  }

  static async findAll(): Promise<Professional[]> {
    const db = await getDatabase();
    const professionals = await db.all('SELECT * FROM professionals ORDER BY name');
    
    return professionals.map(p => ({
      ...p,
      specialties: JSON.parse(p.specialties || '[]')
    }));
  }

  static async update(id: string, data: Partial<CreateProfessionalDTO>): Promise<Professional> {
    const db = await getDatabase();
    const updates: any = { ...data };
    
    if (data.specialties) {
      updates.specialties = JSON.stringify(data.specialties);
    }

    // Construir la consulta de actualización dinámicamente
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updates), id];

    if (fields.length > 0) {
      await db.run(
        `UPDATE professionals SET ${fields}, updated_at = datetime('now') WHERE id = ?`,
        values
      );
    }

    const professional = await this.findById(id);
    if (!professional) {
      throw new Error('Profesional no encontrado');
    }
    return professional;
  }

  static async delete(id: string): Promise<void> {
    const db = await getDatabase();
    await db.run('DELETE FROM professionals WHERE id = ?', [id]);
  }

  static async search(term: string): Promise<Professional[]> {
    const db = await getDatabase();
    const searchTerm = `%${term}%`;
    
    const professionals = await db.all(
      `SELECT * FROM professionals 
       WHERE name LIKE ? OR email LIKE ? OR role LIKE ?
       ORDER BY name`,
      [searchTerm, searchTerm, searchTerm]
    );

    return professionals.map(p => ({
      ...p,
      specialties: JSON.parse(p.specialties || '[]')
    }));
  }

  static async getProjectProfessionals(projectId: string): Promise<Professional[]> {
    const db = await getDatabase();
    
    const professionals = await db.all(
      `SELECT p.* FROM professionals p
       INNER JOIN project_resources pr ON p.id = pr.professional_id
       WHERE pr.project_id = ?
       ORDER BY p.name`,
      [projectId]
    );

    return professionals.map(p => ({
      ...p,
      specialties: JSON.parse(p.specialties || '[]')
    }));
  }

  static async getByEmail(email: string): Promise<Professional | undefined> {
    const db = await getDatabase();
    const professional = await db.get('SELECT * FROM professionals WHERE email = ?', [email]);
    
    if (professional) {
      professional.specialties = JSON.parse(professional.specialties || '[]');
    }
    
    return professional;
  }
}