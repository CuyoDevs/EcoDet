import React, { useState, useEffect } from 'react'
import { LogOut, Plus } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import PanelVacio from '../components/PanelVacio'
import CampoFormulario from '../components/CampoFormulario'
import FormularioConsumo from '../components/FormularioConsumo'
import { apiFetch } from '../api/client'

export default function PanelInmuebles() {
  const { usuario, logout } = useAuth()
  const [inmuebles, setInmuebles] = useState([])
  const [mostrandoFormulario, setMostrandoFormulario] = useState(false)
  const [inmuebleSeleccionado, setInmuebleSeleccionado] = useState(null)
  const [errorLocal, setErrorLocal] = useState('')

  // Cargar inmuebles al iniciar
  useEffect(() => {
    const cargarInmuebles = async () => {
      try {
        const data = await apiFetch('/api/inmuebles/')
        setInmuebles(data)
      } catch (err) {
        console.error('Error al cargar inmuebles', err)
      }
    }
    cargarInmuebles()
  }, [])

  const manejarEnvio = async (e) => {
    e.preventDefault()
    setErrorLocal('')
    
    const formData = new FormData(e.target)
    const datos = {
      nombre: formData.get('nombre'),
      direccion: formData.get('direccion') || ""
    }

    try {
      const nuevoInmueble = await apiFetch('/api/inmuebles/', {
        method: 'POST',
        body: datos
      })
      setInmuebles([...inmuebles, nuevoInmueble])
      setMostrandoFormulario(false)
    } catch (err) {
      setErrorLocal(err.message)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Mis inmuebles</h1>
          <div className="flex items-center gap-4">
            {usuario?.nombre && <span className="text-sm text-slate-500">{usuario.nombre}</span>}
            
            <button
              onClick={() => {
                setMostrandoFormulario(!mostrandoFormulario)
                setInmuebleSeleccionado(null)
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-3 py-2 text-sm font-medium text-white hover:bg-teal-700 transition"
            >
              <Plus className="h-4 w-4" />
              Nuevo Inmueble
            </button>

            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50 transition"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10 space-y-10">
        {/* Formulario de Nuevo Inmueble */}
        {mostrandoFormulario && (
          <form onSubmit={manejarEnvio} className="mb-8 rounded-lg bg-white p-6 shadow-sm border border-slate-200">
            <h2 className="mb-4 text-lg font-semibold text-slate-800">Registrar nuevo inmueble</h2>
            {errorLocal && <p className="mb-4 text-sm text-red-600">{errorLocal}</p>}
            
            <div className="grid gap-4 md:grid-cols-2">
              <CampoFormulario 
                id="nombre"
                name="nombre" 
                label="Nombre del inmueble *" 
                required 
                placeholder="Ej. Casa centro" 
              />
              <CampoFormulario 
                id="direccion"
                name="direccion" 
                label="Dirección (Opcional)" 
                placeholder="Ej. San Martín 123" 
              />
            </div>
            
            <div className="mt-6 flex justify-end gap-3">
              <button 
                type="button" 
                onClick={() => setMostrandoFormulario(false)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
              >
                Guardar
              </button>
            </div>
          </form>
        )}

        {/* Listado de Inmuebles o Panel Vacío */}
        {inmuebles.length === 0 ? (
          <PanelVacio />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {inmuebles.map((inm, index) => (
              <div key={inm.id || index} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900 text-lg">{inm.nombre}</h3>
                  <p className="text-sm text-slate-500 mt-1">{inm.direccion || 'Sin dirección registrada'}</p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400">ID: {inm.id}</span>
                  <button
                    onClick={() => setInmuebleSeleccionado(inmuebleSeleccionado === inm.id ? null : inm.id)}
                    className="text-xs bg-teal-50 text-teal-700 border border-teal-200 px-3 py-1.5 rounded-md hover:bg-teal-100 font-medium transition"
                  >
                    {inmuebleSeleccionado === inm.id ? 'Ocultar Consumo' : '+ Cargar Consumo'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Sección del Formulario de Consumos vinculada a la tarjeta seleccionada */}
        {inmuebleSeleccionado && (
          <div className="border-t border-slate-200 pt-8 mt-6">
            <div className="bg-teal-50 border border-teal-200 p-4 rounded-lg mb-4 flex justify-between items-center">
              <span className="text-sm font-medium text-teal-900">
                Registrando consumo para el inmueble seleccionado (ID: {inmuebleSeleccionado})
              </span>
              <button 
                onClick={() => setInmuebleSeleccionado(null)}
                className="text-xs text-teal-700 hover:text-teal-900 font-semibold"
              >
                Cerrar formulario
              </button>
            </div>
            <FormularioConsumo inmueblePreseleccionado={inmuebleSeleccionado} />
          </div>
        )}
      </main>
    </div>
  )
}