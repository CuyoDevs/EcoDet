import { useEffect, useRef, useState } from 'react'
import { obtenerUsuarioActual } from '../api/auth'
import { useAuth } from './AuthContext'

// Al abrir o recargar la página con un token guardado, se confirma con GET /api/auth/me (DET-38) que
// sigue siendo válido antes de mostrar nada privado. Devuelve `true` cuando ya se puede decidir qué pantalla ver.
//  - Token válido: se refrescan los datos del usuario con los del servidor.
//  - Token vencido o inválido (401): apiFetch ya cierra la sesión sola y se vuelve al acceso.
//  - Sin conexión u otro error del servidor: se conserva la sesión; no se expulsa a nadie por una caída de red.
// Solo verifica el token que había al arrancar: uno recién emitido por el login o el registro ya es válido.
export function useSesionVerificada() {
  const { token, login } = useAuth()
  const tokenAlArrancar = useRef(token)
  const [verificada, setVerificada] = useState(() => !token)

  useEffect(() => {
    const guardado = tokenAlArrancar.current
    if (!guardado) return undefined
    let cancelado = false
    obtenerUsuarioActual()
      .then((usuario) => {
        if (!cancelado) login(guardado, usuario)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelado) setVerificada(true)
      })
    return () => {
      cancelado = true
    }
  }, [login])

  return verificada
}
