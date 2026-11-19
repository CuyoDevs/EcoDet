import React, { useEffect } from 'react'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

export const ADVERTENCIA_MARCAR_NORMAL =
  'Esta lectura dejará de usarse para calcular lo habitual en las próximas detecciones. Las alertas que ya recibiste no cambian.'

// Modal de confirmación para marcar una alerta como "normal" (HU-16 / DET-102, CU-07). Solo presentación:
// el panel de alertas hace la llamada a la API. Nada cambia hasta pulsar "Sí, marcar como normal" (RN-17).
export default function MarcarAlertaNormalModal({ alerta, servicio, error = '', enviando = false, onConfirmar, onCancelar }) {
  useEffect(() => {
    const alTeclear = (e) => e.key === 'Escape' && !enviando && onCancelar()
    document.addEventListener('keydown', alTeclear)
    return () => document.removeEventListener('keydown', alTeclear)
  }, [onCancelar, enviando])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="marcar-normal-titulo"
        aria-describedby="marcar-normal-descripcion"
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
      >
        <h2 id="marcar-normal-titulo" className="mb-3 flex items-center gap-2 text-lg font-semibold text-slate-900">
          <CheckCircle2 className="h-5 w-5 text-teal-600" aria-hidden="true" />
          Marcar como normal
        </h2>

        <p id="marcar-normal-descripcion" className="text-sm text-slate-600">
          Vas a marcar como normal la alerta de <strong className="text-slate-900">{servicio}</strong> del{' '}
          <strong className="text-slate-900">{alerta.fecha_inicio} al {alerta.fecha_fin}</strong>.{' '}
          {ADVERTENCIA_MARCAR_NORMAL}
        </p>

        {error && (
          <p role="alert" className="mt-4 flex items-start gap-1 text-sm text-red-600">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancelar}
            disabled={enviando}
            autoFocus
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600 disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            disabled={enviando}
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2 disabled:opacity-60"
          >
            {enviando ? 'Guardando…' : 'Sí, marcar como normal'}
          </button>
        </div>
      </div>
    </div>
  )
}
