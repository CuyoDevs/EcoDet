import React, { useState } from 'react';
import { crearLecturaConsumo } from '../api/consumos';

export default function FormularioConsumo({ token }) {
  const [formData, setFormData] = useState({
    inmueble_id: '',
    servicio: 'LUZ',
    fecha_inicio: '',
    fecha_fin: '',
    consumo: ''
  });
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
  const [cargando, setCargando] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    setMensaje({ texto: '', tipo: '' });

    try {
      // Obtenemos el token de las props o del localStorage según lo maneje el equipo
      const tokenActual = token || localStorage.getItem('token');
      
      await crearLecturaConsumo({
        ...formData,
        inmueble_id: Number(formData.inmueble_id),
        consumo: Number(formData.consumo)
      }, tokenActual);

      setMensaje({ texto: '¡Lectura de consumo registrada con éxito!', tipo: 'exito' });
      setFormData({ inmueble_id: '', servicio: 'LUZ', fecha_inicio: '', fecha_fin: '', consumo: '' });
    } catch (error) {
      setMensaje({ texto: error.message, tipo: 'error' });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4 text-gray-800">Registrar Lectura de Consumo</h2>
      
      {mensaje.texto && (
        <div className={`p-3 mb-4 rounded text-sm ${mensaje.tipo === 'exito' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {mensaje.texto}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">ID del Inmueble</label>
          <input
            type="number"
            name="inmueble_id"
            value={formData.inmueble_id}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
            placeholder="Ej: 1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Servicio</label>
          <select
            name="servicio"
            value={formData.servicio}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
          >
            <option value="LUZ">Luz</option>
            <option value="GAS">Gas</option>
            <option value="AGUA">Agua</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Fecha de Inicio</label>
          <input
            type="date"
            name="fecha_inicio"
            value={formData.fecha_inicio}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Fecha de Fin</label>
          <input
            type="date"
            name="fecha_fin"
            value={formData.fecha_fin}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Consumo</label>
          <input
            type="number"
            step="any"
            name="consumo"
            value={formData.consumo}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
            placeholder="Ej: 150.5"
          />
        </div>

        <button
          type="submit"
          disabled={cargando}
          className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition font-medium"
        >
          {cargando ? 'Registrando...' : 'Registrar Consumo'}
        </button>
      </form>
    </div>
  );
}