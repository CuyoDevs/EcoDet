import { apiFetch } from './client'

// POST /api/auth/register -> { access_token, token_type, usuario: { id, nombre, correo } }
export function registrar({ nombre, correo, contrasena }) {
  return apiFetch('/api/auth/register', { method: 'POST', body: { nombre, correo, contrasena } })
}

// POST /api/auth/login -> { access_token, token_type, usuario: { id, nombre, correo } }
// 401 con "Correo o contraseña incorrectos." ante cualquier credencial inválida; 422 si hay campos vacíos.
export function iniciarSesion({ correo, contrasena }) {
  return apiFetch('/api/auth/login', { method: 'POST', body: { correo, contrasena } })
}

// GET /api/auth/me -> { id, nombre, correo } del dueño del token. 401 si falta, es inválido o venció.
export function obtenerUsuarioActual() {
  return apiFetch('/api/auth/me')
}
