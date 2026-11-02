// API de consumos (HU-08 / DET-16, HU-09 / DET-17 y HU-10 / DET-18)
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
