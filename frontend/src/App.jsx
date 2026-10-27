import React from 'react'
import { AuthProvider, useAuth } from './auth/AuthContext'
import AccesoPage from './pages/AccesoPage'
import PanelInmuebles from './pages/PanelInmuebles'

// Navegación mínima: con sesión se ve el panel, sin sesión la vista de acceso (W1).
// DET-40 la reemplaza por rutas públicas y privadas con redirección.
function Raiz() {
  const { estaAutenticado } = useAuth()
  return estaAutenticado ? <PanelInmuebles /> : <AccesoPage />
}

export default function App() {
  return (
    <AuthProvider>
      <Raiz />
    </AuthProvider>
  )
}
