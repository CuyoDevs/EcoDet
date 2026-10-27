import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import RegistroForm from './RegistroForm'
import { AuthProvider, useAuth } from '../auth/AuthContext'
import { ApiError } from '../api/client'
import { registrar } from '../api/auth'

vi.mock('../api/auth', () => ({ registrar: vi.fn() }))

function Sesion() {
  const { estaAutenticado, usuario } = useAuth()
  return <p>{estaAutenticado ? `sesión:${usuario?.nombre}` : 'sin sesión'}</p>
}

function montar(props = {}) {
  const user = userEvent.setup()
  render(
    <AuthProvider>
      <RegistroForm {...props} />
      <Sesion />
    </AuthProvider>
  )
  return user
}

async function completar(user, { nombre = 'Laura Pérez', correo = 'laura@correo.com', contrasena = 'Clave1234' } = {}) {
  if (nombre) await user.type(screen.getByLabelText('Nombre'), nombre)
  if (correo) await user.type(screen.getByLabelText('Correo'), correo)
  if (contrasena) await user.type(screen.getByLabelText('Contraseña'), contrasena)
}

const crear = () => screen.getByRole('button', { name: /crear cuenta/i })

beforeEach(() => registrar.mockReset())

describe('RegistroForm · errores por campo', () => {
  it('con todo vacío muestra un error debajo de cada campo y no llama a la API', async () => {
    const user = montar()
    await user.click(crear())

    expect(screen.getAllByRole('alert')).toHaveLength(3)
    expect(screen.getByText('El nombre no puede estar vacío.')).toBeInTheDocument()
    expect(screen.getByText('Ingresa tu correo.')).toBeInTheDocument()
    expect(screen.getByText('Ingresa una contraseña.')).toBeInTheDocument()
    expect(registrar).not.toHaveBeenCalled()
  })

  it('marca los campos inválidos para lectores de pantalla y enfoca el primero', async () => {
    const user = montar()
    await user.click(crear())
    expect(screen.getByLabelText('Nombre')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Nombre')).toHaveFocus()
  })

  it('correo con formato inválido', async () => {
    const user = montar()
    await completar(user, { correo: 'sin-arroba' })
    await user.click(crear())
    expect(screen.getByText(/ingresa un correo válido/i)).toBeInTheDocument()
    expect(registrar).not.toHaveBeenCalled()
  })

  it.each([['corta1'], ['soloLetrasAqui'], ['123456789']])('contraseña débil (%s)', async (contrasena) => {
    const user = montar()
    await completar(user, { contrasena })
    await user.click(crear())
    expect(screen.getByText(/al menos 8 caracteres, con letras y números/i)).toBeInTheDocument()
    expect(registrar).not.toHaveBeenCalled()
  })

  it('muestra la leyenda de la contraseña (mín. 8, letras y números)', () => {
    montar()
    expect(screen.getByText('mín. 8, letras y números')).toBeInTheDocument()
  })

  it('el error de un campo desaparece al corregirlo', async () => {
    const user = montar()
    await user.click(crear())
    expect(screen.getByText('Ingresa tu correo.')).toBeInTheDocument()
    await user.type(screen.getByLabelText('Correo'), 'a')
    expect(screen.queryByText('Ingresa tu correo.')).not.toBeInTheDocument()
  })
})

describe('RegistroForm · envío correcto', () => {
  it('envía los datos limpios, guarda la sesión y queda autenticado', async () => {
    registrar.mockResolvedValue({
      access_token: 'token-123',
      token_type: 'bearer',
      usuario: { id: 1, nombre: 'Laura Pérez', correo: 'laura@correo.com' }
    })
    const user = montar()
    await completar(user, { nombre: '  Laura Pérez ', correo: ' laura@correo.com ' })
    await user.click(crear())

    await waitFor(() => expect(screen.getByText('sesión:Laura Pérez')).toBeInTheDocument())
    expect(registrar).toHaveBeenCalledWith({
      nombre: 'Laura Pérez',
      correo: 'laura@correo.com',
      contrasena: 'Clave1234'
    })
    expect(window.localStorage.getItem('ecodet.token')).toBe('token-123')
  })

  it('deshabilita el botón mientras espera la respuesta (evita doble envío)', async () => {
    registrar.mockReturnValue(new Promise(() => {}))
    const user = montar()
    await completar(user)
    await user.click(crear().closest('form').querySelector('button[type=submit]'))
    expect(screen.getByRole('button', { name: /creando cuenta/i })).toBeDisabled()
    expect(registrar).toHaveBeenCalledTimes(1)
  })
})

describe('RegistroForm · respuestas del servidor', () => {
  it('correo ya registrado: muestra el error, ofrece ir a "Iniciar sesión" y no inicia sesión', async () => {
    registrar.mockRejectedValue(new ApiError(409, { detail: 'Ya existe una cuenta con ese correo. Inicia sesión o usa otro correo.' }))
    const onIrALogin = vi.fn()
    const user = montar({ onIrALogin })
    await completar(user)
    await user.click(crear())

    expect(await screen.findByText(/ya existe una cuenta con ese correo/i)).toBeInTheDocument()
    expect(screen.getByText('sin sesión')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /ir a iniciar sesión/i }))
    expect(onIrALogin).toHaveBeenCalledTimes(1)
  })

  it('422 del servidor: cada mensaje va debajo de su campo', async () => {
    registrar.mockRejectedValue(new ApiError(422, { errores: { contrasena: 'Mensaje del servidor para la contraseña.' } }))
    const user = montar()
    await completar(user)
    await user.click(crear())
    expect(await screen.findByText('Mensaje del servidor para la contraseña.')).toBeInTheDocument()
    expect(screen.getByLabelText('Contraseña')).toHaveAttribute('aria-invalid', 'true')
  })

  it('sin conexión: muestra un mensaje general y permite reintentar', async () => {
    registrar.mockRejectedValue(new ApiError(0, null))
    const user = montar()
    await completar(user)
    await user.click(crear())
    expect(await screen.findByText(/no se pudo conectar con el servidor/i)).toBeInTheDocument()
    expect(crear()).toBeEnabled()
  })
})
