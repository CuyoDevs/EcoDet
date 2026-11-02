// API de consumos (HU-08 / DET-16 y HU-09 / DET-17)
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
