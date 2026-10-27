import React from 'react'
import { Home, Plus } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'

// Ruta provisoria hasta que HU-05 (crear inmueble) defina la pantalla de alta.
export const RUTA_NUEVO_INMUEBLE = '#/inmuebles/nuevo'

// Estado vacío del panel "Mis inmuebles" (W2): lo que ve quien todavía no tiene inmuebles (DET-34).
// Es independiente: el panel de DET-40 lo muestra cuando su lista de inmuebles está vacía.
export default function PanelVacio() {
  const { usuario } = useAuth()
  return (
    <section
      aria-labelledby="panel-vacio-titulo"
      className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm"
    >
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 text-teal-600">
        <Home className="h-6 w-6" aria-hidden="true" />
      </div>
      <h2 id="panel-vacio-titulo" className="text-xl font-semibold text-slate-900">
        {usuario?.nombre ? `¡Te damos la bienvenida, ${usuario.nombre}!` : '¡Te damos la bienvenida!'}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">
        Todavía no tienes ningún inmueble. Crea el primero para empezar a registrar tu consumo de luz, gas y agua.
      </p>
      <a
        href={RUTA_NUEVO_INMUEBLE}
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        Nuevo inmueble
      </a>
    </section>
  )
}
