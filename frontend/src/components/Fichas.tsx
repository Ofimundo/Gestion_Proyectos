import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';

interface Ficha {
  id: string;
  codigo: string;
  nombreProyecto: string;
  cliente: string;
  lider: string;
  descripcion: string;
  tecnologias: string;
  venta: number;
  hhImplementacion: number;
  hhPeriodo: number;
  recursos: string[];
  fechaInicio: string;
  fechaTermino: string;
  contraparte: string;
  estado: 'Standby' | 'En Curso' | 'No Iniciada' | 'Completada';
  avance: number;
  hhPlanificadas: number;
  hhReal: number;
  alertas: string;
  acciones: string;
  responsable: string;
  bitacora: Array<{
    fecha: string;
    descripcion: string;
  }>;
}

const Fichas: React.FC = () => {
  const navigate = useNavigate();
  const [fichas, setFichas] = useState<Ficha[]>([]);
  const [filteredFichas, setFilteredFichas] = useState<Ficha[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [currentFicha, setCurrentFicha] = useState<Ficha | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [fichaToDelete, setFichaToDelete] = useState<string | null>(null);
  const [selectedEstado, setSelectedEstado] = useState<string>('todos');

  const [formData, setFormData] = useState({
    codigo: '',
    nombreProyecto: '',
    cliente: '',
    lider: '',
    descripcion: '',
    tecnologias: '',
    venta: 0,
    hhImplementacion: 0,
    hhPeriodo: 0,
    recursos: [] as string[],
    fechaInicio: '',
    fechaTermino: '',
    contraparte: '',
    estado: 'No Iniciada' as 'Standby' | 'En Curso' | 'No Iniciada' | 'Completada',
    avance: 0,
    hhPlanificadas: 0,
    hhReal: 0,
    alertas: '',
    acciones: '',
    responsable: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let filtered = fichas;
    
    if (searchTerm) {
      filtered = filtered.filter(f => 
        f.nombreProyecto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.lider.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.codigo.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedEstado !== 'todos') {
      filtered = filtered.filter(f => f.estado === selectedEstado);
    }

    setFilteredFichas(filtered);
  }, [searchTerm, selectedEstado, fichas]);

  const generateCodigo = (nombre: string) => {
    const palabras = nombre.split(' ');
    let letras = '';
    if (palabras.length >= 2) {
      letras = (palabras[0][0] + palabras[1][0]).toUpperCase();
    } else {
      letras = nombre.substring(0, 2).toUpperCase();
    }
    const numeros = Math.floor(1000 + Math.random() * 9000);
    return `${letras}-${numeros}`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'nombreProyecto' && modalMode === 'add') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        codigo: generateCodigo(value)
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleRecursosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const recursos = e.target.value.split(',').map(r => r.trim());
    setFormData(prev => ({ ...prev, recursos }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.nombreProyecto) newErrors.nombreProyecto = 'El nombre es obligatorio';
    if (!formData.cliente) newErrors.cliente = 'El cliente es obligatorio';
    if (!formData.lider) newErrors.lider = 'El líder es obligatorio';
    if (formData.venta <= 0) newErrors.venta = 'La venta debe ser mayor a 0';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAdd = () => {
    setModalMode('add');
    setFormData({
      codigo: '',
      nombreProyecto: '',
      cliente: '',
      lider: '',
      descripcion: '',
      tecnologias: '',
      venta: 0,
      hhImplementacion: 0,
      hhPeriodo: 0,
      recursos: [],
      fechaInicio: '',
      fechaTermino: '',
      contraparte: '',
      estado: 'No Iniciada',
      avance: 0,
      hhPlanificadas: 0,
      hhReal: 0,
      alertas: '',
      acciones: '',
      responsable: '',
    });
    setShowModal(true);
  };

  const handleEdit = (ficha: Ficha) => {
    setModalMode('edit');
    setCurrentFicha(ficha);
    setFormData({
      codigo: ficha.codigo,
      nombreProyecto: ficha.nombreProyecto,
      cliente: ficha.cliente,
      lider: ficha.lider,
      descripcion: ficha.descripcion,
      tecnologias: ficha.tecnologias,
      venta: ficha.venta,
      hhImplementacion: ficha.hhImplementacion,
      hhPeriodo: ficha.hhPeriodo,
      recursos: ficha.recursos,
      fechaInicio: ficha.fechaInicio,
      fechaTermino: ficha.fechaTermino,
      contraparte: ficha.contraparte,
      estado: ficha.estado,
      avance: ficha.avance,
      hhPlanificadas: ficha.hhPlanificadas,
      hhReal: ficha.hhReal,
      alertas: ficha.alertas,
      acciones: ficha.acciones,
      responsable: ficha.responsable,
    });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    setFichaToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (fichaToDelete) {
      setFichas(prev => prev.filter(f => f.id !== fichaToDelete));
      setShowDeleteConfirm(false);
      setFichaToDelete(null);
    }
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    if (modalMode === 'add') {
      const newFicha: Ficha = {
        id: Date.now().toString(),
        ...formData,
        bitacora: []
      };
      setFichas(prev => [...prev, newFicha]);
    } else {
      if (currentFicha) {
        setFichas(prev => prev.map(f => 
          f.id === currentFicha.id 
            ? { ...f, ...formData, bitacora: f.bitacora }
            : f
        ));
      }
    }
    
    setShowModal(false);
    setCurrentFicha(null);
  };

  const exportToExcel = () => {
    const dataToExport = filteredFichas.map(f => ({
      'Código': f.codigo,
      'Proyecto': f.nombreProyecto,
      'Cliente': f.cliente,
      'Líder': f.lider,
      'Descripción': f.descripcion,
      'Tecnologías': f.tecnologias,
      'Venta ($)': f.venta,
      'HH Implementación': f.hhImplementacion,
      'HH Periodo': f.hhPeriodo,
      'Recursos': f.recursos.join(', '),
      'Fecha Inicio': f.fechaInicio,
      'Fecha Término': f.fechaTermino,
      'Contraparte': f.contraparte,
      'Estado': f.estado,
      'Avance %': f.avance,
      'HH Planificadas': f.hhPlanificadas,
      'HH Real': f.hhReal,
      'Alertas': f.alertas || '',
      'Acciones': f.acciones || '',
      'Responsable': f.responsable,
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(dataToExport);

    const colWidths = [
      { wch: 15 }, { wch: 25 }, { wch: 20 }, { wch: 20 }, { wch: 60 },
      { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 40 },
      { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 10 },
      { wch: 15 }, { wch: 12 }, { wch: 35 }, { wch: 35 }, { wch: 20 },
    ];
    ws['!cols'] = colWidths;

    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:T1');

    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
      if (!ws[cellAddress]) continue;
      
      ws[cellAddress].s = {
        font: { bold: true, color: { rgb: "FFFFFF" }, sz: 12, name: "Arial" },
        fill: { fgColor: { rgb: "1E3A5F" } },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "medium", color: { rgb: "000000" } },
          bottom: { style: "medium", color: { rgb: "000000" } },
          left: { style: "medium", color: { rgb: "000000" } },
          right: { style: "medium", color: { rgb: "000000" } }
        }
      };
    }

    for (let R = 1; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[cellAddress]) continue;
        
        let horizontalAlign: 'left' | 'center' | 'right' = "left";
        
        if (C === 6 || C === 7 || C === 8 || C === 14 || C === 15 || C === 16) {
          horizontalAlign = "right";
        }
        
        if (C === 13 || C === 14) {
          horizontalAlign = "center";
        }

        if (C === 6) {
          ws[cellAddress].z = '"$"#,##0.00';
        }

        let bgColor = "FFFFFF";
        let fontColor = "000000";
        let fontWeight = false;

        if (C === 13) {
          const estado = ws[cellAddress].v;
          if (estado === 'En Curso') {
            bgColor = "C6EFCE";
            fontColor = "006100";
            fontWeight = true;
          } else if (estado === 'Standby') {
            bgColor = "FFEB9C";
            fontColor = "9C6500";
            fontWeight = true;
          } else if (estado === 'Completada') {
            bgColor = "DDEBF7";
            fontColor = "1E3A5F";
            fontWeight = true;
          } else if (estado === 'No Iniciada') {
            bgColor = "F2F2F2";
            fontColor = "333333";
            fontWeight = true;
          }
        }

        if (C === 14) {
          const avance = parseInt(ws[cellAddress].v);
          if (avance === 100) {
            bgColor = "C6EFCE";
            fontColor = "006100";
          } else if (avance >= 75) {
            bgColor = "FFEB9C";
            fontColor = "9C6500";
          } else if (avance >= 50) {
            bgColor = "FFC7CE";
            fontColor = "9C0006";
          }
        }

        if (C === 17 && ws[cellAddress].v && ws[cellAddress].v !== '') {
          bgColor = "FFC7CE";
          fontColor = "9C0006";
          fontWeight = true;
        }

        if (C === 6) {
          fontColor = "006100";
          fontWeight = true;
        }

        ws[cellAddress].s = {
          font: { color: { rgb: fontColor }, bold: fontWeight, sz: 11, name: "Arial" },
          fill: { fgColor: { rgb: bgColor } },
          alignment: { horizontal: horizontalAlign, vertical: "center" },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } }
          }
        };
      }
    }

    XLSX.utils.book_append_sheet(wb, ws, 'Fichas');
    const fecha = new Date();
    const fechaStr = `${fecha.getFullYear()}-${(fecha.getMonth()+1).toString().padStart(2,'0')}-${fecha.getDate().toString().padStart(2,'0')}`;
    XLSX.writeFile(wb, `RPA_Fichas_${fechaStr}.xlsx`);
  };

  const getEstadoColor = (estado: string) => {
    switch(estado) {
      case 'En Curso': return 'bg-green-500 text-white';
      case 'Standby': return 'bg-yellow-500 text-white';
      case 'No Iniciada': return 'bg-gray-500 text-white';
      case 'Completada': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
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
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-md">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="ml-2 text-base sm:text-lg md:text-xl font-semibold text-gray-800 truncate">
                  Gestión Fichas
                </span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Barra de herramientas */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleAdd}
              className="flex-1 sm:flex-none inline-flex items-center justify-center px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm font-medium rounded-md border border-green-700"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span className="hidden xs:inline">Nuevo</span>
              <span className="xs:hidden">+</span>
            </button>
            <button
              onClick={exportToExcel}
              className="flex-1 sm:flex-none inline-flex items-center justify-center px-3 py-1.5 bg-green-700 hover:bg-green-800 text-white text-xs sm:text-sm font-medium rounded-md border border-green-800"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span className="hidden xs:inline">Excel</span>
              <span className="xs:hidden">📊</span>
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto py-4 sm:py-6 md:py-8 px-3 sm:px-4 md:px-6 lg:px-8">
        {/* Filtros */}
        <div className="mb-4 sm:mb-6 bg-white p-3 sm:p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-3">
            <div className="relative">
              <label className="block text-xs font-medium text-gray-600 mb-1">Buscar</label>
              <input
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-2 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
              <svg className="absolute left-2 top-7 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Estado</label>
              <select
                value={selectedEstado}
                onChange={(e) => setSelectedEstado(e.target.value)}
                className="w-full px-2 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                <option value="todos">Todos</option>
                <option value="En Curso">Curso</option>
                <option value="Standby">Standby</option>
                <option value="No Iniciada">No Ini</option>
                <option value="Completada">Compl</option>
              </select>
            </div>
            <div className="xs:col-span-2 md:col-span-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">Registros</label>
              <div className="bg-gray-100 px-3 py-1.5 rounded border border-gray-300 text-xs sm:text-sm">
                {filteredFichas.length} fichas
              </div>
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-xs sm:text-sm">
              <thead className="bg-gradient-to-r from-purple-600 to-pink-600">
                <tr>
                  <th className="px-2 sm:px-3 py-2 text-left font-semibold text-white uppercase tracking-wider">
                    Código
                  </th>
                  <th className="px-2 sm:px-3 py-2 text-left font-semibold text-white uppercase tracking-wider hidden xs:table-cell">
                    Proyecto
                  </th>
                  <th className="px-2 sm:px-3 py-2 text-left font-semibold text-white uppercase tracking-wider hidden sm:table-cell">
                    Cliente
                  </th>
                  <th className="px-2 sm:px-3 py-2 text-left font-semibold text-white uppercase tracking-wider">
                    Venta
                  </th>
                  <th className="px-2 sm:px-3 py-2 text-left font-semibold text-white uppercase tracking-wider hidden lg:table-cell">
                    Estado
                  </th>
                  <th className="px-2 sm:px-3 py-2 text-left font-semibold text-white uppercase tracking-wider">
                    Avance
                  </th>
                  <th className="px-2 sm:px-3 py-2 text-left font-semibold text-white uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredFichas.length > 0 ? (
                  filteredFichas.map((ficha, index) => (
                    <tr key={ficha.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-purple-50`}>
                      <td className="px-2 sm:px-3 py-2 font-medium">{ficha.codigo}</td>
                      <td className="px-2 sm:px-3 py-2 truncate max-w-[100px] xs:max-w-none hidden xs:table-cell">
                        {ficha.nombreProyecto}
                      </td>
                      <td className="px-2 sm:px-3 py-2 hidden sm:table-cell">{ficha.cliente}</td>
                      <td className="px-2 sm:px-3 py-2 text-green-600 font-bold">
                        ${ficha.venta.toLocaleString()}
                      </td>
                      <td className="px-2 sm:px-3 py-2 hidden lg:table-cell">
                        <span className={`px-1.5 py-0.5 rounded text-white text-xs font-bold ${getEstadoColor(ficha.estado)}`}>
                          {ficha.estado}
                        </span>
                      </td>
                      <td className="px-2 sm:px-3 py-2">
                        <div className="flex items-center gap-1">
                          <div className="w-12 sm:w-16 h-1.5 bg-gray-200 rounded-full">
                            <div className="bg-purple-600 h-1.5 rounded-full" style={{ width: `${ficha.avance}%` }}></div>
                          </div>
                          <span className="text-xs">{ficha.avance}%</span>
                        </div>
                      </td>
                      <td className="px-2 sm:px-3 py-2">
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleEdit(ficha)} className="text-purple-600 hover:text-purple-800 p-1" title="Editar">
                            ✏️
                          </button>
                          <button onClick={() => handleDelete(ficha.id)} className="text-red-600 hover:text-red-800 p-1" title="Eliminar">
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-gray-400">
                      No hay fichas
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="bg-gray-100 px-4 py-2 border-t border-gray-200 text-xs">
            <span>📊 {filteredFichas.length} registros</span>
          </div>
        </div>
      </main>

      {/* Modal de Ficha */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 sm:px-6 py-3 rounded-t-lg flex justify-between items-center">
              <h3 className="text-base sm:text-lg font-semibold">
                {modalMode === 'add' ? '➕ Nueva Ficha' : '✏️ Editar Ficha'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-white hover:text-gray-300 text-xl">✕</button>
            </div>
            
            <div className="p-4 sm:p-6">
              <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {/* Columna izquierda */}
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1">📁 Nombre del Proyecto *</label>
                      <input
                        type="text"
                        name="nombreProyecto"
                        value={formData.nombreProyecto}
                        onChange={handleInputChange}
                        className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border-2 border-gray-300 rounded focus:border-purple-500 outline-none"
                        required
                      />
                      {errors.nombreProyecto && <p className="text-red-500 text-xs mt-1">{errors.nombreProyecto}</p>}
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1">🏢 Cliente *</label>
                      <input
                        type="text"
                        name="cliente"
                        value={formData.cliente}
                        onChange={handleInputChange}
                        className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border-2 border-gray-300 rounded focus:border-purple-500 outline-none"
                        required
                      />
                      {errors.cliente && <p className="text-red-500 text-xs mt-1">{errors.cliente}</p>}
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1">👤 Líder *</label>
                      <input
                        type="text"
                        name="lider"
                        value={formData.lider}
                        onChange={handleInputChange}
                        className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border-2 border-gray-300 rounded focus:border-purple-500 outline-none"
                        required
                      />
                      {errors.lider && <p className="text-red-500 text-xs mt-1">{errors.lider}</p>}
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1">📝 Descripción</label>
                      <textarea
                        name="descripcion"
                        value={formData.descripcion}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border-2 border-gray-300 rounded focus:border-purple-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1">💻 Tecnologías</label>
                      <input
                        type="text"
                        name="tecnologias"
                        value={formData.tecnologias}
                        onChange={handleInputChange}
                        className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border-2 border-gray-300 rounded focus:border-purple-500 outline-none"
                        placeholder="Ej: Python, JavaScript"
                      />
                    </div>
                  </div>

                  {/* Columna derecha */}
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1">💰 Venta ($) *</label>
                      <input
                        type="number"
                        name="venta"
                        value={formData.venta}
                        onChange={handleInputChange}
                        className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border-2 border-gray-300 rounded focus:border-purple-500 outline-none"
                        required
                      />
                      {errors.venta && <p className="text-red-500 text-xs mt-1">{errors.venta}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      <div>
                        <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1">⏱️ HH Imp</label>
                        <input
                          type="number"
                          name="hhImplementacion"
                          value={formData.hhImplementacion}
                          onChange={handleInputChange}
                          className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border-2 border-gray-300 rounded focus:border-purple-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1">⏱️ HH Per</label>
                        <input
                          type="number"
                          name="hhPeriodo"
                          value={formData.hhPeriodo}
                          onChange={handleInputChange}
                          className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border-2 border-gray-300 rounded focus:border-purple-500 outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1">👥 Recursos</label>
                      <input
                        type="text"
                        name="recursos"
                        value={formData.recursos.join(', ')}
                        onChange={handleRecursosChange}
                        className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border-2 border-gray-300 rounded focus:border-purple-500 outline-none"
                        placeholder="Ej: Juan, María, Carlos"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      <div>
                        <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1">📅 Inicio</label>
                        <input
                          type="date"
                          name="fechaInicio"
                          value={formData.fechaInicio}
                          onChange={handleInputChange}
                          className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border-2 border-gray-300 rounded focus:border-purple-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1">📅 Término</label>
                        <input
                          type="date"
                          name="fechaTermino"
                          value={formData.fechaTermino}
                          onChange={handleInputChange}
                          className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border-2 border-gray-300 rounded focus:border-purple-500 outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1">🤝 Contraparte</label>
                      <input
                        type="text"
                        name="contraparte"
                        value={formData.contraparte}
                        onChange={handleInputChange}
                        className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border-2 border-gray-300 rounded focus:border-purple-500 outline-none"
                        placeholder="Cliente interno/externo"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      <div>
                        <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1">⚡ Estado</label>
                        <select
                          name="estado"
                          value={formData.estado}
                          onChange={handleInputChange}
                          className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border-2 border-gray-300 rounded focus:border-purple-500 outline-none"
                        >
                          <option value="No Iniciada">No Iniciada</option>
                          <option value="En Curso">En Curso</option>
                          <option value="Standby">Standby</option>
                          <option value="Completada">Completada</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1">📊 % Avance</label>
                        <input
                          type="number"
                          name="avance"
                          value={formData.avance}
                          onChange={handleInputChange}
                          min="0"
                          max="100"
                          className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border-2 border-gray-300 rounded focus:border-purple-500 outline-none"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      <div>
                        <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1">📋 HH Plan</label>
                        <input
                          type="number"
                          name="hhPlanificadas"
                          value={formData.hhPlanificadas}
                          onChange={handleInputChange}
                          className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border-2 border-gray-300 rounded focus:border-purple-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1">✅ HH Real</label>
                        <input
                          type="number"
                          name="hhReal"
                          value={formData.hhReal}
                          onChange={handleInputChange}
                          className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border-2 border-gray-300 rounded focus:border-purple-500 outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1">⚠️ Alertas</label>
                      <textarea
                        name="alertas"
                        value={formData.alertas}
                        onChange={handleInputChange}
                        rows={2}
                        className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border-2 border-gray-300 rounded focus:border-purple-500 outline-none"
                        placeholder="Alertas detectadas..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1">🔧 Acciones</label>
                      <textarea
                        name="acciones"
                        value={formData.acciones}
                        onChange={handleInputChange}
                        rows={2}
                        className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border-2 border-gray-300 rounded focus:border-purple-500 outline-none"
                        placeholder="Acciones tomadas..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1">👤 Responsable</label>
                      <input
                        type="text"
                        name="responsable"
                        value={formData.responsable}
                        onChange={handleInputChange}
                        className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border-2 border-gray-300 rounded focus:border-purple-500 outline-none"
                        placeholder="Responsable"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 sm:mt-6 flex justify-end space-x-2 sm:space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm border-2 border-gray-300 rounded text-gray-700 hover:bg-gray-100 font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-purple-600 text-white rounded hover:bg-purple-700 font-bold"
                  >
                    {modalMode === 'add' ? 'Crear' : 'Guardar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-4 sm:px-6 py-3 rounded-t-lg">
              <h3 className="text-base sm:text-lg font-semibold">🗑️ Confirmar eliminación</h3>
            </div>
            <div className="p-4 sm:p-6">
              <p className="text-sm sm:text-base text-gray-700 mb-4 sm:mb-6">
                ¿Estás seguro de que deseas eliminar esta ficha?
              </p>
              <div className="flex justify-end space-x-2 sm:space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm border-2 border-gray-300 rounded text-gray-700 hover:bg-gray-100 font-bold"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-red-600 text-white rounded hover:bg-red-700 font-bold"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Fichas;