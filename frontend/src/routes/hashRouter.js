import { useEffect, useState } from 'react'

// Rutas con "#" (por ejemplo http://localhost:5173/#/inmuebles). Alcanza para las pantallas de EcoDet
// y evita sumar una librería de rutas (la guía pide avisar al equipo antes de agregar dependencias).

export function rutaActual() {
  const hash = window.location.hash.replace(/^#/, '')
  return hash.startsWith('/') ? hash : '/'
}

// `reemplazar: true` sustituye la entrada del historial: así el botón "atrás" no vuelve a la ruta
// desde la que se redirigió (por ejemplo, al formulario de acceso estando ya con sesión).
export function irA(ruta, { reemplazar = false } = {}) {
  if (reemplazar) window.location.replace(`#${ruta}`)
  else window.location.hash = ruta
}

export function useRutaHash() {
  const [ruta, setRuta] = useState(rutaActual)
  useEffect(() => {
    const alCambiar = () => setRuta(rutaActual())
    window.addEventListener('hashchange', alCambiar)
    return () => window.removeEventListener('hashchange', alCambiar)
  }, [])
  return ruta
}
