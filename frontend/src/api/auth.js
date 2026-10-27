import { apiFetch } from './client'

// POST /api/auth/register -> { access_token, token_type, usuario: { id, nombre, correo } }
export function registrar({ nombre, correo, contrasena }) {
  return apiFetch('/api/auth/register', { method: 'POST', body: { nombre, correo, contrasena } })
}
