import React, { useEffect } from 'react'
import { AlertCircle } from 'lucide-react'
import CampoFormulario from './CampoFormulario'

// Modal de edición de un inmueble (HU-06). Mismos campos y validaciones que el alta (HU-05).
// Es solo presentación: el panel hace la llamada a la API y le pasa errores / estado de envío.
export default function EditarInmuebleModal({ inmueble, errores = {}, enviando = false, onSubmit, onCancelar }) {
  // Esc cierra el modal.
  useEffect(() => {
    const alTeclear = (e) => e.key === 'Escape' && onCancelar()
    document.addEventListener('keydown', alTeclear)
    return () => document.removeEventListener('keydown', alTeclear)
  }, [onCancelar])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <form
        onSubmit={onSubmit}
        noValidate
        role="dialog"
        aria-modal="true"
        aria-labelledby="editar-inmueble-titulo"
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
      >
        <h2 id="editar-inmueble-titulo" className="mb-4 text-lg font-semibold text-slate-900">
          Editar inmueble
        </h2>

        {errores.general && (
          <p role="alert" className="mb-4 flex items-start gap-1 text-sm text-red-600">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{errores.general}</span>
          </p>
        )}

        <div className="grid gap-4">
          <CampoFormulario
            id="editar-nombre"
            name="nombre"
            etiqueta="Nombre del inmueble *"
            defaultValue={inmueble.nombre}
            maxLength={100}
            autoFocus
            error={errores.nombre}
          />
          <CampoFormulario
            id="editar-direccion"
            name="direccion"
            etiqueta="Dirección (opcional)"
            defaultValue={inmueble.direccion ?? ''}
            maxLength={255}
            error={errores.direccion}
          />
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancelar}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={enviando}
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60"
          >
            {enviando ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </div>
  )
}
