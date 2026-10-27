import React, { useRef, useState } from 'react'
import { ApiError } from '../api/client'
import { registrar } from '../api/auth'
import { useAuth } from '../auth/AuthContext'
import { AYUDA_CONTRASENA, validarRegistro } from '../utils/validaciones'
import CampoFormulario from './CampoFormulario'

const ORDEN_CAMPOS = ['nombre', 'correo', 'contrasena']

// Pestaña "Registrarse" de la vista W1 (CU-01 · HU-02).
// `onIrALogin`: lleva a la pestaña "Iniciar sesión" cuando el correo ya existe.
export default function RegistroForm({ onIrALogin }) {
  const { login } = useAuth()
  const [valores, setValores] = useState({ nombre: '', correo: '', contrasena: '' })
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState(null)
  const [correoRepetido, setCorreoRepetido] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const formRef = useRef(null)

  const cambiar = (campo) => (e) => {
    setValores((v) => ({ ...v, [campo]: e.target.value }))
    // Al corregir un campo se limpia su error.
    if (errores[campo]) setErrores((prev) => ({ ...prev, [campo]: undefined }))
    if (campo === 'correo') setCorreoRepetido(false)
  }

  const enfocarPrimerError = (errs) => {
    const primero = ORDEN_CAMPOS.find((c) => errs[c])
    if (primero) formRef.current?.querySelector(`#registro-${primero}`)?.focus()
  }

  const enviar = async (e) => {
    e.preventDefault()
    setErrorGeneral(null)
    setCorreoRepetido(false)

    const errs = validarRegistro(valores)
    setErrores(errs)
    if (Object.keys(errs).length > 0) {
      enfocarPrimerError(errs)
      return
    }

    setEnviando(true)
    try {
      const datos = await registrar({
        nombre: valores.nombre.trim(),
        correo: valores.correo.trim(),
        contrasena: valores.contrasena
      })
      login(datos.access_token, datos.usuario) // sesión iniciada automáticamente
    } catch (err) {
      if (!(err instanceof ApiError)) {
        setErrorGeneral('Ocurrió un error inesperado. Inténtalo de nuevo.')
      } else if (err.status === 409) {
        setErrores({ correo: err.message })
        setCorreoRepetido(true)
        enfocarPrimerError({ correo: true })
      } else if (err.status === 422 && Object.keys(err.errores).length > 0) {
        setErrores(err.errores)
        enfocarPrimerError(err.errores)
      } else {
        setErrorGeneral(err.message)
      }
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form ref={formRef} onSubmit={enviar} noValidate className="space-y-4" aria-label="Crear cuenta">
      <CampoFormulario
        id="registro-nombre"
        etiqueta="Nombre"
        type="text"
        autoComplete="name"
        value={valores.nombre}
        onChange={cambiar('nombre')}
        error={errores.nombre}
        disabled={enviando}
      />
      <CampoFormulario
        id="registro-correo"
        etiqueta="Correo"
        type="email"
        autoComplete="email"
        value={valores.correo}
        onChange={cambiar('correo')}
        error={errores.correo}
        disabled={enviando}
      />
      {correoRepetido && onIrALogin && (
        <button
          type="button"
          onClick={onIrALogin}
          className="-mt-2 text-sm font-medium text-teal-700 underline hover:text-teal-600"
        >
          Ir a Iniciar sesión
        </button>
      )}
      <CampoFormulario
        id="registro-contrasena"
        etiqueta="Contraseña"
        type="password"
        autoComplete="new-password"
        ayuda={AYUDA_CONTRASENA}
        value={valores.contrasena}
        onChange={cambiar('contrasena')}
        error={errores.contrasena}
        disabled={enviando}
      />

      {errorGeneral && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {errorGeneral}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="w-full rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {enviando ? 'Creando cuenta…' : 'Crear cuenta'}
      </button>
    </form>
  )
}
