import React, { useState } from 'react'
import { Activity } from 'lucide-react'
import RegistroForm from '../components/RegistroForm'

// Vista W1 (acceso): UNA sola vista con dos pestañas [Iniciar sesión] [Registrarse].
// DET-33 (este archivo) crea el contenedor y la pestaña de registro.
// DET-39 agrega el formulario de login: crear components/LoginForm.jsx y reemplazar
// <LoginPendiente /> por <LoginForm /> más abajo. Después, cambiar pestanaInicial a 'login'.
const PESTANAS = [
  { id: 'login', etiqueta: 'Iniciar sesión' },
  { id: 'registro', etiqueta: 'Registrarse' }
]

function LoginPendiente() {
  return (
    <p className="rounded-lg bg-slate-50 px-3 py-4 text-sm text-slate-500">
      El inicio de sesión se agrega en DET-39 (HU-03).
    </p>
  )
}

export default function AccesoPage({ pestanaInicial = 'registro' }) {
  const [pestana, setPestana] = useState(pestanaInicial)

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-10">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-lg bg-teal-600 p-2 text-white shadow-sm">
          <Activity className="h-6 w-6" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">EcoDet</h1>
          <p className="text-xs text-slate-500">Detector de anomalías en consumo del hogar</p>
        </div>
      </div>

      <main className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div role="tablist" aria-label="Acceso" className="mb-6 grid grid-cols-2 rounded-lg bg-slate-100 p-1">
          {PESTANAS.map(({ id, etiqueta }) => (
            <button
              key={id}
              type="button"
              role="tab"
              id={`tab-${id}`}
              aria-selected={pestana === id}
              aria-controls={`panel-${id}`}
              onClick={() => setPestana(id)}
              className={`rounded-md px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-600 ${
                pestana === id ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {etiqueta}
            </button>
          ))}
        </div>

        <div role="tabpanel" id={`panel-${pestana}`} aria-labelledby={`tab-${pestana}`}>
          {pestana === 'registro' ? <RegistroForm onIrALogin={() => setPestana('login')} /> : <LoginPendiente />}
        </div>
      </main>
    </div>
  )
}
