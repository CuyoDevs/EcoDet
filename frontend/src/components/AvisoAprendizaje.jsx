import React from 'react'
import { Info } from 'lucide-react'
import { MENSAJE_APRENDIENDO, NOMBRES_SERVICIO, textoLecturasFaltantes } from '../utils/aprendizaje'

// Aviso de la carga de lecturas (W3, HU-14): se ve cuando el detector todavía no puede evaluar el servicio.
// `evaluacion` es el campo `evaluacion` que devuelve POST /api/consumos. Con cualquier otro estado no muestra nada,
// así el aviso desaparece solo cuando el servicio llega al mínimo de lecturas.
export default function AvisoAprendizaje({ servicio, evaluacion }) {
  if (evaluacion?.estado !== 'aprendiendo') return null

  const faltantes = evaluacion.lecturas_faltantes ?? 0
  const nombre = NOMBRES_SERVICIO[servicio] ?? 'este servicio'

  return (
    <div
      role="status"
      className="p-3 mb-4 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-sm flex items-start gap-2"
    >
      <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" aria-hidden="true" />
      <p>
        <span className="font-semibold">{MENSAJE_APRENDIENDO}</span>{' '}
        {faltantes > 0 && <>{textoLecturasFaltantes(faltantes)} de {nombre} para que empecemos a avisarte si tu consumo se aleja de lo habitual. </>}
        Mientras tanto no se generan alertas.
      </p>
    </div>
  )
}
