import { apiFetch } from './client'

// GET /api/inmuebles/{inmuebleId}/umbrales -> [{ servicio, desvios, personalizado }] para LUZ, GAS y AGUA (HU-18 / DET-26).
// `desvios` es el umbral vigente (2 si el usuario no lo cambió) y `personalizado` indica si hay uno guardado.
// 404 { errores: { general } } si el inmueble no existe o no pertenece al usuario (RN-01).
export function obtenerUmbrales(inmuebleId) {
  return apiFetch(`/api/inmuebles/${inmuebleId}/umbrales`)
}

// PUT /api/inmuebles/{inmuebleId}/umbrales/{servicio} con { desvios } -> { servicio, desvios, personalizado: true }.
// 422 { errores: { desvios } } si no es un número mayor que cero; en ese caso se conserva el umbral anterior.
// 404 { errores: { general } } si el inmueble no existe o es de otro usuario (RN-01).
export function guardarUmbral(inmuebleId, servicio, desvios) {
  return apiFetch(`/api/inmuebles/${inmuebleId}/umbrales/${servicio}`, { method: 'PUT', body: { desvios } })
}
