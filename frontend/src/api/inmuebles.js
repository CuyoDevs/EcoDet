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
