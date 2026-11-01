import { apiFetch } from './client'

// GET /api/inmuebles/ -> [{ id, usuario_id, nombre, direccion }] solo del usuario autenticado (RN-01).
export function listarInmuebles() {
  return apiFetch('/api/inmuebles/')
}

// POST /api/inmuebles/ -> 201 con el inmueble creado.
// 409 { errores: { nombre } } si ya tiene uno con ese nombre; 422 { errores: { campo: mensaje } } si es inválido.
export function crearInmueble({ nombre, direccion }) {
  return apiFetch('/api/inmuebles/', { method: 'POST', body: { nombre, direccion } })
}

// PUT /api/inmuebles/{id} -> 200 con el inmueble actualizado (HU-06).
// 404 { errores: { general } } si no existe o no es del usuario; 409 { errores: { nombre } } si el nombre
// ya lo usa otro de sus inmuebles; 422 { errores: { campo: mensaje } } si es inválido.
export function actualizarInmueble(id, { nombre, direccion }) {
  return apiFetch(`/api/inmuebles/${id}`, { method: 'PUT', body: { nombre, direccion } })
}
