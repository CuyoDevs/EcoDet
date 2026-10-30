import React, { useRef, useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { ApiError } from '../api/client'
import { iniciarSesion } from '../api/auth'
import { useAuth } from '../auth/AuthContext'
import { validarLogin } from '../utils/validaciones'
import CampoFormulario from './CampoFormulario'

const ORDEN_CAMPOS = ['correo', 'contrasena']

// Mensaje único para cualquier credencial incorrecta: no revela si falló el correo o la contraseña
// (HU-03, criterio 2). Se fija acá para que la pantalla no dependa del texto que mande el servidor.
export const MENSAJE_CREDENCIALES_INCORRECTAS = 'Correo o contraseña incorrectos.'

// Pestaña "Iniciar sesión" de la vista W1 (CU-02 · HU-03).
// Al iniciar sesión, la redirección al panel la hace routes/Rutas.jsx (DET-40), no este formulario.
export default function LoginForm() {
  const { login } = useAuth()
  const [valores, setValores] = useState({ correo: '', contrasena: '' })
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const formRef = useRef(null)

  const cambiar = (campo) => (e) => {
    setValores((v) => ({ ...v, [campo]: e.target.value }))
    // Al corregir un campo se limpia su error.
    if (errores[campo]) setErrores((prev) => ({ ...prev, [campo]: undefined }))
  }

  const enfocarPrimerError = (errs) => {
    const primero = ORDEN_CAMPOS.find((c) => errs[c])
    if (primero) formRef.current?.querySelector(`#login-${primero}`)?.focus()
  }

  const enviar = async (e) => {
    e.preventDefault()
    setErrorGeneral(null)

    // Criterio 3: con campos vacíos no se envía nada y cada error aparece debajo de su campo.
    const errs = validarLogin(valores)
    setErrores(errs)
    if (Object.keys(errs).length > 0) {
      enfocarPrimerError(errs)
      return
    }

    setEnviando(true)
    try {
      const datos = await iniciarSesion({ correo: valores.correo.trim(), contrasena: valores.contrasena })
      login(datos.access_token, datos.usuario) // guarda el token y abre la sesión
    } catch (err) {
      if (!(err instanceof ApiError)) {
        setErrorGeneral('Ocurrió un error inesperado. Inténtalo de nuevo.')
      } else if (err.status === 401) {
        setErrorGeneral(MENSAJE_CREDENCIALES_INCORRECTAS)
      } else if (err.status === 422 && Object.keys(err.errores).length > 0) {
        setErrores(err.errores)
        enfocarPrimerError(err.errores)
      } else {
        setErrorGeneral(err.message) // sin conexión, error del servidor, etc.
      }
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form ref={formRef} onSubmit={enviar} noValidate className="space-y-4" aria-label="Iniciar sesión">
      <CampoFormulario
        id="login-correo"
        etiqueta="Correo"
        type="email"
        autoComplete="email"
        value={valores.correo}
        onChange={cambiar('correo')}
        error={errores.correo}
        disabled={enviando}
      />
      <CampoFormulario
        id="login-contrasena"
        etiqueta="Contraseña"
        type="password"
        autoComplete="current-password"
        value={valores.contrasena}
        onChange={cambiar('contrasena')}
        error={errores.contrasena}
        disabled={enviando}
      />

      {errorGeneral && (
        <p role="alert" className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{errorGeneral}</span>
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="w-full rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {enviando ? 'Entrando…' : 'Entrar'}
      </button>
    </form>
  )
}
