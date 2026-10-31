import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import LoginForm, { MENSAJE_CREDENCIALES_INCORRECTAS } from './LoginForm'
import { AuthProvider, useAuth } from '../auth/AuthContext'
import { ApiError } from '../api/client'
import { iniciarSesion } from '../api/auth'

vi.mock('../api/auth', () => ({ iniciarSesion: vi.fn() }))

const LAURA = { id: 1, nombre: 'Laura Pérez', correo: 'laura@correo.com' }
const sesionOk = { access_token: 'tok', token_type: 'bearer', usuario: LAURA }

function Sesion() {
  const { estaAutenticado, usuario } = useAuth()
  return <p>{estaAutenticado ? `sesión:${usuario?.nombre}` : 'sin sesión'}</p>
}

function montar() {
  const user = userEvent.setup()
  render(
    <AuthProvider>
      <LoginForm />
      <Sesion />
    </AuthProvider>
  )
  return user
}

async function completar(user, { correo = 'laura@correo.com', contrasena = 'Clave1234' } = {}) {
  if (correo) await user.type(screen.getByLabelText('Correo'), correo)
  if (contrasena) await user.type(screen.getByLabelText('Contraseña'), contrasena)
}

const entrar = () => screen.getByRole('button', { name: /entrar|entrando/i })

beforeEach(() => iniciarSesion.mockReset())

describe('LoginForm · campos vacíos (HU-03, criterio 3)', () => {
  it('con todo vacío muestra un error debajo de cada campo y no llama a la API', async () => {
    const user = montar()
    await user.click(entrar())

    expect(screen.getAllByRole('alert')).toHaveLength(2)
    expect(screen.getByText('Ingresa tu correo.')).toBeInTheDocument()
    expect(screen.getByText('Ingresa tu contraseña.')).toBeInTheDocument()
    expect(iniciarSesion).not.toHaveBeenCalled()
    expect(screen.getByText('sin sesión')).toBeInTheDocument()
  })

  it('el error queda asociado a su campo (aria-describedby) y se enfoca el primero', async () => {
    const user = montar()
    await user.click(entrar())

    const correo = screen.getByLabelText('Correo')
    expect(correo).toHaveAttribute('aria-invalid', 'true')
    expect(correo).toHaveAttribute('aria-describedby', 'login-correo-error')
    expect(screen.getByText('Ingresa tu correo.').closest('p')).toHaveAttribute('id', 'login-correo-error')
    expect(correo).toHaveFocus()
  })

  it('solo falta la contraseña: el error aparece únicamente en ese campo', async () => {
    const user = montar()
    await completar(user, { contrasena: '' })
    await user.click(entrar())

    expect(screen.getAllByRole('alert')).toHaveLength(1)
    expect(screen.getByText('Ingresa tu contraseña.')).toBeInTheDocument()
    expect(screen.getByLabelText('Contraseña')).toHaveFocus()
    expect(iniciarSesion).not.toHaveBeenCalled()
  })

  it('un correo de solo espacios cuenta como vacío', async () => {
    const user = montar()
    await completar(user, { correo: '   ' })
    await user.click(entrar())
    expect(screen.getByText('Ingresa tu correo.')).toBeInTheDocument()
    expect(iniciarSesion).not.toHaveBeenCalled()
  })

  it('al corregir un campo se limpia su error', async () => {
    const user = montar()
    await user.click(entrar())
    await user.type(screen.getByLabelText('Correo'), 'l')

    expect(screen.queryByText('Ingresa tu correo.')).not.toBeInTheDocument()
    expect(screen.getByText('Ingresa tu contraseña.')).toBeInTheDocument()
    expect(screen.getByLabelText('Correo')).not.toHaveAttribute('aria-invalid')
  })
})

describe('LoginForm · credenciales correctas (HU-03, criterio 1)', () => {
  it('envía correo y contraseña, guarda el token y abre la sesión', async () => {
    iniciarSesion.mockResolvedValue(sesionOk)
    const user = montar()
    await completar(user)
    await user.click(entrar())

    await waitFor(() => expect(screen.getByText('sesión:Laura Pérez')).toBeInTheDocument())
    expect(iniciarSesion).toHaveBeenCalledWith({ correo: 'laura@correo.com', contrasena: 'Clave1234' })
    expect(window.localStorage.getItem('ecodet.token')).toBe('tok')
    expect(JSON.parse(window.localStorage.getItem('ecodet.usuario'))).toEqual(LAURA)
  })

  it('recorta los espacios del correo pero nunca los de la contraseña', async () => {
    iniciarSesion.mockResolvedValue(sesionOk)
    const user = montar()
    await completar(user, { correo: '  laura@correo.com  ', contrasena: ' Clave1234 ' })
    await user.click(entrar())

    await waitFor(() => expect(iniciarSesion).toHaveBeenCalled())
    expect(iniciarSesion).toHaveBeenCalledWith({ correo: 'laura@correo.com', contrasena: ' Clave1234 ' })
  })

  it('mientras espera: botón y campos deshabilitados, y no se envía dos veces', async () => {
    let resolver
    iniciarSesion.mockReturnValue(new Promise((res) => (resolver = res)))
    const user = montar()
    await completar(user)
    await user.click(entrar())

    expect(entrar()).toBeDisabled()
    expect(entrar()).toHaveTextContent('Entrando…')
    expect(screen.getByLabelText('Correo')).toBeDisabled()
    expect(screen.getByLabelText('Contraseña')).toBeDisabled()
    await user.click(entrar())
    expect(iniciarSesion).toHaveBeenCalledTimes(1)

    resolver(sesionOk)
    await waitFor(() => expect(screen.getByText('sesión:Laura Pérez')).toBeInTheDocument())
    expect(entrar()).toBeEnabled()
  })

  it('no exige formato de correo ni reglas de contraseña: eso lo decide el servidor sin dar pistas', async () => {
    iniciarSesion.mockRejectedValue(new ApiError(401, { detail: 'x' }))
    const user = montar()
    await completar(user, { correo: 'sin-arroba', contrasena: 'abc' })
    await user.click(entrar())

    await waitFor(() => expect(iniciarSesion).toHaveBeenCalledWith({ correo: 'sin-arroba', contrasena: 'abc' }))
    expect(screen.getByRole('alert')).toHaveTextContent(MENSAJE_CREDENCIALES_INCORRECTAS)
  })
})

