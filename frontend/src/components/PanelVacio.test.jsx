import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import PanelVacio from './PanelVacio'
import { AuthProvider } from '../auth/AuthContext'

// Panel vacío de W2 (DET-34): da la bienvenida y su botón abre el formulario de alta en línea.
describe('PanelVacio', () => {
  it('invita a crear el primer inmueble y saluda por el nombre', () => {
    window.localStorage.setItem('ecodet.token', 't')
    window.localStorage.setItem('ecodet.usuario', JSON.stringify({ id: 1, nombre: 'Laura' }))
    render(<AuthProvider><PanelVacio onCrearNuevo={() => {}} /></AuthProvider>)

    expect(screen.getByRole('heading', { name: /laura/i })).toBeInTheDocument()
    expect(screen.getByText(/todavía no tienes ningún inmueble/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /nuevo inmueble/i })).toBeInTheDocument()
  })

  it('el botón "Nuevo inmueble" avisa para abrir el formulario de alta (bug: antes no hacía nada)', async () => {
    const onCrearNuevo = vi.fn()
    const user = userEvent.setup()
    render(<AuthProvider><PanelVacio onCrearNuevo={onCrearNuevo} /></AuthProvider>)

    await user.click(screen.getByRole('button', { name: /nuevo inmueble/i }))
    expect(onCrearNuevo).toHaveBeenCalledTimes(1)
  })

  it('funciona aunque no se conozca el nombre', () => {
    render(<AuthProvider><PanelVacio onCrearNuevo={() => {}} /></AuthProvider>)
    expect(screen.getByRole('heading', { name: /te damos la bienvenida/i })).toBeInTheDocument()
  })

  it('no muestra datos de ningún inmueble ni de otras cuentas (RN-01)', () => {
    render(<AuthProvider><PanelVacio onCrearNuevo={() => {}} /></AuthProvider>)
    expect(screen.queryByText(/luz|gas|agua/i, { selector: 'li, td' })).not.toBeInTheDocument()
  })
})
