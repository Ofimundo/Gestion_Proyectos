import * as XLSX from 'xlsx';

export const exportProjectToExcel = (project: any) => {
  const wb = XLSX.utils.book_new();

  // Hoja principal del proyecto
  const mainData = [
    ['Proyecto', project.name],
    ['Código', project.code],
    ['Cliente', project.client],
    ['Líder', project.leader],
    ['Descripción', project.description],
    ['Tecnologías', project.technologies],
    ['Monto Venta', project.saleAmount],
    ['HH Implementación', project.hhImplementation],
    ['HH Período', project.hhPeriod],
    ['Recursos', project.resources.join(', ')],
    ['Fecha Inicio', project.startDate],
    ['Fecha Término', project.endDate],
    ['Contraparte', project.clientContact],
  ];

  const mainSheet = XLSX.utils.aoa_to_sheet(mainData);
  XLSX.utils.book_append_sheet(wb, mainSheet, 'Proyecto');

  // Hoja de etapas
  const stagesData = [
    ['Etapa', 'Estado', 'HH Planificadas', 'HH Real'],
    ...project.stages.map((stage: any) => [
      stage.name,
      stage.status,
      stage.hhPlanificadas,
      stage.hhReal
    ])
  ];

  const stagesSheet = XLSX.utils.aoa_to_sheet(stagesData);
  XLSX.utils.book_append_sheet(wb, stagesSheet, 'Etapas');

  // Hoja de riesgos
  const risksData = [
    ['Riesgo', 'Acción', 'Responsable', 'Fecha'],
    ...project.risks.map((risk: any) => [
      risk.description,
      risk.action,
      risk.responsible,
      risk.date
    ])
  ];

  const risksSheet = XLSX.utils.aoa_to_sheet(risksData);
  XLSX.utils.book_append_sheet(wb, risksSheet, 'Riesgos');

  // Exportar archivo
  XLSX.writeFile(wb, `${project.code}_${project.name}.xlsx`);
};