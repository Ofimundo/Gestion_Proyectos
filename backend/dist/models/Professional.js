"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfessionalModel = void 0;
const database_1 = require("../database/database");
const uuid_1 = require("uuid");
class ProfessionalModel {
    static async create(data) {
        const db = await (0, database_1.getDatabase)();
        const id = (0, uuid_1.v4)();
        const specialties = JSON.stringify(data.specialties || []);
        await db.run(`INSERT INTO professionals (id, name, email, role, department, phone, specialties, hours_worked, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`, [id, data.name, data.email, data.role, data.department || null, data.phone || null, specialties, 0]);
        const professional = await this.findById(id);
        if (!professional) {
            throw new Error('Error al crear el profesional');
        }
        return professional;
    }
    static async findById(id) {
        const db = await (0, database_1.getDatabase)();
        const professional = await db.get('SELECT * FROM professionals WHERE id = ?', [id]);
        if (professional) {
            professional.specialties = JSON.parse(professional.specialties || '[]');
        }
        return professional;
    }
    static async findAll() {
        const db = await (0, database_1.getDatabase)();
        const professionals = await db.all('SELECT * FROM professionals ORDER BY name');
        return professionals.map(p => ({
            ...p,
            specialties: JSON.parse(p.specialties || '[]')
        }));
    }
    static async update(id, data) {
        const db = await (0, database_1.getDatabase)();
        const updates = { ...data };
        if (data.specialties) {
            updates.specialties = JSON.stringify(data.specialties);
        }
        // Construir la consulta de actualización dinámicamente
        const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
        const values = [...Object.values(updates), id];
        if (fields.length > 0) {
            await db.run(`UPDATE professionals SET ${fields}, updated_at = datetime('now') WHERE id = ?`, values);
        }
        const professional = await this.findById(id);
        if (!professional) {
            throw new Error('Profesional no encontrado');
        }
        return professional;
    }
    static async delete(id) {
        const db = await (0, database_1.getDatabase)();
        await db.run('DELETE FROM professionals WHERE id = ?', [id]);
    }
    static async search(term) {
        const db = await (0, database_1.getDatabase)();
        const searchTerm = `%${term}%`;
        const professionals = await db.all(`SELECT * FROM professionals 
       WHERE name LIKE ? OR email LIKE ? OR role LIKE ?
       ORDER BY name`, [searchTerm, searchTerm, searchTerm]);
        return professionals.map(p => ({
            ...p,
            specialties: JSON.parse(p.specialties || '[]')
        }));
    }
    static async getProjectProfessionals(projectId) {
        const db = await (0, database_1.getDatabase)();
        const professionals = await db.all(`SELECT p.* FROM professionals p
       INNER JOIN project_resources pr ON p.id = pr.professional_id
       WHERE pr.project_id = ?
       ORDER BY p.name`, [projectId]);
        return professionals.map(p => ({
            ...p,
            specialties: JSON.parse(p.specialties || '[]')
        }));
    }
    static async getByEmail(email) {
        const db = await (0, database_1.getDatabase)();
        const professional = await db.get('SELECT * FROM professionals WHERE email = ?', [email]);
        if (professional) {
            professional.specialties = JSON.parse(professional.specialties || '[]');
        }
        return professional;
    }
}
exports.ProfessionalModel = ProfessionalModel;
