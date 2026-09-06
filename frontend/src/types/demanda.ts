export type PrioridadDemanda = 'alta' | 'media' | 'baja';

export type EstadoDemanda = 
  | 'backlog' 
  | 'en proceso' 
  | 'finalizado' 
  | 'en espera cierre del usuario' 
  | 'solicitado' 
  | 'ejecución aprobada';

export type TipoProyectoDemanda = 'Interno' | 'Externo';

export interface DemandaItem {
  id: string;
  codigo?: string;
  proyecto: string;
  tipoProyecto?: TipoProyectoDemanda;
  fechaSolicitud?: string;
  area: string;
  responsableTI: string;
  estado: string;
  decisionComite?: string;
  prioridad: string;
  semaforo?: string;
  etapa: string;
  fechaComite?: string;
  planificacionEstimada: string;
  planificacionReal: string;
  fechaEstimadaEntrega: string;
  fechaEntregaReal?: string;
  tiempoEstimadoCompleto?: string;
  tiempoEstimadoAjuste?: string;
  solicitante?: string;
  observaciones?: string;
  created_at?: string;
  updated_at?: string;
}
