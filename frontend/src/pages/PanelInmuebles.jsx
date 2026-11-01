import React, { useCallback, useEffect, useState } from 'react'
import { LogOut, Pencil, Plus } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import PanelVacio from '../components/PanelVacio'
import CampoFormulario from '../components/CampoFormulario'
import EditarInmuebleModal from '../components/EditarInmuebleModal'
import { listarInmuebles, crearInmueble, actualizarInmueble } from '../api/inmuebles'

export const MENSAJE_NOMBRE_VACIO = 'Ingresa un nombre para el inmueble.'

// Panel "Mis inmuebles" (W2): lista los inmuebles del usuario, permite crear uno nuevo (HU-05) y editarlo (HU-06).
// El botón "Cerrar sesión" definitivo es de DET-43.
export default function PanelInmuebles() {
  const { usuario, logout } = useAuth()
  const [inmuebles, setInmuebles] = useState([])
  const [cargando, setCargando] = useState(true)
  const [errorGeneral, setErrorGeneral] = useState('')
  const [mostrandoFormulario, setMostrandoFormulario] = useState(false)
  const [errores, setErrores] = useState({}) // { campo: mensaje } debajo de cada campo
  const [enviando, setEnviando] = useState(false)
  const [editando, setEditando] = useState(null) // inmueble que se está editando (HU-06)
  const [erroresEdicion, setErroresEdicion] = useState({})
  const [guardandoEdicion, setGuardandoEdicion] = useState(false)

  // La lista viene de la API: sobrevive a recargar la página (HU-05, criterio 1).
  useEffect(() => {
    let activo = true
    listarInmuebles()
      .then((lista) => activo && setInmuebles(lista))
      .catch((err) => activo && setErrorGeneral(err.message))
      .finally(() => activo && setCargando(false))
    return () => {
      activo = false
    }
  }, [])

  const abrirOCerrarFormulario = () => {
    setErrores({})
    setErrorGeneral('')
    setMostrandoFormulario((abierto) => !abierto)
  }

  const abrirEdicion = (inmueble) => {
    setMostrandoFormulario(false)
    setErrores({})
    setErrorGeneral('')
    setErroresEdicion({})
    setEditando(inmueble)
  }

  const cerrarEdicion = useCallback(() => {
    setEditando(null)
    setErroresEdicion({})
  }, [])

  const manejarEdicion = async (e) => {
    e.preventDefault()
    setErroresEdicion({})

    const formData = new FormData(e.target)
    const nombre = (formData.get('nombre') ?? '').trim()
    const direccion = (formData.get('direccion') ?? '').trim()

    // Mismas validaciones que el alta: un nombre vacío no llega a la API.
    if (!nombre) {
      setErroresEdicion({ nombre: MENSAJE_NOMBRE_VACIO })
      return
    }

    setGuardandoEdicion(true)
    try {
      const actualizado = await actualizarInmueble(editando.id, { nombre, direccion })
      setInmuebles((actuales) => actuales.map((inm) => (inm.id === actualizado.id ? actualizado : inm)))
      setEditando(null)
    } catch (err) {
      // 409 / 422 / 404 traen { errores: { campo: mensaje } }; el resto (sin conexión, 500) va como aviso general.
      if (err.errores && Object.keys(err.errores).length > 0) setErroresEdicion(err.errores)
      else setErroresEdicion({ general: err.message })
    } finally {
      setGuardandoEdicion(false)
    }
  }

  const manejarEnvio = async (e) => {
    e.preventDefault()
    setErrores({})
    setErrorGeneral('')

    const formData = new FormData(e.target)
    const nombre = (formData.get('nombre') ?? '').trim()
    const direccion = (formData.get('direccion') ?? '').trim()

    // Validación local: un nombre vacío no llega a la API (HU-05, criterio 2).
    if (!nombre) {
      setErrores({ nombre: MENSAJE_NOMBRE_VACIO })
      return
    }

    setEnviando(true)
    try {
      const nuevo = await crearInmueble({ nombre, direccion })
      setInmuebles((actuales) => [...actuales, nuevo])
      setMostrandoFormulario(false)
    } catch (err) {
      // 409 y 422 traen { errores: { campo: mensaje } }: se muestran debajo del campo.
      if (err.errores && Object.keys(err.errores).length > 0) setErrores(err.errores)
      else setErrorGeneral(err.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Mis inmuebles</h1>
          <div className="flex items-center gap-4">
            {usuario?.nombre && <span className="text-sm text-slate-500">{usuario.nombre}</span>}

            <button
              type="button"
              onClick={abrirOCerrarFormulario}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-3 py-2 text-sm font-medium text-white hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Nuevo inmueble
            </button>

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

      <main className="mx-auto max-w-5xl px-6 py-10">
        {errorGeneral && (
          <p role="alert" className="mb-4 text-sm text-red-600">
            {errorGeneral}
          </p>
        )}

        {mostrandoFormulario && (
          <form
            onSubmit={manejarEnvio}
            noValidate
            aria-label="Registrar nuevo inmueble"
            className="mb-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h2 className="mb-4 text-lg font-semibold">Registrar nuevo inmueble</h2>

            <div className="grid gap-4 md:grid-cols-2">
              <CampoFormulario
                id="nombre"
                name="nombre"
                etiqueta="Nombre del inmueble *"
                placeholder="Ej. Casa centro"
                maxLength={100}
                error={errores.nombre}
              />
              <CampoFormulario
                id="direccion"
                name="direccion"
                etiqueta="Dirección (opcional)"
                placeholder="Ej. San Martín 123"
                maxLength={255}
                error={errores.direccion}
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={abrirOCerrarFormulario}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={enviando}
                className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60"
              >
                {enviando ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </form>
        )}

        {cargando ? (
          <p role="status" className="text-sm text-slate-500">
            Cargando tus inmuebles…
          </p>
        ) : inmuebles.length === 0 ? (
          !mostrandoFormulario && <PanelVacio />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {inmuebles.map((inm) => (
              <li key={inm.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-slate-900">{inm.nombre}</h3>
                    <p className="text-sm text-slate-500">{inm.direccion || 'Sin dirección registrada'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => abrirEdicion(inm)}
                    aria-label={`Editar ${inm.nombre}`}
                    className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>

      {editando && (
        <EditarInmuebleModal
          key={editando.id}
          inmueble={editando}
          errores={erroresEdicion}
          enviando={guardandoEdicion}
          onSubmit={manejarEdicion}
          onCancelar={cerrarEdicion}
        />
      )}
    </div>
  )
}
