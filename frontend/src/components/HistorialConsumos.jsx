// HistorialConsumos.jsx — HU-10 / DET-18
// Muestra el historial de lecturas de un inmueble agrupado por servicio,
// con gráfico de línea (SVG), estadísticas y estado del detector.
import React, { useEffect, useState } from 'react'
import { obtenerHistorial } from '../api/consumos'

const SERVICIOS = ['LUZ', 'GAS', 'AGUA']
const UNIDADES = { LUZ: 'kWh', GAS: 'm³', AGUA: 'm³' }
const COLORES = { LUZ: '#f59e0b', GAS: '#3b82f6', AGUA: '#06b6d4' }

// ─── Mini gráfico SVG de línea ────────────────────────────────────────────────
function GraficoLinea({ lecturas, color, onSeleccionar, seleccionada }) {
  if (!lecturas || lecturas.length === 0) return null

  const W = 320
  const H = 120
  const PADDING = 20

  const valores = lecturas.map((l) => l.consumo_por_dia)
  const minV = Math.min(...valores)
  const maxV = Math.max(...valores)
  const rango = maxV - minV || 1

  const toX = (i) => PADDING + (i / (lecturas.length - 1 || 1)) * (W - PADDING * 2)
  const toY = (v) => PADDING + (1 - (v - minV) / rango) * (H - PADDING * 2)

  const puntos = lecturas.map((l, i) => ({ x: toX(i), y: toY(l.consumo_por_dia), lectura: l }))
  const polyline = puntos.map((p) => `${p.x},${p.y}`).join(' ')

  return (
    <svg
      width={W}
      height={H}
      aria-label="Gráfico de consumo por día"
      className="w-full max-w-xs"
    >
      <polyline
        points={polyline}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      {puntos.map(({ x, y, lectura }, i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={seleccionada?.id === lectura.id ? 6 : 4}
          fill={lectura.tiene_alerta ? '#ef4444' : color}
          stroke="white"
          strokeWidth={1.5}
          className="cursor-pointer"
          role="button"
          aria-label={`Período ${lectura.fecha_inicio} al ${lectura.fecha_fin}: ${lectura.consumo_por_dia} por día`}
          onClick={() => onSeleccionar(lectura)}
        />
      ))}
    </svg>
  )
}

// ─── Tooltip de lectura seleccionada ─────────────────────────────────────────
function TooltipLectura({ lectura, unidad, onCerrar }) {
  if (!lectura) return null
  return (
    <div
      role="dialog"
      aria-label="Detalle de lectura"
      className="mt-2 rounded-lg border border-slate-200 bg-white p-3 text-sm shadow"
    >
      <div className="flex items-center justify-between mb-1">
        <strong>Período seleccionado</strong>
        <button
          type="button"
          onClick={onCerrar}
          aria-label="Cerrar detalle"
          className="text-slate-400 hover:text-slate-700 text-lg leading-none"
        >
          ×
        </button>
      </div>
      <p>📅 {lectura.fecha_inicio} — {lectura.fecha_fin}</p>
      <p>⚡ Consumo total: <strong>{lectura.consumo} {unidad}</strong></p>
      <p>📊 Consumo por día: <strong>{lectura.consumo_por_dia} {unidad}/día</strong></p>
      {lectura.tiene_alerta && (
        <p className="mt-1 text-red-600 font-medium">⚠ Esta lectura tiene una alerta activa</p>
      )}
    </div>
  )
}

