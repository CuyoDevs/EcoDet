// API de consumos (HU-08 / DET-16)
import { apiFetch } from './client'

export const crearLecturaConsumo = async (datosConsumo) => {
  return await apiFetch('/api/consumos', {
    method: 'POST',
    body: datosConsumo
  })
}
