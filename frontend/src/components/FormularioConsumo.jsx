import React, { useState, useEffect } from 'react';
import { crearLecturaConsumo } from '../api/consumos';
import { listarInmuebles } from '../api/inmuebles';

export default function FormularioConsumo({ inmueblePreseleccionado }) {
  const [formData, setFormData] = useState({
    inmueble_id: inmueblePreseleccionado || '',
    servicio: 'LUZ',
    fecha_inicio: '',
    fecha_fin: '',
    consumo: ''
  });

  const [inmuebles, setInmuebles] = useState([]);
  const [errores, setErrores] = useState({});
  const [mensajeGlobal, setMensajeGlobal] = useState('');
  const [cargando, setCargando] = useState(false);

  // Sincronizar si cambia el inmueble preseleccionado desde la tarjeta
  useEffect(() => {
    if (inmueblePreseleccionado) {
      setFormData((prev) => ({ ...prev, inmueble_id: inmueblePreseleccionado }));
    }
  }, [inmueblePreseleccionado]);

  // Cargar los inmuebles del usuario al montar el componente
  useEffect(() => {
    const cargarInmuebles = async () => {
      try {
        const data = await listarInmuebles();
        setInmuebles(data);
        if (!inmueblePreseleccionado && data.length > 0) {
          setFormData((prev) => ({ ...prev, inmueble_id: data[0].id }));
        }
      } catch (err) {
        setMensajeGlobal('Error al cargar los inmuebles.');
      }
    };
    cargarInmuebles();
  }, [inmueblePreseleccionado]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errores[e.target.name]) {
      setErrores({ ...errores, [e.target.name]: null });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    setErrores({});
    setMensajeGlobal('');

    try {
      await crearLecturaConsumo({
        ...formData,
        inmueble_id: Number(formData.inmueble_id),
        consumo: Number(formData.consumo)
      });

      setMensajeGlobal('¡Lectura de consumo registrada con éxito!');
      setFormData({
        inmueble_id: inmueblePreseleccionado || (inmuebles.length > 0 ? inmuebles[0].id : ''),
        servicio: 'LUZ',
        fecha_inicio: '',
        fecha_fin: '',
        consumo: ''
      });
    } catch (err) {
      if (err.errores) {
        setErrores(err.errores);
      } else {
        setMensajeGlobal(err.message || 'Ocurrió un error al registrar la lectura.');
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md border border-slate-200">
      <h2 className="text-xl font-bold mb-4 text-slate-800">Registrar Lectura de Consumo</h2>
      
      {mensajeGlobal && (
        <div className={`p-3 mb-4 rounded text-sm ${mensajeGlobal.includes('éxito') ? 'bg-teal-50 text-teal-700 border border-teal-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {mensajeGlobal}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Inmueble</label>
          <select
            name="inmueble_id"
            value={formData.inmueble_id}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border focus:border-teal-500 focus:ring-teal-500"
          >
            {inmuebles.map((inm) => (
              <option key={inm.id} value={inm.id}>
                {inm.nombre} {inm.direccion ? `- ${inm.direccion}` : ''}
              </option>
            ))}
          </select>
          {errores.inmueble_id && <p className="text-red-600 text-xs mt-1">{errores.inmueble_id}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Servicio</label>
          <select
            name="servicio"
            value={formData.servicio}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border focus:border-teal-500 focus:ring-teal-500"
          >
            <option value="LUZ">Luz</option>
            <option value="GAS">Gas</option>
            <option value="AGUA">Agua</option>
          </select>
          {errores.servicio && <p className="text-red-600 text-xs mt-1">{errores.servicio}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Fecha de Inicio</label>
          <input
            type="date"
            name="fecha_inicio"
            value={formData.fecha_inicio}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border focus:border-teal-500 focus:ring-teal-500"
          />
          {errores.fecha_inicio && <p className="text-red-600 text-xs mt-1">{errores.fecha_inicio}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Fecha de Fin</label>
          <input
            type="date"
            name="fecha_fin"
            value={formData.fecha_fin}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border focus:border-teal-500 focus:ring-teal-500"
          />
          {errores.fecha_fin && <p className="text-red-600 text-xs mt-1">{errores.fecha_fin}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Consumo</label>
          <input
            type="number"
            step="any"
            name="consumo"
            value={formData.consumo}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border focus:border-teal-500 focus:ring-teal-500"
            placeholder="Ej: 150.5"
          />
          {errores.consumo && <p className="text-red-600 text-xs mt-1">{errores.consumo}</p>}
        </div>

        <button
          type="submit"
          disabled={cargando}
          className="w-full bg-teal-600 text-white p-2 rounded-md hover:bg-teal-700 transition font-medium shadow-sm"
        >
          {cargando ? 'Registrando...' : 'Registrar Consumo'}
        </button>
      </form>
    </div>
  );
}