describe('LoginForm · credenciales incorrectas (HU-03, criterio 2)', () => {
  it('muestra el mensaje genérico, sin decir qué falló, y no abre sesión', async () => {
    iniciarSesion.mockRejectedValue(new ApiError(401, { detail: MENSAJE_CREDENCIALES_INCORRECTAS }))
    const user = montar()
    await completar(user, { contrasena: 'Equivocada1' })
    await user.click(entrar())

    const alerta = await screen.findByRole('alert')
    expect(alerta).toHaveTextContent('Correo o contraseña incorrectos.')
    expect(screen.getAllByRole('alert')).toHaveLength(1)
    expect(screen.getByLabelText('Correo')).not.toHaveAttribute('aria-invalid')
    expect(screen.getByLabelText('Contraseña')).not.toHaveAttribute('aria-invalid')
    expect(screen.getByText('sin sesión')).toBeInTheDocument()
    expect(window.localStorage.getItem('ecodet.token')).toBeNull()
  })

  it('el mensaje es siempre el mismo aunque el servidor mande otro texto', async () => {
    iniciarSesion.mockRejectedValue(new ApiError(401, { detail: 'El usuario no existe' }))
    const user = montar()
    await completar(user)
    await user.click(entrar())

    expect(await screen.findByRole('alert')).toHaveTextContent(MENSAJE_CREDENCIALES_INCORRECTAS)
    expect(screen.queryByText(/no existe/i)).not.toBeInTheDocument()
  })

  it('conserva lo escrito y deja volver a intentar; el aviso desaparece al reintentar', async () => {
    iniciarSesion.mockRejectedValueOnce(new ApiError(401, { detail: 'x' })).mockResolvedValueOnce(sesionOk)
    const user = montar()
    await completar(user)
    await user.click(entrar())
    await screen.findByRole('alert')

    expect(screen.getByLabelText('Correo')).toHaveValue('laura@correo.com')
    await user.click(entrar())
    await waitFor(() => expect(screen.getByText('sesión:Laura Pérez')).toBeInTheDocument())
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})

describe('LoginForm · otras respuestas del servidor', () => {
  it('un 422 del servidor se muestra debajo del campo que corresponde', async () => {
    iniciarSesion.mockRejectedValue(new ApiError(422, { errores: { contrasena: 'Ingresa tu contraseña.' } }))
    const user = montar()
    await completar(user)
    await user.click(entrar())

    const mensaje = await screen.findByText('Ingresa tu contraseña.')
    expect(mensaje.closest('p')).toHaveAttribute('id', 'login-contrasena-error')
    expect(screen.getByLabelText('Contraseña')).toHaveAttribute('aria-invalid', 'true')
  })

  it('sin conexión avisa con un mensaje claro y no abre sesión', async () => {
    iniciarSesion.mockRejectedValue(new ApiError(0, null))
    const user = montar()
    await completar(user)
    await user.click(entrar())

    expect(await screen.findByRole('alert')).toHaveTextContent(/no se pudo conectar con el servidor/i)
    expect(screen.getByText('sin sesión')).toBeInTheDocument()
  })

  it('una falla que no viene de la API (error de programa) muestra un aviso general y no abre sesión', async () => {
    iniciarSesion.mockRejectedValue(new Error('falla inesperada'))
    const user = montar()
    await completar(user)
    await user.click(entrar())

    const alerta = await screen.findByRole('alert')
    expect(alerta).toHaveTextContent('Ocurrió un error inesperado. Inténtalo de nuevo.')
    expect(alerta).not.toHaveTextContent(MENSAJE_CREDENCIALES_INCORRECTAS)
    expect(screen.getByText('sin sesión')).toBeInTheDocument()
    expect(entrar()).toBeEnabled()
  })

  it('un error 500 muestra un mensaje general (no el de credenciales)', async () => {
    iniciarSesion.mockRejectedValue(new ApiError(500, null))
    const user = montar()
    await completar(user)
    await user.click(entrar())

    const alerta = await screen.findByRole('alert')
    expect(alerta).toHaveTextContent(/error inesperado/i)
    expect(alerta).not.toHaveTextContent(MENSAJE_CREDENCIALES_INCORRECTAS)
  })
})

describe('LoginForm · accesibilidad', () => {
  it('cada input tiene etiqueta, y la contraseña no se muestra', () => {
    montar()
    expect(screen.getByLabelText('Correo')).toHaveAttribute('type', 'email')
    expect(screen.getByLabelText('Contraseña')).toHaveAttribute('type', 'password')
    expect(screen.getByRole('form', { name: 'Iniciar sesión' })).toBeInTheDocument()
  })
})
