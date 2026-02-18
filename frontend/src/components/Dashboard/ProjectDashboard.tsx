import React from 'react';
import { useProjects } from '../../contexts/ProjectContext'; // Cambiado de '../../src/contexts/ProjectContext'
import { useProfessionals } from '../../contexts/ProfessionalContext'; // Cambiado de '../../src/contexts/ProfessionalContext'

const ProjectDashboard: React.FC = () => {
  const { getProjectStats } = useProjects();
  const { professionals } = useProfessionals();
  const stats = getProjectStats();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-blue-600 text-white rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-2">Total Proyectos</h3>
          <p className="text-3xl font-bold">{stats.totalProjects}</p>
        </div>
        <div className="bg-green-600 text-white rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-2">HH Totales</h3>
          <p className="text-3xl font-bold">{stats.totalHH}</p>
        </div>
        <div className="bg-purple-600 text-white rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-2">Proyectos Activos</h3>
          <p className="text-3xl font-bold">{stats.activeProjects}</p>
        </div>
        <div className="bg-orange-600 text-white rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-2">Recursos</h3>
          <p className="text-3xl font-bold">{professionals.length}</p>
        </div>
      </div>
    </div>
  );
};

export default ProjectDashboard;