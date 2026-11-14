import React, { useState, useEffect } from 'react'
import { crearLecturaConsumo, crearLecturasLote } from '../api/consumos'
import CampoFormulario from './CampoFormulario'
import { Zap, Flame, Droplets, CheckCircle2, AlertTriangle, Plus, Trash2 } from 'lucide-react'

const UNIDADES = {
  LUZ: 'kWh',
  GAS: 'm³',
  AGUA: 'm³'
}

export default function FormularioConsumo({ inmuebleId, inmuebles = [], onLecturaCreada, onCancelar }) {
  const [modo, setModo] = useState('individual') // 'individual' | 'lote'
  
  // Estado para Lectura Individual
  const [formData, setFormData] = useState({
    inmueble_id: inmuebleId || (inmuebles.length > 0 ? inmuebles[0].id : ''),
    servicio: 'LUZ',
    fecha_inicio: '',
    fecha_fin: '',
    consumo: ''
  })

  // Estado para Carga en Lote (HU-09 / DET-17)
  const [filasLote, setFilasLote] = useState([
    { servicio: 'LUZ', fecha_inicio: '', fecha_fin: '', consumo: '' },
    { servicio: 'LUZ', fecha_inicio: '', fecha_fin: '', consumo: '' }
  ])

  const [errores, setErrores] = useState({})
  const [mensajeExito, setMensajeExito] = useState('')
  const [alertaReciente, setAlertaReciente] = useState(null)
  const [resumenLote, setResumenLote] = useState(null)
  const [errorGeneral, setErrorGeneral] = useState('')
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    if (inmuebleId) {
      setFormData((prev) => ({ ...prev, inmueble_id: inmuebleId }))
    }
  }, [inmuebleId])

  // --- Handlers Individual ---
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

  const handleSubmitIndividual = async (e) => {
    e.preventDefault()
    setCargando(true)
    setErrores({})
    setMensajeExito('')
    setAlertaReciente(null)
    setResumenLote(null)
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

      // HU-13 / DET-88: Advertencia inmediata si el detector disparó alerta de consumo inusual
      if (nuevaLectura.alerta || nuevaLectura.evaluacion?.alerta_generada) {
        setAlertaReciente({
          tipo: nuevaLectura.alerta?.tipo || (nuevaLectura.evaluacion?.estado === 'alta' ? 'ALTA' : 'BAJA'),
          desvio_porcentual: nuevaLectura.evaluacion?.desvio_porcentual ?? nuevaLectura.alerta?.desvio_porcentual,
          mensaje: nuevaLectura.evaluacion?.mensaje || 'Se ha detectado un consumo inusual en este servicio.',
          consumo_por_dia: nuevaLectura.evaluacion?.consumo_por_dia ?? nuevaLectura.alerta?.consumo_por_dia,
          consumo_habitual: nuevaLectura.evaluacion?.promedio ?? nuevaLectura.alerta?.consumo_habitual_por_dia,
          servicio: nuevaLectura.servicio
        })
      } else {
        setAlertaReciente(null)
      }

      setFormData((prev) => ({
        ...prev,
        fecha_inicio: '',
        fecha_fin: '',
        consumo: ''
      }))
      if (onLecturaCreada) onLecturaCreada(nuevaLectura)
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

  // --- Handlers Lote (HU-09) ---
  const handleFilaChange = (index, campo, valor) => {
    setFilasLote((prev) => {
      const copia = [...prev]
      copia[index] = { ...copia[index], [campo]: valor }
      return copia
    })
    if (errores[`fila_${index}`]) {
      setErrores((prev) => {
        const c = { ...prev }
        delete c[`fila_${index}`]
        return c
      })
    }
  }

  const agregarFila = () => {
    const ultimoServicio = filasLote.length > 0 ? filasLote[filasLote.length - 1].servicio : 'LUZ'
    setFilasLote((prev) => [
      ...prev,
      { servicio: ultimoServicio, fecha_inicio: '', fecha_fin: '', consumo: '' }
    ])
  }

  const eliminarFila = (index) => {
    if (filasLote.length <= 1) return
    setFilasLote((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmitLote = async (e) => {
    e.preventDefault()
    setCargando(true)
    setErrores({})
    setMensajeExito('')
    setAlertaReciente(null)
    setResumenLote(null)
    setErrorGeneral('')

    // Validación local de campos vacíos en el lote
    const erroresLocales = {}
    const lecturasValidadas = []

    filasLote.forEach((f, idx) => {
      if (!f.fecha_inicio || !f.fecha_fin || f.consumo === '') {
        erroresLocales[`fila_${idx}`] = 'Completa todos los campos de esta fila.'
      } else if (f.fecha_inicio > f.fecha_fin) {
        erroresLocales[`fila_${idx}`] = 'La fecha de fin no puede ser anterior al inicio.'
      } else if (Number(f.consumo) < 0) {
        erroresLocales[`fila_${idx}`] = 'El consumo no puede ser negativo.'
      } else {
        lecturasValidadas.push({
          servicio: f.servicio,
          fecha_inicio: f.fecha_inicio,
          fecha_fin: f.fecha_fin,
          consumo: Number(f.consumo)
        })
      }
    })

    if (Object.keys(erroresLocales).length > 0) {
      setErrores(erroresLocales)
      setErrorGeneral('Corrige los errores señalados en las filas antes de guardar (todo o nada).')
      setCargando(false)
      return
    }

    try {
      const payload = {
        inmueble_id: Number(formData.inmueble_id),
        lecturas: lecturasValidadas
      }

      const res = await crearLecturasLote(payload)
      setMensajeExito(`¡Lote de ${res.cantidad_cargadas} facturas registrado con éxito!`)
      setResumenLote(res)
      setFilasLote([
        { servicio: 'LUZ', fecha_inicio: '', fecha_fin: '', consumo: '' },
        { servicio: 'LUZ', fecha_inicio: '', fecha_fin: '', consumo: '' }
      ])
      if (onLecturaCreada) onLecturaCreada(res)
    } catch (err) {
      if (err.data?.errores) {
        setErrores(err.data.errores)
      } else if (err.errores) {
        setErrores(err.errores)
      }
      setErrorGeneral(err.data?.mensaje || err.message || 'Error al procesar el lote (todo o nada).')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Cargar lecturas de consumo</h2>
          <p className="text-xs text-slate-500 mt-0.5">Registra una factura actual o carga varias facturas anteriores (W3)</p>
        </div>

        {/* Selector de pestañas W3 */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => { setModo('individual'); setErrores({}); setErrorGeneral(''); setMensajeExito(''); setAlertaReciente(null); }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
              modo === 'individual'
                ? 'bg-white text-teal-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Lectura individual
          </button>
          <button
            type="button"
            onClick={() => { setModo('lote'); setErrores({}); setErrorGeneral(''); setMensajeExito(''); setAlertaReciente(null); }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
              modo === 'lote'
                ? 'bg-white text-teal-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Carga histórica (lote)
          </button>
        </div>
      </div>

      {mensajeExito && (
        <div role="status" className="p-3 mb-4 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
          <span>{mensajeExito}</span>
        </div>
      )}

      {/* Banner de Advertencia Inmediata de Alerta (HU-13 / DET-88) */}
      {alertaReciente && (
        <div
          role="alert"
          aria-label="banner-alerta-consumo"
          className={`p-4 mb-4 rounded-xl border shadow-sm transition-all ${
            alertaReciente.tipo === 'ALTA'
              ? 'bg-amber-50/90 border-amber-300 text-amber-950'
              : 'bg-sky-50/90 border-sky-300 text-sky-950'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
              alertaReciente.tipo === 'ALTA' ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-700'
            }`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1 text-sm space-y-1">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="font-semibold text-base">
                  {alertaReciente.tipo === 'ALTA' ? '¡Alerta de Consumo Alto!' : '¡Alerta de Consumo Bajo Inusual!'}
                </h3>
                {alertaReciente.desvio_porcentual != null && (
                  <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${
                    alertaReciente.tipo === 'ALTA'
                      ? 'bg-amber-200 text-amber-900'
                      : 'bg-sky-200 text-sky-900'
                  }`}>
                    {alertaReciente.desvio_porcentual > 0 ? `+${alertaReciente.desvio_porcentual}%` : `${alertaReciente.desvio_porcentual}%`}
                  </span>
                )}
              </div>
              <p className="text-slate-700">{alertaReciente.mensaje}</p>
              {alertaReciente.consumo_por_dia != null && alertaReciente.consumo_habitual != null && (
                <div className="text-xs text-slate-500 pt-1 flex items-center gap-4 border-t border-slate-200/60 mt-1.5">
                  <span>Registrado: <strong>{alertaReciente.consumo_por_dia} /día</strong></span>
                  <span>Habitual: <strong>{alertaReciente.consumo_habitual} /día</strong></span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {resumenLote && (
        <div className="p-4 mb-4 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2">
          <p className="font-semibold text-slate-800">Estado del detector tras la carga:</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>Luz: {resumenLote.detector_activo_por_servicio.LUZ ? <span className="text-teal-700 font-bold">Activo (≥ 6 lecturas)</span> : <span className="text-slate-500">Aprendiendo patrón</span>}</li>
            <li>Gas: {resumenLote.detector_activo_por_servicio.GAS ? <span className="text-teal-700 font-bold">Activo (≥ 6 lecturas)</span> : <span className="text-slate-500">Aprendiendo patrón</span>}</li>
            <li>Agua: {resumenLote.detector_activo_por_servicio.AGUA ? <span className="text-teal-700 font-bold">Activo (≥ 6 lecturas)</span> : <span className="text-slate-500">Sin datos suficientes</span>}</li>
          </ul>

          {resumenLote.lecturas?.some(l => l.alerta || l.evaluacion?.alerta_generada) && (
            <div className="pt-2 border-t border-slate-200 space-y-1">
              <p className="font-semibold text-amber-800 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Alertas generadas en el lote ({resumenLote.lecturas.filter(l => l.alerta || l.evaluacion?.alerta_generada).length}):</span>
              </p>
              <ul className="list-disc list-inside space-y-0.5 pl-2 text-slate-700">
                {resumenLote.lecturas
                  .filter(l => l.alerta || l.evaluacion?.alerta_generada)
                  .map((l, i) => (
                    <li key={i}>
                      {l.servicio} ({l.fecha_inicio} a {l.fecha_fin}): <strong className="text-amber-800">{l.evaluacion?.estado === 'alta' ? 'Consumo Alto' : 'Consumo Bajo'}</strong>
                      {l.evaluacion?.desvio_porcentual != null && ` (${l.evaluacion.desvio_porcentual > 0 ? '+' : ''}${l.evaluacion.desvio_porcentual}%)`}
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {errorGeneral && (
        <div role="alert" className="p-3 mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{errorGeneral}</span>
        </div>
      )}

      {/* Selector de Inmueble común si no viene fijado */}
      {inmuebles.length > 0 && !inmuebleId && (
        <div className="mb-4">
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
        </div>
      )}

      {/* MODO 1: LECTURA INDIVIDUAL (HU-08) */}
      {modo === 'individual' && (
        <form onSubmit={handleSubmitIndividual} noValidate className="space-y-5">
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
          </div>

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
      )}

      {/* MODO 2: CARGA EN LOTE (HU-09 / DET-17) */}
      {modo === 'lote' && (
        <form onSubmit={handleSubmitLote} noValidate className="space-y-5">
          <div className="bg-amber-50/60 border border-amber-200 rounded-lg p-3 text-xs text-amber-900">
            <strong>Regla todo o nada:</strong> Ingresa tus facturas anteriores. Si alguna fecha se superpone o es inválida, ninguna se guardará hasta que corrijas los errores.
          </div>

          <div className="space-y-3">
            {filasLote.map((fila, idx) => (
              <div key={idx} className="border border-slate-200 rounded-lg p-3 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                  <span>Fila #{idx + 1}</span>
                  {filasLote.length > 1 && (
                    <button
                      type="button"
                      onClick={() => eliminarFila(idx)}
                      className="text-red-600 hover:text-red-800 flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Quitar</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Servicio</label>
                    <select
                      value={fila.servicio}
                      onChange={(e) => handleFilaChange(idx, 'servicio', e.target.value)}
                      className="w-full rounded border border-slate-300 bg-white p-1.5 text-xs focus:ring-1 focus:ring-teal-600"
                    >
                      <option value="LUZ">Luz (kWh)</option>
                      <option value="GAS">Gas (m³)</option>
                      <option value="AGUA">Agua (m³)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Inicio</label>
                    <input
                      type="date"
                      value={fila.fecha_inicio}
                      onChange={(e) => handleFilaChange(idx, 'fecha_inicio', e.target.value)}
                      className="w-full rounded border border-slate-300 bg-white p-1.5 text-xs focus:ring-1 focus:ring-teal-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Fin</label>
                    <input
                      type="date"
                      value={fila.fecha_fin}
                      onChange={(e) => handleFilaChange(idx, 'fecha_fin', e.target.value)}
                      className="w-full rounded border border-slate-300 bg-white p-1.5 text-xs focus:ring-1 focus:ring-teal-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                      Consumo ({UNIDADES[fila.servicio]})
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      placeholder="0.0"
                      value={fila.consumo}
                      onChange={(e) => handleFilaChange(idx, 'consumo', e.target.value)}
                      className="w-full rounded border border-slate-300 bg-white p-1.5 text-xs focus:ring-1 focus:ring-teal-600"
                    />
                  </div>
                </div>

                {errores[`fila_${idx}`] && (
                  <p className="text-red-600 text-xs font-medium pt-1">
                    {errores[`fila_${idx}`]}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={agregarFila}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Agregar fila</span>
            </button>

            <div className="flex items-center gap-2">
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
                {cargando ? 'Validando lote…' : 'Guardar lote de facturas'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  )
}
