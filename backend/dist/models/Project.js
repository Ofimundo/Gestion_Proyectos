"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectModel = void 0;
const database_1 = require("../database/database");
const uuid_1 = require("uuid");
class ProjectModel {
    static generateCode(name) {
        const letters = name
            .replace(/[^a-zA-Z]/g, '')
            .toUpperCase()
            .slice(0, 4)
            .padEnd(4, 'X');
        const numbers = Math.floor(1000 + Math.random() * 9000).toString();
        return `${letters}-${numbers}`;
    }
    static async create(data) {
        const db = await (0, database_1.getDatabase)();
        const id = (0, uuid_1.v4)();
        const code = this.generateCode(data.name);
        await db.run(`INSERT INTO projects (
        id, code, name, client, leader, description, technologies,
        commercial_manager, sale_amount, hh_implementation, hh_period,
        start_date, end_date, client_contact, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`, [
            id, code, data.name, data.client, data.leader, data.description || null,
            data.technologies || null, data.commercialManager || null, data.saleAmount || 0,
            data.hhImplementation || 0, data.hhPeriod || 0, data.startDate || null,
            data.endDate || null, data.clientContact || null, 'Activo'
        ]);
        // Crear etapas
        if (data.stages && data.stages.length > 0) {
            for (const stage of data.stages) {
                await db.run(`INSERT INTO project_stages (id, project_id, name, status, hh_planificadas, hh_real)
           VALUES (?, ?, ?, ?, ?, ?)`, [(0, uuid_1.v4)(), id, stage.name, stage.status || 'No Iniciada', stage.hhPlanificadas || 0, stage.hhReal || 0]);
            }
        }
        else {
            // Crear etapas por defecto
            const defaultStages = [
                { name: 'Distribución de los Bot', status: 'No Iniciada', hhPlanificadas: 0, hhReal: 0 },
                { name: 'Desarrollo de los Bot Demo', status: 'No Iniciada', hhPlanificadas: 0, hhReal: 0 },
                { name: 'Presentación de la Demo', status: 'No Iniciada', hhPlanificadas: 0, hhReal: 0 },
                { name: 'Desarrollo de los bots para el cliente', status: 'No Iniciada', hhPlanificadas: 0, hhReal: 0 },
                { name: 'Desarrollo del Informe de Saldo', status: 'No Iniciada', hhPlanificadas: 0, hhReal: 0 },
                { name: 'Implementación de Prueba del RPA', status: 'No Iniciada', hhPlanificadas: 0, hhReal: 0 },
                { name: 'Desarrollo del Flujo de Caja', status: 'No Iniciada', hhPlanificadas: 0, hhReal: 0 }
            ];
            for (const stage of defaultStages) {
                await db.run(`INSERT INTO project_stages (id, project_id, name, status, hh_planificadas, hh_real)
           VALUES (?, ?, ?, ?, ?, ?)`, [(0, uuid_1.v4)(), id, stage.name, stage.status, stage.hhPlanificadas, stage.hhReal]);
            }
        }
        // Crear riesgos
        if (data.risks && data.risks.length > 0) {
            for (const risk of data.risks) {
                await db.run(`INSERT INTO project_risks (id, project_id, description, action, responsible, date)
           VALUES (?, ?, ?, ?, ?, ?)`, [(0, uuid_1.v4)(), id, risk.description, risk.action || null, risk.responsible || null, risk.date || null]);
            }
        }
        // Asignar recursos
        if (data.resources && data.resources.length > 0) {
            for (const professionalId of data.resources) {
                await db.run(`INSERT INTO project_resources (project_id, professional_id)
           VALUES (?, ?)`, [id, professionalId]);
            }
        }
        const project = await this.findById(id);
        if (!project) {
            throw new Error('Error al crear el proyecto');
        }
        return project;
    }
    static async findById(id) {
        const db = await (0, database_1.getDatabase)();
        const project = await db.get('SELECT * FROM projects WHERE id = ?', [id]);
        if (!project)
            return undefined;
        // Obtener etapas
        const stages = await db.all('SELECT * FROM project_stages WHERE project_id = ? ORDER BY name', [id]);
        // Obtener riesgos
        const risks = await db.all('SELECT * FROM project_risks WHERE project_id = ?', [id]);
        // Obtener recursos
        const resources = await db.all('SELECT professional_id FROM project_resources WHERE project_id = ?', [id]);
        return {
            ...project,
            stages,
            risks,
            resources: resources.map(r => r.professional_id)
        };
    }
    static async findAll() {
        const db = await (0, database_1.getDatabase)();
        const projects = await db.all('SELECT * FROM projects ORDER BY created_at DESC');
        const result = [];
        for (const project of projects) {
            const fullProject = await this.findById(project.id);
            if (fullProject)
                result.push(fullProject);
        }
        return result;
    }
    static async update(id, data) {
        const db = await (0, database_1.getDatabase)();
        // Verificar si el proyecto existe
        const existing = await this.findById(id);
        if (!existing) {
            throw new Error('Proyecto no encontrado');
        }
        // Actualizar proyecto
        const updates = {};
        if (data.name !== undefined)
            updates.name = data.name;
        if (data.client !== undefined)
            updates.client = data.client;
        if (data.leader !== undefined)
            updates.leader = data.leader;
        if (data.description !== undefined)
            updates.description = data.description;
        if (data.technologies !== undefined)
            updates.technologies = data.technologies;
        if (data.commercialManager !== undefined)
            updates.commercial_manager = data.commercialManager;
        if (data.saleAmount !== undefined)
            updates.sale_amount = data.saleAmount;
        if (data.hhImplementation !== undefined)
            updates.hh_implementation = data.hhImplementation;
        if (data.hhPeriod !== undefined)
            updates.hh_period = data.hhPeriod;
        if (data.startDate !== undefined)
            updates.start_date = data.startDate;
        if (data.endDate !== undefined)
            updates.end_date = data.endDate;
        if (data.clientContact !== undefined)
            updates.client_contact = data.clientContact;
        if (Object.keys(updates).length > 0) {
            const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
            const values = [...Object.values(updates), id];
            await db.run(`UPDATE projects SET ${fields}, updated_at = datetime('now') WHERE id = ?`, values);
        }
        // Actualizar etapas (eliminar y recrear)
        if (data.stages) {
            await db.run('DELETE FROM project_stages WHERE project_id = ?', [id]);
            for (const stage of data.stages) {
                await db.run(`INSERT INTO project_stages (id, project_id, name, status, hh_planificadas, hh_real)
           VALUES (?, ?, ?, ?, ?, ?)`, [(0, uuid_1.v4)(), id, stage.name, stage.status || 'No Iniciada', stage.hhPlanificadas || 0, stage.hhReal || 0]);
            }
        }
        // Actualizar riesgos
        if (data.risks) {
            await db.run('DELETE FROM project_risks WHERE project_id = ?', [id]);
            for (const risk of data.risks) {
                await db.run(`INSERT INTO project_risks (id, project_id, description, action, responsible, date)
           VALUES (?, ?, ?, ?, ?, ?)`, [(0, uuid_1.v4)(), id, risk.description, risk.action || null, risk.responsible || null, risk.date || null]);
            }
        }
        // Actualizar recursos
        if (data.resources) {
            await db.run('DELETE FROM project_resources WHERE project_id = ?', [id]);
            for (const professionalId of data.resources) {
                await db.run(`INSERT INTO project_resources (project_id, professional_id)
           VALUES (?, ?)`, [id, professionalId]);
            }
        }
        const project = await this.findById(id);
        if (!project) {
            throw new Error('Error al actualizar el proyecto');
        }
        return project;
    }
    static async delete(id) {
        const db = await (0, database_1.getDatabase)();
        // Verificar si el proyecto existe
        const existing = await this.findById(id);
        if (!existing) {
            throw new Error('Proyecto no encontrado');
        }
        await db.run('DELETE FROM projects WHERE id = ?', [id]);
    }
    static async search(term) {
        const db = await (0, database_1.getDatabase)();
        const searchTerm = `%${term}%`;
        const projects = await db.all(`SELECT * FROM projects 
       WHERE code LIKE ? OR name LIKE ? OR client LIKE ?
       ORDER BY created_at DESC`, [searchTerm, searchTerm, searchTerm]);
        const result = [];
        for (const project of projects) {
            const fullProject = await this.findById(project.id);
            if (fullProject)
                result.push(fullProject);
        }
        return result;
    }
    static async getStats() {
        const db = await (0, database_1.getDatabase)();
        const totalProjects = await db.get('SELECT COUNT(*) as count FROM projects');
        const totalHH = await db.get('SELECT SUM(hh_implementation) as total FROM projects');
        const activeProjects = await db.get(`SELECT COUNT(DISTINCT project_id) as count FROM project_stages WHERE status = 'En Curso'`);
        const totalResources = await db.get('SELECT COUNT(DISTINCT professional_id) as count FROM project_resources');
        return {
            totalProjects: totalProjects?.count || 0,
            totalHH: totalHH?.total || 0,
            activeProjects: activeProjects?.count || 0,
            totalResources: totalResources?.count || 0
        };
    }
    static async getByCode(code) {
        const db = await (0, database_1.getDatabase)();
        const project = await db.get('SELECT * FROM projects WHERE code = ?', [code]);
        if (!project)
            return undefined;
        return this.findById(project.id);
    }
}
exports.ProjectModel = ProjectModel;
