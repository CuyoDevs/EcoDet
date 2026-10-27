import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { setUnauthorizedHandler } from '../api/client'
import { tokenStorage } from './tokenStorage'

const AuthContext = createContext(null)

function sesionGuardada() {
  const token = tokenStorage.leerToken()
  return token ? { token, usuario: tokenStorage.leerUsuario() } : { token: null, usuario: null }
}

export function AuthProvider({ children }) {
  const [sesion, setSesion] = useState(sesionGuardada)

  // login(token, usuario?): los endpoints de registro y login devuelven { access_token, usuario }.
  const login = useCallback((token, usuario = null) => {
    tokenStorage.guardar(token, usuario)
    setSesion({ token, usuario })
  }, [])

  // El JWT no vive en el servidor: cerrar sesión es borrar el token acá (no hay endpoint de logout).
  const logout = useCallback(() => {
    tokenStorage.borrar()
    setSesion({ token: null, usuario: null })
  }, [])

  // Si la API responde 401 con un token enviado (vencido o inválido), se cierra la sesión sola.
  useEffect(() => {
    setUnauthorizedHandler(logout)
    return () => setUnauthorizedHandler(null)
  }, [logout])

  const valor = useMemo(
    () => ({ ...sesion, estaAutenticado: Boolean(sesion.token), login, logout }),
    [sesion, login, logout]
  )
  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
