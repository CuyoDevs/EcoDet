import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import App from './App'
import { registrar, obtenerUsuarioActual } from './api/auth'

vi.mock('./api/auth', () => ({ registrar: vi.fn(), iniciarSesion: vi.fn(), obtenerUsuarioActual: vi.fn() }))

describe('Flujo completo de HU-02', () => {
  it('registrarse inicia sesión y muestra el panel vacío; cerrar sesión vuelve al acceso', async () => {
    registrar.mockResolvedValue({
      access_token: 'tok',
      token_type: 'bearer',
      usuario: { id: 1, nombre: 'Laura Pérez', correo: 'laura@correo.com' }
    })
    const user = userEvent.setup()
    render(<App />)

    // W1 abre en "Iniciar sesión"; se pasa a la pestaña "Registrarse"
    await user.click(await screen.findByRole('tab', { name: 'Registrarse' }))
    expect(screen.getByRole('tab', { name: 'Registrarse' })).toHaveAttribute('aria-selected', 'true')

    await user.type(screen.getByLabelText('Nombre'), 'Laura Pérez')
    await user.type(screen.getByLabelText('Correo'), 'laura@correo.com')
    await user.type(screen.getByLabelText('Contraseña'), 'Clave1234')
    await user.click(screen.getByRole('button', { name: /crear cuenta/i }))

    // Panel vacío (W2) con invitación a crear el primer inmueble
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Mis inmuebles' })).toBeInTheDocument())
    expect(screen.getByText(/todavía no tienes ningún inmueble/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /nuevo inmueble/i })).toBeInTheDocument()

    // Al cerrar sesión se vuelve a la vista de acceso
    await user.click(screen.getByRole('button', { name: /cerrar sesión/i }))
    expect(screen.getByRole('tab', { name: 'Registrarse' })).toBeInTheDocument()
    expect(window.localStorage.getItem('ecodet.token')).toBeNull()
  })

  it('con la sesión guardada, recargar la página lleva directo al panel', async () => {
    window.localStorage.setItem('ecodet.token', 'tok')
    window.localStorage.setItem('ecodet.usuario', JSON.stringify({ id: 1, nombre: 'Laura' }))
    obtenerUsuarioActual.mockResolvedValue({ id: 1, nombre: 'Laura', correo: 'laura@correo.com' })
    render(<App />)
    expect(await screen.findByRole('heading', { name: 'Mis inmuebles' })).toBeInTheDocument()
  })

  it('abre en "Iniciar sesión" y permite pasar a "Registrarse"', async () => {
    const user = userEvent.setup()
    render(<App />)
    expect(await screen.findByRole('tab', { name: 'Iniciar sesión' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.queryByLabelText('Nombre')).not.toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'Registrarse' }))
    expect(screen.getByLabelText('Nombre')).toBeInTheDocument()
  })
})
