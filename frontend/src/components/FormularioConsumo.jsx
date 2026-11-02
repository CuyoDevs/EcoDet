import React, { useState, useEffect } from 'react'
import { crearLecturaConsumo } from '../api/consumos'
import CampoFormulario from './CampoFormulario'
import { Zap, Flame, Droplets, CheckCircle2 } from 'lucide-react'

const UNIDADES = {
  LUZ: 'kWh',
  GAS: 'm³',
  AGUA: 'm³'
}

export default function FormularioConsumo({ inmuebleId, inmuebles = [], onLecturaCreada, onCancelar }) {
  const [formData, setFormData] = useState({
    inmueble_id: inmuebleId || (inmuebles.length > 0 ? inmuebles[0].id : ''),
    servicio: 'LUZ',
    fecha_inicio: '',
    fecha_fin: '',
    consumo: ''
  })

  const [errores, setErrores] = useState({})
  const [mensajeExito, setMensajeExito] = useState('')
  const [errorGeneral, setErrorGeneral] = useState('')
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    if (inmuebleId) {
      setFormData((prev) => ({ ...prev, inmueble_id: inmuebleId }))
    }
  }, [inmuebleId])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errores[name]) {
      setErrores((prev) => ({ ...prev, [name]: null }))
    }
  }

  const handleServicioChange = (servicio) => {
    setFormData((prev) => ({ ...prev, servicio }))
    if (errores.servicio) {
      setErrores((prev) => ({ ...prev, servicio: null }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setCargando(true)
    setErrores({})
    setMensajeExito('')
    setErrorGeneral('')

    try {
      const payload = {
        inmueble_id: Number(formData.inmueble_id),
        servicio: formData.servicio,
        fecha_inicio: formData.fecha_inicio,
        fecha_fin: formData.fecha_fin,
        consumo: Number(formData.consumo)
      }

      const nuevaLectura = await crearLecturaConsumo(payload)
      setMensajeExito('¡Lectura registrada con éxito!')
      setFormData((prev) => ({
        ...prev,
        fecha_inicio: '',
        fecha_fin: '',
        consumo: ''
      }))
      if (onLecturaCreada) {
        onLecturaCreada(nuevaLectura)
      }
    } catch (err) {
      if (err.errores && Object.keys(err.errores).length > 0) {
        setErrores(err.errores)
      } else {
        setErrorGeneral(err.message || 'Ocurrió un error al registrar la lectura.')
      }
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-800">Registrar lectura de consumo</h2>
        {onCancelar && (
          <button
            type="button"
            onClick={onCancelar}
            className="text-xs text-slate-500 hover:text-slate-800 font-medium"
          >
            Cerrar
          </button>
        )}
      </div>

      {mensajeExito && (
        <div role="status" className="p-3 mb-4 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-teal-600" />
          <span>{mensajeExito}</span>
        </div>
      )}

      {errorGeneral && (
        <div role="alert" className="p-3 mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {errorGeneral}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {/* Selector de Inmueble si hay varios */}
        {inmuebles.length > 0 && !inmuebleId && (
          <div>
            <label htmlFor="inmueble_id" className="block text-sm font-medium text-slate-700 mb-1">
              Inmueble *
            </label>
            <select
              id="inmueble_id"
              name="inmueble_id"
              value={formData.inmueble_id}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
            >
              {inmuebles.map((inm) => (
                <option key={inm.id} value={inm.id}>
                  {inm.nombre} {inm.direccion ? `(${inm.direccion})` : ''}
                </option>
              ))}
            </select>
            {errores.inmueble_id && (
              <p className="mt-1 text-xs text-red-600">{errores.inmueble_id}</p>
            )}
          </div>
        )}

        {/* Selector de Servicio con unidades fijas visibles (RN-02) */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Servicio *
          </label>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => handleServicioChange('LUZ')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-sm font-medium transition ${
                formData.servicio === 'LUZ'
                  ? 'border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-500'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Luz (kWh)</span>
            </button>

            <button
              type="button"
              onClick={() => handleServicioChange('GAS')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-sm font-medium transition ${
                formData.servicio === 'GAS'
                  ? 'border-blue-500 bg-blue-50 text-blue-900 ring-2 ring-blue-500'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Flame className="w-4 h-4 text-blue-500" />
              <span>Gas (m³)</span>
            </button>

            <button
              type="button"
              onClick={() => handleServicioChange('AGUA')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-sm font-medium transition ${
                formData.servicio === 'AGUA'
                  ? 'border-cyan-500 bg-cyan-50 text-cyan-900 ring-2 ring-cyan-500'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Droplets className="w-4 h-4 text-cyan-500" />
              <span>Agua (m³)</span>
            </button>
          </div>
          {errores.servicio && (
            <p className="mt-1 text-xs text-red-600">{errores.servicio}</p>
          )}
        </div>

        {/* Fechas de inicio y fin */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CampoFormulario
            id="fecha_inicio"
            name="fecha_inicio"
            etiqueta="Fecha de inicio *"
            type="date"
            value={formData.fecha_inicio}
            onChange={handleChange}
            error={errores.fecha_inicio}
          />

          <CampoFormulario
            id="fecha_fin"
            name="fecha_fin"
            etiqueta="Fecha de fin *"
            type="date"
            value={formData.fecha_fin}
            onChange={handleChange}
            error={errores.fecha_fin}
          />
        </div>

        {/* Consumo con unidad fija (RN-02, RN-05) */}
        <div>
          <label htmlFor="consumo" className="block text-sm font-medium text-slate-700 mb-1">
            Consumo ({UNIDADES[formData.servicio]}) *
          </label>
          <div className="relative">
            <input
              id="consumo"
              name="consumo"
              type="number"
              step="any"
              min="0"
              placeholder="Ej. 145.5"
              value={formData.consumo}
              onChange={handleChange}
              className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 ${
                errores.consumo
                  ? 'border-red-600 focus:border-red-600 focus:ring-red-600'
                  : 'border-slate-300 focus:border-teal-600 focus:ring-teal-600'
              }`}
            />
            <span className="absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-slate-400 pointer-events-none">
              {UNIDADES[formData.servicio]}
            </span>
          </div>
          {errores.consumo && (
            <p className="mt-1 text-xs text-red-600">{errores.consumo}</p>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          {onCancelar && (
            <button
              type="button"
              onClick={onCancelar}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 transition"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={cargando}
            className="rounded-lg bg-teal-600 px-5 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60 transition shadow-sm"
          >
            {cargando ? 'Registrando…' : 'Registrar consumo'}
          </button>
        </div>
      </form>
    </div>
  )
}
