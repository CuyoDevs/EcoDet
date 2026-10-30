import React from 'react'
import { LogOut } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import PanelVacio from '../components/PanelVacio'

// PROVISORIO. Es privado: routes/Rutas.jsx (DET-40) solo lo muestra con sesión. El listado real de
// inmuebles (W2) llega con HU-05 y el botón "Cerrar sesión" definitivo es de DET-43. Mientras tanto,
// quien entra o se registra ve el panel vacío (HU-02, criterio 1) y puede salir para probar de nuevo.
export default function PanelInmuebles() {
  const { usuario, logout } = useAuth()
  const inmuebles = [] // HU-05 los trae de la API; la cuenta nueva no tiene ninguno (RN-01).

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Mis inmuebles</h1>
          <div className="flex items-center gap-4">
            {usuario?.nombre && <span className="text-sm text-slate-500">{usuario.nombre}</span>}
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-600"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">{inmuebles.length === 0 ? <PanelVacio /> : null}</main>
    </div>
  )
}
