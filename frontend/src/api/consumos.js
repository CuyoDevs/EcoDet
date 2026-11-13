// API de consumos (HU-08 / DET-16, HU-09 / DET-17, HU-10 / DET-18 y HU-11 / DET-73, DET-74)
import { apiFetch } from './client'

export const crearLecturaConsumo = async (datosConsumo) => {
  return await apiFetch('/api/consumos', {
    method: 'POST',
    body: datosConsumo
  })
}

export const crearLecturasLote = async (datosLote) => {
  return await apiFetch('/api/consumos/lote', {
    method: 'POST',
    body: datosLote
  })
}

export const obtenerHistorial = async (inmuebleId) => {
  return await apiFetch(`/api/consumos/${inmuebleId}/historial`)
}

// HU-11: edita una lectura (el inmueble no se puede cambiar). 422 = datos inválidos, 409 = período superpuesto.
export const actualizarLectura = async (lecturaId, datos) => {
  return await apiFetch(`/api/consumos/${lecturaId}`, {
    method: 'PUT',
    body: datos
  })
}

// HU-11: elimina una lectura junto con su alerta. Responde 204 sin cuerpo (apiFetch devuelve null).
export const eliminarLectura = async (lecturaId) => {
  return await apiFetch(`/api/consumos/${lecturaId}`, { method: 'DELETE' })
}
