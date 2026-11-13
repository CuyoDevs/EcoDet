import React, { useEffect } from 'react'
import { AlertCircle, AlertTriangle } from 'lucide-react'

export const ADVERTENCIA_ELIMINAR_LECTURA = 'También se borrará su alerta, si la tiene. Esta acción no se puede deshacer.'

// Modal de confirmación para eliminar una lectura (HU-11 / DET-76, CU-09). Solo presentación:
// el historial hace la llamada a la API. Nada se borra hasta pulsar "Sí, eliminar".
export default function EliminarLecturaModal({ lectura, unidad, error = '', enviando = false, onConfirmar, onCancelar }) {
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
        aria-labelledby="eliminar-lectura-titulo"
        aria-describedby="eliminar-lectura-descripcion"
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
      >
        <h2 id="eliminar-lectura-titulo" className="mb-3 flex items-center gap-2 text-lg font-semibold text-slate-900">
          <AlertTriangle className="h-5 w-5 text-red-600" aria-hidden="true" />
          Eliminar lectura
        </h2>

        <p id="eliminar-lectura-descripcion" className="text-sm text-slate-600">
          Vas a eliminar la lectura del{' '}
          <strong className="text-slate-900">{lectura.fecha_inicio} al {lectura.fecha_fin}</strong>
          {' '}({lectura.consumo} {unidad}). {ADVERTENCIA_ELIMINAR_LECTURA}
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
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 disabled:opacity-60"
          >
            {enviando ? 'Eliminando…' : 'Sí, eliminar'}
          </button>
        </div>
      </div>
    </div>
  )
}
