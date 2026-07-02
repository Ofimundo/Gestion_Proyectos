import { getDatabase } from '../database/database';
import sql from 'mssql';

export interface FichaProspecto {
    id: string;
    codigo: string;
    nombreProyecto: string;
    estado: string;
    cliente: string;
    gestorComercial?: string;
    centroCosto?: string;
    fechaEstimadaAdjudicacion?: string;
    fechaAdjudicacion?: string;
    valorServicio?: number;
    margen?: number;
    rentabilidad?: number;
    plazoEstimado?: string;
    lineaServicio?: string;
    fechaInicio?: string;
    fechaTermino?: string;
    garantia?: string;
    horasSoporte?: number;
    totalIngresos?: number;
    estimaciones?: any; // Guardado como JSON en BD
    created_at?: string;
    updated_at?: string;
}

export class FichaProspectoModel {
    static async create(data: Partial<FichaProspecto>): Promise<FichaProspecto> {
        const db = await getDatabase();
        
        const valorServicio = data.valorServicio !== undefined ? data.valorServicio : 0;
        const margen = data.margen !== undefined ? data.margen : 0;
        const rentabilidad = data.rentabilidad !== undefined ? data.rentabilidad : 0;
        const horasSoporte = data.horasSoporte !== undefined ? data.horasSoporte : 0;
        const totalIngresos = data.totalIngresos !== undefined ? data.totalIngresos : 0;
        const estimacionesJson = data.estimaciones ? JSON.stringify(data.estimaciones) : '{}';

        const result = await db.request()
            .input('Codigo', sql.NVarChar, data.codigo || '')
            .input('NombreProyecto', sql.NVarChar, data.nombreProyecto || '')
            .input('Estado', sql.NVarChar, data.estado || 'No Iniciada')
            .input('Cliente', sql.NVarChar, data.cliente || '')
            .input('GestorComercial', sql.NVarChar, data.gestorComercial || null)
            .input('CentroCosto', sql.NVarChar, data.centroCosto || null)
            .input('FechaEstimadaAdjudicacion', sql.Date, data.fechaEstimadaAdjudicacion ? new Date(data.fechaEstimadaAdjudicacion) : null)
            .input('FechaAdjudicacion', sql.Date, data.fechaAdjudicacion ? new Date(data.fechaAdjudicacion) : null)
            .input('ValorServicio', sql.Decimal(18, 2), valorServicio)
            .input('Margen', sql.Decimal(5, 2), margen)
            .input('Rentabilidad', sql.Decimal(18, 2), rentabilidad)
            .input('PlazoEstimado', sql.NVarChar, data.plazoEstimado || null)
            .input('LineaServicio', sql.NVarChar, data.lineaServicio || null)
            .input('FechaInicio', sql.Date, data.fechaInicio ? new Date(data.fechaInicio) : null)
            .input('FechaTermino', sql.Date, data.fechaTermino ? new Date(data.fechaTermino) : null)
            .input('Garantia', sql.NVarChar, data.garantia || null)
            .input('HorasSoporte', sql.Int, horasSoporte)
            .input('TotalIngresos', sql.Decimal(18, 2), totalIngresos)
            .input('Estimaciones', sql.NVarChar, estimacionesJson)
            .query(`
                INSERT INTO FichasProspecto (
                    Codigo, NombreProyecto, Estado, Cliente, GestorComercial, CentroCosto,
                    FechaEstimadaAdjudicacion, FechaAdjudicacion, ValorServicio, Margen, Rentabilidad,
                    PlazoEstimado, LineaServicio, FechaInicio, FechaTermino, Garantia, HorasSoporte,
                    TotalIngresos, Estimaciones, FechaCreacion
                )
                VALUES (
                    @Codigo, @NombreProyecto, @Estado, @Cliente, @GestorComercial, @CentroCosto,
                    @FechaEstimadaAdjudicacion, @FechaAdjudicacion, @ValorServicio, @Margen, @Rentabilidad,
                    @PlazoEstimado, @LineaServicio, @FechaInicio, @FechaTermino, @Garantia, @HorasSoporte,
                    @TotalIngresos, @Estimaciones, GETDATE()
                );
                SELECT SCOPE_IDENTITY() AS Id;
            `);

        const newId = result.recordset[0].Id;
        const created = await this.findById(newId);
        if (!created) throw new Error('Error al crear la ficha de prospecto');
        return created;
    }

