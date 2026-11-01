"DET-55 Desarrollar formulario de lectura de consumo en la interfaz"
import React from 'react'
import { AlertCircle } from 'lucide-react'


export default function CampoFormulario({ id, etiqueta, ayuda, error, className = '', ...inputProps }) {
  const idAyuda = ayuda ? `${id}-ayuda` : null
  const idError = error ? `${id}-error` : null
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-900">
        {etiqueta}
      </label>
      <input
        id={id}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={[idAyuda, idError].filter(Boolean).join(' ') || undefined}
        className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-600 disabled:bg-slate-100 ${
          error ? 'border-red-600' : 'border-slate-300'
        } ${className}`}
        {...inputProps}
      />
      {ayuda && (
        <p id={idAyuda} className="mt-1 text-xs text-slate-500">
          {ayuda}
        </p>
      )}
      {error && (
        <p id={idError} role="alert" className="mt-1 flex items-start gap-1 text-sm text-red-600">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </div>
  )
}
