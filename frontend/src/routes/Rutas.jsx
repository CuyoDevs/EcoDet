import React, { useEffect } from 'react'
import { useAuth } from '../auth/AuthContext'
import { useSesionVerificada } from '../auth/useSesionVerificada'
import AccesoPage from '../pages/AccesoPage'
import PanelInmuebles from '../pages/PanelInmuebles'
import { irA, useRutaHash } from './hashRouter'

export const RUTA_ACCESO = '/acceso' // pública: vista W1 (login y registro)
export const RUTA_PANEL = '/inmuebles' // privada: panel W2 y todo lo que cuelgue de /inmuebles

export function esRutaPrivada(ruta) {
  return ruta === RUTA_PANEL || ruta.startsWith(`${RUTA_PANEL}/`)
}

// A dónde hay que mandar a la persona, o null si ya está donde corresponde:
//  - Sin sesión: cualquier ruta que no sea el acceso lleva al acceso (rutas privadas protegidas).
//  - Con sesión: el acceso (o una ruta desconocida) lleva al panel; ya no tiene sentido volver a loguearse.
export function destinoDeRedireccion(ruta, estaAutenticado) {
  if (estaAutenticado) return esRutaPrivada(ruta) ? null : RUTA_PANEL
  return ruta === RUTA_ACCESO ? null : RUTA_ACCESO
}

function Verificando() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <p role="status" className="text-sm text-slate-500">
        Verificando tu sesión…
      </p>
    </div>
  )
}

// Reemplaza la navegación mínima de HU-02: decide qué pantalla ver según la ruta y la sesión.
// Iniciar sesión, registrarse y cerrar sesión solo cambian el estado de useAuth(): la redirección sale de acá.
export default function Rutas() {
  const { estaAutenticado } = useAuth()
  const sesionVerificada = useSesionVerificada()
  const ruta = useRutaHash()
  const destino = destinoDeRedireccion(ruta, estaAutenticado)

  useEffect(() => {
    if (sesionVerificada && destino) irA(destino, { reemplazar: true })
  }, [sesionVerificada, destino])

  if (!sesionVerificada) return <Verificando />
  if (destino) return null // redirigiendo: no se muestra nada privado ni un parpadeo del formulario
  return estaAutenticado ? <PanelInmuebles /> : <AccesoPage />
}
