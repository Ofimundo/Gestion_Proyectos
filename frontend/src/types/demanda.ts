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
  proyecto: string;
  tipoProyecto: TipoProyectoDemanda;
  prioridad: PrioridadDemanda;
  estado: EstadoDemanda;
  etapa: string;
  area: string;
  planificacionEstimada: string;
  planificacionReal: string;
  fechaEstimadaEntrega: string;
  fechaEntregaReal?: string;
  variacionFechaEntrega?: string;
  responsableTI: string;
  solicitante: string;
  observaciones?: string;
  created_at?: string;
  updated_at?: string;
}