    static async findById(id: string | number): Promise<FichaProspecto | undefined> {
        const db = await getDatabase();
        const result = await db.request()
            .input('Id', sql.Int, Number(id))
            .query('SELECT * FROM FichasProspecto WHERE Id = @Id');
        
        const row = result.recordset[0];
        if (!row) return undefined;
        return this.parseFichaProspecto(row);
    }

    static async findAll(): Promise<FichaProspecto[]> {
        const db = await getDatabase();
        const result = await db.request().query('SELECT * FROM FichasProspecto ORDER BY FechaCreacion DESC');
        return result.recordset.map(row => this.parseFichaProspecto(row));
    }

    static async update(id: string | number, data: Partial<FichaProspecto>): Promise<FichaProspecto> {
        const db = await getDatabase();
        const fields: string[] = [];
        const request = db.request();

        const mappings: { [key: string]: { col: string; type: any } } = {
            codigo: { col: 'Codigo', type: sql.NVarChar },
            nombreProyecto: { col: 'NombreProyecto', type: sql.NVarChar },
            estado: { col: 'Estado', type: sql.NVarChar },
            cliente: { col: 'Cliente', type: sql.NVarChar },
            gestorComercial: { col: 'GestorComercial', type: sql.NVarChar },
            centroCosto: { col: 'CentroCosto', type: sql.NVarChar },
            fechaEstimadaAdjudicacion: { col: 'FechaEstimadaAdjudicacion', type: sql.Date },
            fechaAdjudicacion: { col: 'FechaAdjudicacion', type: sql.Date },
            valorServicio: { col: 'ValorServicio', type: sql.Decimal(18, 2) },
            margen: { col: 'Margen', type: sql.Decimal(5, 2) },
            rentabilidad: { col: 'Rentabilidad', type: sql.Decimal(18, 2) },
            plazoEstimado: { col: 'PlazoEstimado', type: sql.NVarChar },
            lineaServicio: { col: 'LineaServicio', type: sql.NVarChar },
            fechaInicio: { col: 'FechaInicio', type: sql.Date },
            fechaTermino: { col: 'FechaTermino', type: sql.Date },
            garantia: { col: 'Garantia', type: sql.NVarChar },
            horasSoporte: { col: 'HorasSoporte', type: sql.Int },
            totalIngresos: { col: 'TotalIngresos', type: sql.Decimal(18, 2) }
        };

        Object.keys(mappings).forEach(key => {
            const val = (data as any)[key];
            if (val !== undefined) {
                const mapping = mappings[key];
                fields.push(`${mapping.col} = @${mapping.col}`);
                if (mapping.type === sql.Date) {
                    request.input(mapping.col, mapping.type, val ? new Date(val) : null);
                } else {
                    request.input(mapping.col, mapping.type, val);
                }
            }
        });

        if (data.estimaciones !== undefined) {
            fields.push('Estimaciones = @Estimaciones');
            request.input('Estimaciones', sql.NVarChar, JSON.stringify(data.estimaciones));
        }

        if (fields.length > 0) {
            request.input('Id', sql.Int, Number(id));
            await request.query(`
                UPDATE FichasProspecto 
                SET ${fields.join(', ')}, FechaActualizacion = GETDATE() 
                WHERE Id = @Id
            `);
        }

        const updated = await this.findById(id);
        if (!updated) throw new Error('Ficha de prospecto no encontrada');
        return updated;
    }

    static async delete(id: string | number): Promise<void> {
        const db = await getDatabase();
        await db.request()
            .input('Id', sql.Int, Number(id))
            .query('DELETE FROM FichasProspecto WHERE Id = @Id');
    }

    private static parseFichaProspecto(row: any): FichaProspecto {
        let estimacionesParsed = {};
        if (row.Estimaciones) {
            try {
                estimacionesParsed = JSON.parse(row.Estimaciones);
            } catch (e) {
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
            created_at: row.FechaCreacion ? new Date(row.FechaCreacion).toISOString() : '',
            updated_at: row.FechaActualizacion ? new Date(row.FechaActualizacion).toISOString() : ''
        };
    }
}
export default FichaProspectoModel;
