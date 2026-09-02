"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FichaProspectoModel = void 0;
const database_1 = require("../database/database");
const mssql_1 = __importDefault(require("mssql"));
const GestionDemanda_1 = __importDefault(require("./GestionDemanda"));
class FichaProspectoModel {
    static async create(data) {
        const db = await (0, database_1.getDatabase)();
        const valorServicio = data.valorServicio !== undefined ? data.valorServicio : 0;
        const margen = data.margen !== undefined ? data.margen : 0;
        const rentabilidad = data.rentabilidad !== undefined ? data.rentabilidad : 0;
        const horasSoporte = data.horasSoporte !== undefined ? data.horasSoporte : 0;
        const totalIngresos = data.totalIngresos !== undefined ? data.totalIngresos : 0;
        const estimacionesJson = data.estimaciones ? JSON.stringify(data.estimaciones) : '{}';
        const result = await db.request()
            .input('Codigo', mssql_1.default.NVarChar, data.codigo || '')
            .input('NombreProyecto', mssql_1.default.NVarChar, data.nombreProyecto || '')
            .input('Estado', mssql_1.default.NVarChar, data.estado || 'No Iniciada')
            .input('Cliente', mssql_1.default.NVarChar, data.cliente || '')
            .input('GestorComercial', mssql_1.default.NVarChar, data.gestorComercial || null)
            .input('CentroCosto', mssql_1.default.NVarChar, data.centroCosto || null)
            .input('FechaEstimadaAdjudicacion', mssql_1.default.Date, data.fechaEstimadaAdjudicacion ? new Date(data.fechaEstimadaAdjudicacion) : null)
            .input('FechaAdjudicacion', mssql_1.default.Date, data.fechaAdjudicacion ? new Date(data.fechaAdjudicacion) : null)
            .input('ValorServicio', mssql_1.default.Decimal(18, 2), valorServicio)
            .input('Margen', mssql_1.default.Decimal(5, 2), margen)
            .input('Rentabilidad', mssql_1.default.Decimal(18, 2), rentabilidad)
            .input('PlazoEstimado', mssql_1.default.NVarChar, data.plazoEstimado || null)
            .input('LineaServicio', mssql_1.default.NVarChar, data.lineaServicio || null)
            .input('FechaInicio', mssql_1.default.Date, data.fechaInicio ? new Date(data.fechaInicio) : null)
            .input('FechaTermino', mssql_1.default.Date, data.fechaTermino ? new Date(data.fechaTermino) : null)
            .input('Garantia', mssql_1.default.NVarChar, data.garantia || null)
            .input('HorasSoporte', mssql_1.default.Int, horasSoporte)
            .input('TotalIngresos', mssql_1.default.Decimal(18, 2), totalIngresos)
            .input('Estimaciones', mssql_1.default.NVarChar, estimacionesJson)
            .input('TipoCliente', mssql_1.default.NVarChar, data.tipoCliente || 'Nuevo')
            .query(`
                INSERT INTO FichasProspecto (
                    Codigo, NombreProyecto, Estado, Cliente, GestorComercial, CentroCosto,
                    FechaEstimadaAdjudicacion, FechaAdjudicacion, ValorServicio, Margen, Rentabilidad,
                    PlazoEstimado, LineaServicio, FechaInicio, FechaTermino, Garantia, HorasSoporte,
                    TotalIngresos, Estimaciones, TipoCliente, FechaCreacion
                )
                VALUES (
                    @Codigo, @NombreProyecto, @Estado, @Cliente, @GestorComercial, @CentroCosto,
                    @FechaEstimadaAdjudicacion, @FechaAdjudicacion, @ValorServicio, @Margen, @Rentabilidad,
                    @PlazoEstimado, @LineaServicio, @FechaInicio, @FechaTermino, @Garantia, @HorasSoporte,
                    @TotalIngresos, @Estimaciones, @TipoCliente, GETDATE()
                );
                SELECT SCOPE_IDENTITY() AS Id;
            `);
        const newId = result.recordset[0].Id;
        const created = await this.findById(newId);
        if (!created)
            throw new Error('Error al crear la ficha de prospecto');
        // Sincronización automática a Gestión de la Demanda
        try {
            await this.createDemandaFromProspecto(created);
        }
        catch (err) {
            console.error('Error al sincronizar Prospecto a Gestión de la Demanda en creación:', err);
        }
        return created;
    }
    static async findById(id) {
        const db = await (0, database_1.getDatabase)();
        const result = await db.request()
            .input('Id', mssql_1.default.Int, Number(id))
            .query('SELECT * FROM FichasProspecto WHERE Id = @Id');
        const row = result.recordset[0];
        if (!row)
            return undefined;
        return this.parseFichaProspecto(row);
    }
    static async findAll() {
        const db = await (0, database_1.getDatabase)();
        const result = await db.request().query('SELECT * FROM FichasProspecto ORDER BY FechaCreacion DESC');
        return result.recordset.map(row => this.parseFichaProspecto(row));
    }
    static async update(id, data) {
        const db = await (0, database_1.getDatabase)();
        const fields = [];
        const request = db.request();
        const mappings = {
            codigo: { col: 'Codigo', type: mssql_1.default.NVarChar },
            nombreProyecto: { col: 'NombreProyecto', type: mssql_1.default.NVarChar },
            estado: { col: 'Estado', type: mssql_1.default.NVarChar },
            cliente: { col: 'Cliente', type: mssql_1.default.NVarChar },
            gestorComercial: { col: 'GestorComercial', type: mssql_1.default.NVarChar },
            centroCosto: { col: 'CentroCosto', type: mssql_1.default.NVarChar },
            fechaEstimadaAdjudicacion: { col: 'FechaEstimadaAdjudicacion', type: mssql_1.default.Date },
            fechaAdjudicacion: { col: 'FechaAdjudicacion', type: mssql_1.default.Date },
            valorServicio: { col: 'ValorServicio', type: mssql_1.default.Decimal(18, 2) },
            margen: { col: 'Margen', type: mssql_1.default.Decimal(5, 2) },
            rentabilidad: { col: 'Rentabilidad', type: mssql_1.default.Decimal(18, 2) },
            plazoEstimado: { col: 'PlazoEstimado', type: mssql_1.default.NVarChar },
            lineaServicio: { col: 'LineaServicio', type: mssql_1.default.NVarChar },
            fechaInicio: { col: 'FechaInicio', type: mssql_1.default.Date },
            fechaTermino: { col: 'FechaTermino', type: mssql_1.default.Date },
            garantia: { col: 'Garantia', type: mssql_1.default.NVarChar },
            horasSoporte: { col: 'HorasSoporte', type: mssql_1.default.Int },
            totalIngresos: { col: 'TotalIngresos', type: mssql_1.default.Decimal(18, 2) },
            tipoCliente: { col: 'TipoCliente', type: mssql_1.default.NVarChar }
        };
        Object.keys(mappings).forEach(key => {
            const val = data[key];
            if (val !== undefined) {
                const mapping = mappings[key];
                fields.push(`${mapping.col} = @${mapping.col}`);
                if (mapping.type === mssql_1.default.Date) {
                    request.input(mapping.col, mapping.type, val ? new Date(val) : null);
                }
                else {
                    request.input(mapping.col, mapping.type, val);
                }
            }
        });
        if (data.estimaciones !== undefined) {
            fields.push('Estimaciones = @Estimaciones');
            request.input('Estimaciones', mssql_1.default.NVarChar, JSON.stringify(data.estimaciones));
        }
        if (fields.length > 0) {
            request.input('Id', mssql_1.default.Int, Number(id));
            await request.query(`
                UPDATE FichasProspecto 
                SET ${fields.join(', ')}, FechaActualizacion = GETDATE() 
                WHERE Id = @Id
            `);
        }
        const updated = await this.findById(id);
        if (!updated)
            throw new Error('Ficha de prospecto no encontrada');
        // Sincronización automática a Gestión de la Demanda
        try {
            await this.createDemandaFromProspecto(updated);
        }
        catch (err) {
            console.error('Error al sincronizar Prospecto a Gestión de la Demanda:', err);
        }
        return updated;
    }
    static async delete(id) {
        const db = await (0, database_1.getDatabase)();
        await db.request()
            .input('Id', mssql_1.default.Int, Number(id))
            .query('DELETE FROM FichasProspecto WHERE Id = @Id');
    }
    static async createDemandaFromProspecto(prospecto) {
        const db = await (0, database_1.getDatabase)();
        const check = await db.request()
            .input('Proyecto', mssql_1.default.NVarChar, prospecto.nombreProyecto)
            .query('SELECT Id FROM GestionDemanda WHERE Proyecto = @Proyecto');
        const isInternalComp = ['OFIMUNDO', 'DREAMTEC', 'GLOBAL HORIZON', 'HIWAY'].includes((prospecto.cliente || '').trim().toUpperCase());
        const tipoProyecto = (prospecto.tipoCliente === 'Interno' || isInternalComp) ? 'Interno' : 'Externo';
        const is100Pct = !!(prospecto.estado && prospecto.estado.includes('100%'));
        if (check.recordset.length === 0) {
            await GestionDemanda_1.default.create({
                proyecto: prospecto.nombreProyecto,
                tipoProyecto: tipoProyecto,
                prioridad: 'alta',
                estado: is100Pct ? 'ejecución aprobada' : 'solicitado',
                etapa: is100Pct ? 'Ficha' : 'Prospecto',
                area: prospecto.lineaServicio || 'Comercial',
                planificacionEstimada: prospecto.fechaInicio || prospecto.fechaEstimadaAdjudicacion || new Date().toISOString().split('T')[0],
                fechaEstimadaEntrega: prospecto.fechaTermino || '',
                responsableTI: prospecto.gestorComercial || 'Por asignar',
                solicitante: prospecto.cliente || 'Prospecto comercial',
                observaciones: `Sincronizado automáticamente desde Prospecto (${prospecto.estado || ''}). Código: ${prospecto.codigo || ''}`
            });
            console.log(`✅ Demanda creada automáticamente desde el Prospecto "${prospecto.nombreProyecto}" (${tipoProyecto})`);
        }
        else {
            const demandaId = check.recordset[0].Id;
            const updatePayload = {
                tipoProyecto: tipoProyecto,
                area: prospecto.lineaServicio || 'Comercial',
                planificacionEstimada: prospecto.fechaInicio || prospecto.fechaEstimadaAdjudicacion || new Date().toISOString().split('T')[0],
                fechaEstimadaEntrega: prospecto.fechaTermino || '',
                responsableTI: prospecto.gestorComercial || 'Por asignar',
                solicitante: prospecto.cliente || 'Prospecto comercial',
                observaciones: `Actualizado desde Prospecto (${prospecto.estado || ''}). Código: ${prospecto.codigo || ''}`
            };
            if (is100Pct) {
                updatePayload.estado = 'ejecución aprobada';
            }
            await GestionDemanda_1.default.update(demandaId, updatePayload);
            console.log(`✅ Demanda id ${demandaId} actualizada desde Prospecto "${prospecto.nombreProyecto}"`);
        }
    }
    static async syncAllToDemanda() {
        try {
            const db = await (0, database_1.getDatabase)();
            await db.request().query(`
                INSERT INTO GestionDemanda (
                    Proyecto, TipoProyecto, Prioridad, Estado, Etapa, Area,
                    PlanificacionEstimada, FechaEstimadaEntrega, ResponsableTI, Solicitante, Observaciones, FechaCreacion
                )
                SELECT 
                    fp.NombreProyecto,
                    CASE 
                        WHEN UPPER(LTRIM(RTRIM(ISNULL(fp.Cliente, '')))) IN ('OFIMUNDO', 'DREAMTEC', 'GLOBAL HORIZON', 'HIWAY') OR fp.TipoCliente = 'Interno' THEN 'Interno'
                        ELSE 'Externo'
                    END AS TipoProyecto,
                    'alta' AS Prioridad,
                    CASE 
                        WHEN fp.Estado LIKE '%100%%' THEN 'ejecución aprobada' 
                        ELSE 'solicitado' 
                    END AS Estado,
                    CASE 
                        WHEN fp.Estado LIKE '%100%%' THEN 'Ficha' 
                        ELSE 'Prospecto' 
                    END AS Etapa,
                    COALESCE(NULLIF(fp.LineaServicio, ''), 'Comercial') AS Area,
                    COALESCE(
                        NULLIF(CONVERT(VARCHAR(10), fp.FechaInicio, 120), ''), 
                        NULLIF(CONVERT(VARCHAR(10), fp.FechaEstimadaAdjudicacion, 120), ''), 
                        CONVERT(VARCHAR(10), GETDATE(), 120)
                    ) AS PlanificacionEstimada,
                    fp.FechaTermino AS FechaEstimadaEntrega,
                    COALESCE(NULLIF(fp.GestorComercial, ''), 'Por asignar') AS ResponsableTI,
                    COALESCE(NULLIF(fp.Cliente, ''), 'Prospecto comercial') AS Solicitante,
                    CONCAT('Sincronizado automáticamente desde Prospecto (', ISNULL(fp.Estado, ''), '). Código: ', ISNULL(fp.Codigo, '')) AS Observaciones,
                    GETDATE() AS FechaCreacion
                FROM FichasProspecto fp
                WHERE fp.NombreProyecto IS NOT NULL 
                  AND LTRIM(RTRIM(fp.NombreProyecto)) <> ''
                  AND NOT EXISTS (
                      SELECT 1 FROM GestionDemanda gd 
                      WHERE LOWER(LTRIM(RTRIM(gd.Proyecto))) = LOWER(LTRIM(RTRIM(fp.NombreProyecto)))
                  );
            `);
        }
        catch (err) {
            console.error('Error al sincronizar todos los prospectos a Gestión de la Demanda:', err);
        }
    }
    static parseFichaProspecto(row) {
        let estimacionesParsed = {};
        if (row.Estimaciones) {
            try {
                estimacionesParsed = JSON.parse(row.Estimaciones);
            }
            catch (e) {
                console.error('Error parsing estimaciones JSON:', e);
            }
        }
        return {
            id: String(row.Id),
            codigo: row.Codigo,
            nombreProyecto: row.NombreProyecto,
            estado: row.Estado,
            cliente: row.Cliente,
            gestorComercial: row.GestorComercial || '',
            centroCosto: row.CentroCosto || '',
            fechaEstimadaAdjudicacion: row.FechaEstimadaAdjudicacion ? new Date(row.FechaEstimadaAdjudicacion).toISOString().split('T')[0] : '',
            fechaAdjudicacion: row.FechaAdjudicacion ? new Date(row.FechaAdjudicacion).toISOString().split('T')[0] : '',
            valorServicio: row.ValorServicio !== null ? Number(row.ValorServicio) : 0,
            margen: row.Margen !== null ? Number(row.Margen) : 0,
            rentabilidad: row.Rentabilidad !== null ? Number(row.Rentabilidad) : 0,
            plazoEstimado: row.PlazoEstimado || '',
            lineaServicio: row.LineaServicio || '',
            fechaInicio: row.FechaInicio ? new Date(row.FechaInicio).toISOString().split('T')[0] : '',
            fechaTermino: row.FechaTermino ? new Date(row.FechaTermino).toISOString().split('T')[0] : '',
            garantia: row.Garantia || '',
            horasSoporte: row.HorasSoporte !== null ? Number(row.HorasSoporte) : 0,
            totalIngresos: row.TotalIngresos !== null ? Number(row.TotalIngresos) : 0,
            estimaciones: estimacionesParsed,
            tipoCliente: row.TipoCliente || 'Nuevo',
            created_at: row.FechaCreacion ? new Date(row.FechaCreacion).toISOString() : '',
            updated_at: row.FechaActualizacion ? new Date(row.FechaActualizacion).toISOString() : ''
        };
    }
}
exports.FichaProspectoModel = FichaProspectoModel;
exports.default = FichaProspectoModel;
//# sourceMappingURL=FichaProspecto.js.map