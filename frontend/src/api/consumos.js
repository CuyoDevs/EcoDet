export const crearLecturaConsumo = async (datosConsumo, token) => {
  const response = await fetch('/api/consumos', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(datosConsumo)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Error al registrar la lectura de consumo');
  }

  return await response.json();
};