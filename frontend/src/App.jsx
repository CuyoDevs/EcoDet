import React from 'react'
import { AuthProvider } from './auth/AuthContext'
import Rutas from './routes/Rutas'

// La sesión (useAuth) y las rutas públicas y privadas con redirección (routes/Rutas.jsx, DET-40).
export default function App() {
  return (
    <AuthProvider>
      <Rutas />
    </AuthProvider>
  )
}
