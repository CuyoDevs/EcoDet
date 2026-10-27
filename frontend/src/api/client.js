import { tokenStorage } from '../auth/tokenStorage'

// En desarrollo se deja vacío: Vite reenvía /api al backend (vite.config.js).
// Para apuntar a otro servidor: VITE_API_URL=http://host:puerto en frontend/.env
export const API_BASE = import.meta.env?.VITE_API_URL ?? ''

const MENSAJE_SIN_CONEXION = 'No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.'

function mensajeDe(data, status) {
  const detalle = data?.detail
  if (typeof detalle === 'string') return detalle
  if (Array.isArray(detalle) && detalle[0]?.msg) return detalle[0].msg
  return `Ocurrió un error inesperado (${status}). Inténtalo de nuevo.`
}

export class ApiError extends Error {
  constructor(status, data) {
    super(status === 0 ? MENSAJE_SIN_CONEXION : mensajeDe(data, status))
    this.name = 'ApiError'
    this.status = status // 0 = sin conexión
    this.data = data
    this.errores = data?.errores ?? {} // { campo: mensaje } en los 422
  }
}

// El contexto de sesión registra acá qué hacer si la API responde 401 con un token vencido o inválido.
let alNoAutorizado = null
export function setUnauthorizedHandler(fn) {
  alNoAutorizado = fn
}

export async function apiFetch(path, { method = 'GET', body, headers } = {}) {
  const token = tokenStorage.leerToken()
  let respuesta
  try {
    respuesta = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers
      },
      body: body !== undefined ? JSON.stringify(body) : undefined
    })
  } catch {
    throw new ApiError(0, null)
  }

  const data = await respuesta.json().catch(() => null)
  if (!respuesta.ok) {
    // Solo si ENVIAMOS un token: un 401 en el login (credenciales mal) no debe cerrar nada.
    if (respuesta.status === 401 && token && alNoAutorizado) alNoAutorizado()
    throw new ApiError(respuesta.status, data)
  }
  return data
}
