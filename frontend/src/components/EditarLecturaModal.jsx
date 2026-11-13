import React, { useEffect, useState } from 'react'
import { AlertCircle } from 'lucide-react'
import CampoFormulario from './CampoFormulario'

const UNIDADES = { LUZ: 'kWh', GAS: 'm³', AGUA: 'm³' }
const SERVICIOS = [
  { valor: 'LUZ', etiqueta: 'Luz' },
  { valor: 'GAS', etiqueta: 'Gas' },
  { valor: 'AGUA', etiqueta: 'Agua' }
]

// Modal para editar una lectura (HU-11 / DET-75, CU-09). Mismos campos y validaciones que la carga (HU-08).
// Es solo presentación: el historial hace la llamada a la API y le pasa errores / estado de envío.
// La unidad se muestra fija según el servicio y el inmueble no se puede cambiar (RN-02).
export default function EditarLecturaModal({ lectura, errores = {}, enviando = false, onGuardar, onCancelar }) {
  const [datos, setDatos] = useState({
    servicio: lectura.servicio,
    fecha_inicio: lectura.fecha_inicio,
    fecha_fin: lectura.fecha_fin,
    consumo: String(lectura.consumo)
  })

  // Esc cierra el modal, salvo mientras la petición está en curso.
  useEffect(() => {
    const alTeclear = (e) => e.key === 'Escape' && !enviando && onCancelar()
    document.addEventListener('keydown', alTeclear)
    return () => document.removeEventListener('keydown', alTeclear)
  }, [onCancelar, enviando])

  const cambiar = (e) => {
    const { name, value } = e.target
    setDatos((prev) => ({ ...prev, [name]: value }))
  }

  const enviar = (e) => {
    e.preventDefault()
    if (enviando) return
    onGuardar({
      servicio: datos.servicio,
      fecha_inicio: datos.fecha_inicio,
      fecha_fin: datos.fecha_fin,
      consumo: datos.consumo === '' ? null : Number(datos.consumo)
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <form
        onSubmit={enviar}
        noValidate
        role="dialog"
        aria-modal="true"
        aria-labelledby="editar-lectura-titulo"
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
      >
        <h2 id="editar-lectura-titulo" className="mb-4 text-lg font-semibold text-slate-900">
          Editar lectura
        </h2>

        {errores.general && (
          <p role="alert" className="mb-4 flex items-start gap-1 text-sm text-red-600">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{errores.general}</span>
          </p>
        )}

        <div className="grid gap-4">
          <div>
            <label htmlFor="editar-lectura-servicio" className="block text-sm font-medium text-slate-900">
              Servicio *
            </label>
            <select
              id="editar-lectura-servicio"
              name="servicio"
              value={datos.servicio}
              onChange={cambiar}
              aria-invalid={errores.servicio ? 'true' : undefined}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
            >
              {SERVICIOS.map((s) => (
                <option key={s.valor} value={s.valor}>{s.etiqueta} ({UNIDADES[s.valor]})</option>
              ))}
            </select>
            {errores.servicio && (
              <p role="alert" className="mt-1 text-sm text-red-600">{errores.servicio}</p>
            )}
          </div>

          <CampoFormulario
            id="editar-lectura-inicio"
            name="fecha_inicio"
            type="date"
            etiqueta="Fecha de inicio *"
            value={datos.fecha_inicio}
            onChange={cambiar}
            error={errores.fecha_inicio}
          />
          <CampoFormulario
            id="editar-lectura-fin"
            name="fecha_fin"
            type="date"
            etiqueta="Fecha de fin *"
            value={datos.fecha_fin}
            onChange={cambiar}
            error={errores.fecha_fin}
          />
          <CampoFormulario
            id="editar-lectura-consumo"
            name="consumo"
            type="number"
            step="any"
            min="0"
            etiqueta={`Consumo (${UNIDADES[datos.servicio]}) *`}
            value={datos.consumo}
            onChange={cambiar}
            error={errores.consumo}
          />
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancelar}
            disabled={enviando}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-60"
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
