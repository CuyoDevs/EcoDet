import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import PanelVacio, { RUTA_NUEVO_INMUEBLE } from './PanelVacio'
import { AuthProvider } from '../auth/AuthContext'

describe('PanelVacio', () => {
  it('invita a crear el primer inmueble y saluda por el nombre', () => {
    window.localStorage.setItem('ecodet.token', 't')
    window.localStorage.setItem('ecodet.usuario', JSON.stringify({ id: 1, nombre: 'Laura' }))
    render(<AuthProvider><PanelVacio /></AuthProvider>)

    expect(screen.getByRole('heading', { name: /laura/i })).toBeInTheDocument()
    expect(screen.getByText(/todavía no tienes ningún inmueble/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /nuevo inmueble/i })).toHaveAttribute('href', RUTA_NUEVO_INMUEBLE)
  })

  it('funciona aunque no se conozca el nombre', () => {
    render(<AuthProvider><PanelVacio /></AuthProvider>)
    expect(screen.getByRole('heading', { name: /te damos la bienvenida/i })).toBeInTheDocument()
  })

  it('no muestra datos de ningún inmueble ni de otras cuentas (RN-01)', () => {
    render(<AuthProvider><PanelVacio /></AuthProvider>)
    expect(screen.queryByText(/luz|gas|agua/i, { selector: 'li, td' })).not.toBeInTheDocument()
  })
})