// ─── Panel de un servicio ─────────────────────────────────────────────────────
function PanelServicio({ servicio, datos, onAbrirCarga }) {
  const [seleccionada, setSeleccionada] = useState(null)
  const unidad = UNIDADES[servicio]
  const color = COLORES[servicio]
  const { detector_activo, lecturas, estadisticas } = datos

  if (lecturas.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="font-semibold text-slate-800 mb-1">
          {servicio} <span className="text-xs text-slate-400">({unidad})</span>
        </h3>
        <p className="text-sm text-slate-500">Sin lecturas registradas.</p>
        {servicio !== 'AGUA' && (
          <button
            type="button"
            onClick={onAbrirCarga}
            className="mt-2 text-xs text-teal-600 underline hover:text-teal-800"
          >
            + Cargar la primera lectura
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-800">
          {servicio} <span className="text-xs text-slate-400">({unidad})</span>
        </h3>
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            detector_activo
              ? 'bg-green-100 text-green-700'
              : 'bg-slate-100 text-slate-500'
          }`}
        >
          {detector_activo ? '🟢 Detector activo' : '⚪ Detector inactivo'}
        </span>
      </div>

      {/* Gráfico */}
      <GraficoLinea
        lecturas={lecturas}
        color={color}
        onSeleccionar={setSeleccionada}
        seleccionada={seleccionada}
      />

      {/* Tooltip de lectura seleccionada */}
      <TooltipLectura
        lectura={seleccionada}
        unidad={unidad}
        onCerrar={() => setSeleccionada(null)}
      />

      {/* Estadísticas */}
      {estadisticas && (
        <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
          <span>Promedio/día: <strong>{estadisticas.promedio} {unidad}</strong></span>
          <span>Tendencia: <strong>{estadisticas.tendencia}</strong></span>
          <span>Mínimo/día: <strong>{estadisticas.minimo} {unidad}</strong></span>
          <span>Máximo/día: <strong>{estadisticas.maximo} {unidad}</strong></span>
        </div>
      )}

      {/* Tabla de lecturas */}
      <details className="text-xs">
        <summary className="cursor-pointer text-slate-500 hover:text-slate-700">
          Ver {lecturas.length} lectura{lecturas.length !== 1 ? 's' : ''}
        </summary>
        <table className="mt-2 w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-100 text-slate-500">
              <th className="py-1 pr-2">Período</th>
              <th className="py-1 pr-2">Consumo</th>
              <th className="py-1">Por día</th>
            </tr>
          </thead>
          <tbody>
            {lecturas.map((l) => (
              <tr
                key={l.id}
                className={`border-b border-slate-50 ${l.tiene_alerta ? 'bg-red-50' : ''}`}
              >
                <td className="py-1 pr-2">{l.fecha_inicio} — {l.fecha_fin}</td>
                <td className="py-1 pr-2">{l.consumo} {unidad}</td>
                <td className="py-1">
                  {l.consumo_por_dia} {unidad}
                  {l.tiene_alerta && <span className="ml-1 text-red-500">⚠</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function HistorialConsumos({ inmuebleId, onAbrirCarga, onCerrar }) {
  const [estado, setEstado] = useState('cargando') // 'cargando' | 'ok' | 'error'
  const [historial, setHistorial] = useState(null)
  const [mensajeError, setMensajeError] = useState('')

  useEffect(() => {
    let activo = true
    setEstado('cargando')
    obtenerHistorial(inmuebleId)
      .then((data) => {
        if (activo) {
          setHistorial(data)
          setEstado('ok')
        }
      })
      .catch((err) => {
        if (activo) {
          setMensajeError(err.message || 'Error al cargar el historial.')
          setEstado('error')
        }
      })
    return () => { activo = false }
  }, [inmuebleId])

  return (
    <section aria-label="Historial de consumos" className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">
          Historial de consumos
        </h2>
        {onCerrar && (
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar historial"
            className="text-sm text-slate-500 hover:text-slate-800 underline"
          >
            Cerrar
          </button>
        )}
      </div>

      {estado === 'cargando' && (
        <p role="status" className="text-sm text-slate-500">Cargando historial…</p>
      )}

      {estado === 'error' && (
        <p role="alert" className="text-sm text-red-600">{mensajeError}</p>
      )}

      {estado === 'ok' && historial && (
        <div className="grid gap-4 md:grid-cols-3">
          {SERVICIOS.map((srv) => (
            <PanelServicio
              key={srv}
              servicio={srv}
              datos={historial[srv]}
              onAbrirCarga={onAbrirCarga}
            />
          ))}
        </div>
      )}
    </section>
  )
}
