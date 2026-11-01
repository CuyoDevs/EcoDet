"DET-55 Desarrollar formulario de lectura de consumo en la interfaz"
import { apiFetch } from './client';

export const crearLecturaConsumo = async (datosConsumo) => {
  return await apiFetch('/consumos', {
    method: 'POST',
    body: datosConsumo,
  });
};