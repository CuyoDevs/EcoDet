import { apiFetch } from './client'

// GET /api/inmuebles/{inmuebleId}/alertas?estado=...&servicio=... -> [{ id, lectura_id, inmueble_id, servicio, fecha_inicio, fecha_fin, consumo, tipo, estado, desvio_porcentual, consumo_por_dia, consumo_habitual_por_dia, fecha_creacion }] (HU-15 / DET-96).
// 404 { errores: { general } } si el inmueble no existe o no pertenece al usuario (RN-01).
export function listarAlertasInmueble(inmuebleId, { estado = '', servicio = '' } = {}) {
  const params = new URLSearchParams()
  if (estado) params.set('estado', estado)
  if (servicio) params.set('servicio', servicio)
  const query = params.toString()
  return apiFetch(`/api/inmuebles/${inmuebleId}/alertas${query ? `?${query}` : ''}`)
}

// GET /api/alertas/{alertaId} -> detalle de una alerta del usuario autenticado (RN-01).
// 404 { errores: { general } } si no existe o pertenece a otro usuario.
export function obtenerDetalleAlerta(alertaId) {
  return apiFetch(`/api/alertas/${alertaId}`)
}