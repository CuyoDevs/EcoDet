import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import App from './App'
import { registrar, iniciarSesion, obtenerUsuarioActual } from './api/auth'
import { ApiError } from './api/client'

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

const LAURA = { id: 1, nombre: 'Laura Pérez', correo: 'laura@correo.com' }
const CARLOS = { id: 2, nombre: 'Carlos Gómez', correo: 'carlos@correo.com' }

async function iniciar(user, { correo, contrasena }) {
  await user.type(await screen.findByLabelText('Correo'), correo)
  await user.type(screen.getByLabelText('Contraseña'), contrasena)
  await user.click(screen.getByRole('button', { name: 'Entrar' }))
}

describe('Flujo completo de HU-03 (Iniciar sesión)', () => {
  it('criterio 1 · credenciales correctas: lleva al panel, y la sesión sobrevive a recargar', async () => {
    iniciarSesion.mockResolvedValue({ access_token: 'tok', token_type: 'bearer', usuario: LAURA })
    obtenerUsuarioActual.mockResolvedValue(LAURA)
    const user = userEvent.setup()
    const primera = render(<App />)

    await iniciar(user, { correo: 'laura@correo.com', contrasena: 'Clave1234' })
    expect(await screen.findByRole('heading', { name: 'Mis inmuebles' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /laura pérez/i })).toBeInTheDocument()
    expect(window.location.hash).toBe('#/inmuebles')

    // Recargar la página = montar de nuevo la aplicación: el token guardado se confirma y se sigue en el panel.
    primera.unmount()
    render(<App />)
    expect(await screen.findByRole('heading', { name: 'Mis inmuebles' })).toBeInTheDocument()
    expect(obtenerUsuarioActual).toHaveBeenCalledTimes(1)
  })

  it('criterio 2 · credenciales incorrectas: mensaje genérico y no se entra al panel', async () => {
    iniciarSesion.mockRejectedValue(new ApiError(401, { detail: 'Correo o contraseña incorrectos.' }))
    const user = userEvent.setup()
    render(<App />)

    await iniciar(user, { correo: 'laura@correo.com', contrasena: 'Equivocada1' })
    expect(await screen.findByRole('alert')).toHaveTextContent('Correo o contraseña incorrectos.')
    expect(screen.queryByRole('heading', { name: 'Mis inmuebles' })).not.toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Iniciar sesión' })).toHaveAttribute('aria-selected', 'true')
    expect(window.localStorage.getItem('ecodet.token')).toBeNull()
  })

  it('criterio 3 · campos vacíos: errores debajo de cada campo y no se envía el formulario', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(await screen.findByRole('button', { name: 'Entrar' }))
    expect(screen.getByText('Ingresa tu correo.')).toBeInTheDocument()
    expect(screen.getByText('Ingresa tu contraseña.')).toBeInTheDocument()
    expect(iniciarSesion).not.toHaveBeenCalled()
    expect(screen.queryByRole('heading', { name: 'Mis inmuebles' })).not.toBeInTheDocument()
  })

  it('RN-01 · tras cerrar sesión, otra cuenta entra con su propia identidad y sin rastro de la anterior', async () => {
    iniciarSesion
      .mockResolvedValueOnce({ access_token: 't1', token_type: 'bearer', usuario: LAURA })
      .mockResolvedValueOnce({ access_token: 't2', token_type: 'bearer', usuario: CARLOS })
    const user = userEvent.setup()
    render(<App />)

    await iniciar(user, { correo: 'laura@correo.com', contrasena: 'Clave1234' })
    await screen.findByRole('heading', { name: /laura pérez/i })
    await user.click(screen.getByRole('button', { name: /cerrar sesión/i }))

    expect(await screen.findByLabelText('Correo')).toHaveValue('') // el formulario no recuerda a Laura
    await iniciar(user, { correo: 'carlos@correo.com', contrasena: 'Otra12345' })
    expect(await screen.findByRole('heading', { name: /carlos gómez/i })).toBeInTheDocument()
    expect(screen.queryByText(/laura/i)).not.toBeInTheDocument()
    expect(JSON.parse(window.localStorage.getItem('ecodet.usuario'))).toEqual(CARLOS)
  })
})
