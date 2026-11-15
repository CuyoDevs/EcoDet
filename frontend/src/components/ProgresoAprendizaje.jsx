import React from 'react'
import { MENSAJE_APRENDIENDO, textoLecturasFaltantes } from '../utils/aprendizaje'

// Indicador de progreso del aprendizaje de un servicio (W4 · HU-14): "3 de 6 lecturas".
// `registradas` son las lecturas que ya tiene y `faltantes` las que le faltan al detector para activarse
// (las informa el backend: el mínimo sale de config.json). Sin faltantes no se muestra: el detector ya está activo.
export default function ProgresoAprendizaje({ registradas, faltantes }) {
  if (!(faltantes > 0)) return null

  const total = registradas + faltantes
  const porcentaje = Math.round((registradas / total) * 100)
  const texto = `${registradas} de ${total} lecturas`

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-slate-600">
        <span className="font-medium">{MENSAJE_APRENDIENDO}</span>
        <span>{texto}</span>
      </div>
      <div
        role="progressbar"
        aria-label="Progreso del aprendizaje"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={registradas}
        aria-valuetext={texto}
        className="h-2 w-full overflow-hidden rounded-full bg-slate-200"
      >
        <div className="h-full rounded-full bg-teal-600" style={{ width: `${porcentaje}%` }} />
      </div>
      <p className="text-xs text-slate-500">{textoLecturasFaltantes(faltantes)} para activar las alertas.</p>
    </div>
  )
}
