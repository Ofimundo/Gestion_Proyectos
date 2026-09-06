import api from './api';
import { DemandaItem, PrioridadDemanda, EstadoDemanda, TipoProyectoDemanda } from '../types/demanda';

const DEMANDA_LOCAL_STORAGE_KEY = 'gestion_demanda_local_data';

const getLocalDemandaData = (): DemandaItem[] => {
  try {
    const dataStr = localStorage.getItem(DEMANDA_LOCAL_STORAGE_KEY);
    if (dataStr !== null) {
      const parsed: DemandaItem[] = JSON.parse(dataStr);
      // Filtrar viejos datos mock de prueba
      const cleaned = parsed.filter(item => !['1', '2', '3', '4'].includes(item.id));
      if (cleaned.length !== parsed.length) {
        saveLocalDemandaData(cleaned);
      }
      return cleaned;
    }
  } catch (e) {
    console.error('Error leyendo demanda de localStorage:', e);
  }
  return [];
};

const saveLocalDemandaData = (data: DemandaItem[]) => {
  try {
    localStorage.setItem(DEMANDA_LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Error guardando demanda en localStorage:', e);
  }
};

export const demandaService = {
  // Obtener todas las demandas
  getAll: async (): Promise<DemandaItem[]> => {
    try {
      const response = await api.get('/demanda');
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        saveLocalDemandaData(response.data.data);
        return response.data.data;
      }
    } catch (error) {
      console.warn('⚠️ No se pudo conectar al backend /api/demanda. Usando datos de almacenamiento local.', error);
    }
    return getLocalDemandaData();
  },

  // Crear nueva demanda
  create: async (data: Partial<DemandaItem>): Promise<DemandaItem> => {
    try {
      const response = await api.post('/demanda', data);
      if (response.data && response.data.success && response.data.data) {
        const local = getLocalDemandaData();
        local.unshift(response.data.data);
        saveLocalDemandaData(local);
        return response.data.data;
      }
    } catch (error) {
      console.warn('⚠️ Error al crear en el servidor backend, guardando localmente:', error);
    }

    // Fallback local
    const newItem: DemandaItem = {
      id: Date.now().toString(),
      proyecto: data.proyecto || 'Nuevo Proyecto',
      tipoProyecto: data.tipoProyecto || 'Interno',
      prioridad: data.prioridad || 'media',
      estado: data.estado || 'solicitado',
      etapa: data.etapa || 'Planificación',
      area: data.area || 'General',
      planificacionEstimada: data.planificacionEstimada || new Date().toISOString().split('T')[0],
      planificacionReal: data.planificacionReal || '',
      fechaEstimadaEntrega: data.fechaEstimadaEntrega || new Date().toISOString().split('T')[0],
      fechaEntregaReal: data.fechaEntregaReal || '',
      responsableTI: data.responsableTI || 'No asignado',
      solicitante: data.solicitante || 'Sin solicitante',
      observaciones: data.observaciones || '',
      created_at: new Date().toISOString()
    };

    const local = getLocalDemandaData();
    local.unshift(newItem);
    saveLocalDemandaData(local);
    return newItem;
  },

  // Actualizar demanda completa
  update: async (id: string, data: Partial<DemandaItem>): Promise<DemandaItem> => {
    try {
      const response = await api.put(`/demanda/${id}`, data);
      if (response.data && response.data.success && response.data.data) {
        const local = getLocalDemandaData();
        const index = local.findIndex(item => item.id === id);
        if (index !== -1) {
          local[index] = response.data.data;
          saveLocalDemandaData(local);
        }
        return response.data.data;
      }
    } catch (error) {
      console.warn(`⚠️ Error al actualizar demanda ${id} en servidor backend, aplicando fallback local:`, error);
    }

    const local = getLocalDemandaData();
    const index = local.findIndex(item => item.id === id);
    if (index !== -1) {
      local[index] = { ...local[index], ...data, updated_at: new Date().toISOString() };
      saveLocalDemandaData(local);
      return local[index];
    }
    throw new Error('Registro de demanda no encontrado');
  },

  // Actualizar rápido de prioridad desde la lista
  updatePrioridad: async (id: string, prioridad: PrioridadDemanda): Promise<DemandaItem> => {
    try {
      const response = await api.patch(`/demanda/${id}/prioridad`, { prioridad });
      if (response.data && response.data.success && response.data.data) {
        const local = getLocalDemandaData();
        const index = local.findIndex(item => item.id === id);
        if (index !== -1) {
          local[index] = response.data.data;
          saveLocalDemandaData(local);
        }
        return response.data.data;
      }
    } catch (error) {
      console.warn(`⚠️ Error actualizando prioridad para ${id} en servidor, guardando localmente:`, error);
    }

    const local = getLocalDemandaData();
    const index = local.findIndex(item => item.id === id);
    if (index !== -1) {
      local[index].prioridad = prioridad;
      local[index].updated_at = new Date().toISOString();
      saveLocalDemandaData(local);
      return local[index];
    }
    throw new Error('Registro de demanda no encontrado');
  },

  // Actualizar rápido de estado desde la lista
  updateEstado: async (id: string, estado: EstadoDemanda): Promise<DemandaItem> => {
    try {
      const response = await api.patch(`/demanda/${id}/estado`, { estado });
      if (response.data && response.data.success && response.data.data) {
        const local = getLocalDemandaData();
        const index = local.findIndex(item => item.id === id);
        if (index !== -1) {
          local[index] = response.data.data;
          saveLocalDemandaData(local);
        }
        return response.data.data;
      }
    } catch (error) {
      console.warn(`⚠️ Error actualizando estado para ${id} en servidor, guardando localmente:`, error);
    }

    const local = getLocalDemandaData();
    const index = local.findIndex(item => item.id === id);
    if (index !== -1) {
      local[index].estado = estado;
      local[index].updated_at = new Date().toISOString();
      saveLocalDemandaData(local);
      return local[index];
    }
    throw new Error('Registro de demanda no encontrado');
  },

  // Eliminar demanda
  delete: async (id: string): Promise<boolean> => {
    try {
      await api.delete(`/demanda/${id}`);
    } catch (error) {
      console.warn(`⚠️ Error al eliminar demanda ${id} en servidor backend:`, error);
    }
    const local = getLocalDemandaData();
    const filtered = local.filter(item => item.id !== id);
    saveLocalDemandaData(filtered);
    return true;
  },

  // Sincronización automática: cualquier Prospecto (interno/externo) -> Gestión de la Demanda
  syncDemandaFromProspecto: async (prospecto: any): Promise<DemandaItem | null> => {
    try {
      const demandas = await demandaService.getAll();
      const exists = demandas.find(d => d.proyecto.toLowerCase() === (prospecto.nombreProyecto || '').toLowerCase());
      
      const isInternal = prospecto.categoriaCliente === 'Interno' || 
                         prospecto.tipoCliente === 'Interno' ||
                         ['OFIMUNDO', 'DREAMTEC', 'GLOBAL HORIZON', 'HIWAY'].includes((prospecto.cliente || '').trim().toUpperCase());
      const tipoProyecto: TipoProyectoDemanda = isInternal ? 'Interno' : 'Externo';

      const is100Pct = !!(prospecto.estado && prospecto.estado.includes('100%'));

      const demandaData: Partial<DemandaItem> = {
        proyecto: prospecto.nombreProyecto,
        tipoProyecto: tipoProyecto,
        prioridad: 'alta',
        estado: is100Pct ? 'ejecución aprobada' : (exists ? exists.estado : 'solicitado'),
        etapa: (exists && exists.etapa && ['Prospecto', 'Ficha', 'Solicitud', 'Aprobado', 'Rechazado'].includes(exists.etapa)) ? exists.etapa : (is100Pct ? 'Ficha' : 'Prospecto'),
        area: prospecto.lineaServicio || 'Comercial',
        planificacionEstimada: prospecto.fechaInicio || prospecto.fechaEstimadaAdjudicacion || new Date().toISOString().split('T')[0],
        fechaEstimadaEntrega: prospecto.fechaTermino || '',
        responsableTI: prospecto.gestorComercial || 'Por asignar',
        solicitante: prospecto.cliente || 'Cliente Prospecto',
        observaciones: ''
      };

      if (!exists) {
        const created = await demandaService.create(demandaData);
        return created;
      } else {
        const updated = await demandaService.update(exists.id, demandaData);
        return updated;
      }
    } catch (e) {
      console.error('Error en syncDemandaFromProspecto:', e);
    }
    return null;
  },

  syncAllProspectosToDemanda: async (): Promise<void> => {
    try {
      // El backend sincroniza automáticamente los prospectos en una sola consulta optimizada
      await demandaService.getAll();
    } catch (e) {
      console.warn('Error al sincronizar prospectos:', e);
    }
  },

  checkAndCreateDemandaFromProspecto: async (prospecto: any): Promise<DemandaItem | null> => {
    return demandaService.syncDemandaFromProspecto(prospecto);
  },

  // Conversión a Ficha de Proyecto (Manual)
  checkAndCreateFichaFromDemanda: async (_demanda: DemandaItem): Promise<boolean> => {
    // No crear fichas automáticamente en la base de datos
    return false;
  }
};

export default demandaService;
