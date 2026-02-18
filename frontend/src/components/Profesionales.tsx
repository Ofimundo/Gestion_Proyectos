import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Profesional {
  id: string;
  nombre: string;
  correo: string;
  cargo: string;
  fechaRegistro: string;
  activo: boolean;
}

const Profesionales: React.FC = () => {
  const navigate = useNavigate();
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [filteredProfesionales, setFilteredProfesionales] = useState<Profesional[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [currentProfesional, setCurrentProfesional] = useState<Profesional | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    correo: '',
    cargo: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [profesionalToDelete, setProfesionalToDelete] = useState<string | null>(null);

  // Cargar datos del localStorage
  useEffect(() => {
    const loadData = () => {
      try {
        const storedProfesionales = localStorage.getItem('rpa_profesionales');
        if (storedProfesionales) {
          const parsed = JSON.parse(storedProfesionales);
          setProfesionales(parsed);
          setFilteredProfesionales(parsed);
        } else {
          // Array vacío - sin datos predeterminados
          setProfesionales([]);
          setFilteredProfesionales([]);
        }
      } catch (error) {
        console.error('Error cargando profesionales:', error);
        setProfesionales([]);
        setFilteredProfesionales([]);
      }
    };

    loadData();

    // Escuchar cambios en localStorage
    const handleStorageChange = () => {
      loadData();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Guardar en localStorage cuando cambian los profesionales
  useEffect(() => {
    if (profesionales.length > 0) {
      localStorage.setItem('rpa_profesionales', JSON.stringify(profesionales));
    }
  }, [profesionales]);

  // Filtrar profesionales por búsqueda
  useEffect(() => {
    const filtered = profesionales.filter(prof => 
      prof.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prof.correo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prof.cargo.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProfesionales(filtered);
  }, [searchTerm, profesionales]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio';
    }
    
    if (!formData.correo.trim()) {
      newErrors.correo = 'El correo es obligatorio';
    } else if (!/\S+@\S+\.\S+/.test(formData.correo)) {
      newErrors.correo = 'El correo no es válido';
    }
    
    if (!formData.cargo.trim()) {
      newErrors.cargo = 'El cargo es obligatorio';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleAdd = () => {
    setModalMode('add');
    setFormData({ nombre: '', correo: '', cargo: '' });
    setErrors({});
    setShowModal(true);
  };

  const handleEdit = (profesional: Profesional) => {
    setModalMode('edit');
    setCurrentProfesional(profesional);
    setFormData({
      nombre: profesional.nombre,
      correo: profesional.correo,
      cargo: profesional.cargo
    });
    setErrors({});
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    setProfesionalToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (profesionalToDelete) {
      const updatedProfesionales = profesionales.filter(p => p.id !== profesionalToDelete);
      setProfesionales(updatedProfesionales);
      localStorage.setItem('rpa_profesionales', JSON.stringify(updatedProfesionales));
      setShowDeleteConfirm(false);
      setProfesionalToDelete(null);
    }
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    if (modalMode === 'add') {
      // Agregar nuevo profesional
      const newProfesional: Profesional = {
        id: Date.now().toString(),
        ...formData,
        fechaRegistro: new Date().toISOString().split('T')[0],
        activo: true
      };
      const updatedProfesionales = [...profesionales, newProfesional];
      setProfesionales(updatedProfesionales);
      localStorage.setItem('rpa_profesionales', JSON.stringify(updatedProfesionales));
    } else {
      // Editar profesional existente
      if (currentProfesional) {
        const updatedProfesionales = profesionales.map(p => 
          p.id === currentProfesional.id 
            ? { ...p, ...formData }
            : p
        );
        setProfesionales(updatedProfesionales);
        localStorage.setItem('rpa_profesionales', JSON.stringify(updatedProfesionales));
      }
    }
    
    setShowModal(false);
    setCurrentProfesional(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Navbar Responsive */}
      <nav className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-3 sm:py-0 sm:h-16">
            <div className="flex items-center w-full sm:w-auto">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center text-gray-600 hover:text-indigo-600 mr-2 sm:mr-4 text-xs sm:text-sm"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="hidden xs:inline">Volver</span>
              </button>
              <div className="flex items-center">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-md">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <span className="ml-2 text-base sm:text-lg md:text-xl font-semibold text-gray-800 truncate">
                  Profesionales
                </span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Contenido principal */}
      <main className="max-w-7xl mx-auto py-4 sm:py-6 md:py-8 px-3 sm:px-4 md:px-6 lg:px-8">
        {/* Barra de búsqueda y botón agregar */}
        <div className="mb-4 sm:mb-6 md:mb-8 flex flex-col xs:flex-row gap-3 sm:gap-4 justify-between items-center">
          <div className="relative w-full xs:w-64 sm:w-72 md:w-96">
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <svg className="absolute left-2 sm:left-3 top-2 sm:top-2.5 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <button
            onClick={handleAdd}
            className="w-full xs:w-auto px-4 sm:px-6 py-1.5 sm:py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-xs sm:text-sm rounded-lg hover:from-blue-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 font-medium flex items-center justify-center"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span className="hidden xs:inline">Agregar Profesional</span>
            <span className="xs:hidden">Agregar</span>
          </button>
        </div>

        {/* Tabla de profesionales */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-lg sm:shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-xs sm:text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    Correo
                  </th>
                  <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Cargo
                  </th>
                  <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    Fecha
                  </th>
                  <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-right font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProfesionales.length > 0 ? (
                  filteredProfesionales.map((prof) => (
                    <tr key={prof.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-semibold text-xs sm:text-sm">
                            {prof.nombre.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase()}
                          </div>
                          <div className="ml-2 sm:ml-3 md:ml-4">
                            <div className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-[100px] xs:max-w-[150px] sm:max-w-none">
                              {prof.nombre}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 whitespace-nowrap hidden sm:table-cell">
                        <div className="text-xs sm:text-sm text-gray-900 truncate max-w-[150px]">{prof.correo}</div>
                      </td>
                      <td className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 whitespace-nowrap hidden md:table-cell">
                        <div className="text-xs sm:text-sm text-gray-900">{prof.cargo}</div>
                      </td>
                      <td className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 whitespace-nowrap hidden lg:table-cell">
                        <div className="text-xs sm:text-sm text-gray-900">{prof.fechaRegistro}</div>
                      </td>
                      <td className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 whitespace-nowrap">
                        <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${
                          prof.activo 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {prof.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 whitespace-nowrap text-right text-xs sm:text-sm font-medium">
                        <button
                          onClick={() => handleEdit(prof)}
                          className="text-indigo-600 hover:text-indigo-900 mr-2 sm:mr-3"
                          title="Editar"
                        >
                          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(prof.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Eliminar"
                        >
                          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 sm:px-6 py-6 sm:py-8 text-center text-xs sm:text-sm text-gray-500">
                      No hay profesionales registrados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal de Agregar/Editar */}
        {showModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-3 sm:px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowModal(false)}></div>

              <div className="inline-block align-bottom bg-white rounded-xl sm:rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-4 sm:px-6 py-3 sm:py-4">
                  <h3 className="text-base sm:text-lg font-medium text-white">
                    {modalMode === 'add' ? 'Agregar Profesional' : 'Editar Profesional'}
                  </h3>
                </div>
                
                <div className="bg-white px-4 sm:px-6 py-4 sm:py-6">
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                        Nombre completo *
                      </label>
                      <input
                        type="text"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleInputChange}
                        className={`w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.nombre ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Ej: Juan Pérez"
                      />
                      {errors.nombre && (
                        <p className="mt-1 text-xs text-red-600">{errors.nombre}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                        Correo electrónico *
                      </label>
                      <input
                        type="email"
                        name="correo"
                        value={formData.correo}
                        onChange={handleInputChange}
                        className={`w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.correo ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="ejemplo@empresa.com"
                      />
                      {errors.correo && (
                        <p className="mt-1 text-xs text-red-600">{errors.correo}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                        Cargo *
                      </label>
                      <select
                        name="cargo"
                        value={formData.cargo}
                        onChange={handleInputChange}
                        className={`w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.cargo ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Seleccionar cargo</option>
                        <option value="Líder de Proyecto">Líder de Proyecto</option>
                        <option value="Desarrollador RPA">Desarrollador RPA</option>
                        <option value="Desarrollador Python">Desarrollador Python</option>
                        <option value="Analista">Analista</option>
                        <option value="Arquitecto RPA">Arquitecto RPA</option>
                      </select>
                      {errors.cargo && (
                        <p className="mt-1 text-xs text-red-600">{errors.cargo}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 flex justify-end space-x-2 sm:space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {modalMode === 'add' ? 'Agregar' : 'Guardar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de confirmación de eliminación */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-3 sm:px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowDeleteConfirm(false)}></div>

              <div className="inline-block align-bottom bg-white rounded-xl sm:rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-gradient-to-r from-red-600 to-pink-600 px-4 sm:px-6 py-3 sm:py-4">
                  <h3 className="text-base sm:text-lg font-medium text-white">Confirmar eliminación</h3>
                </div>
                
                <div className="bg-white px-4 sm:px-6 py-4 sm:py-6">
                  <p className="text-sm sm:text-base text-gray-700">
                    ¿Estás seguro de eliminar este profesional?
                  </p>
                </div>

                <div className="bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 flex justify-end space-x-2 sm:space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={confirmDelete}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg hover:from-red-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Profesionales;