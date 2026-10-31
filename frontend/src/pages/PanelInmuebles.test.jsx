import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import PanelInmuebles, { MENSAJE_NOMBRE_VACIO } from './PanelInmuebles'
import { AuthProvider } from '../auth/AuthContext'
import { ApiError } from '../api/client'
import { listarInmuebles, crearInmueble } from '../api/inmuebles'

vi.mock('../api/inmuebles', () => ({ listarInmuebles: vi.fn(), crearInmueble: vi.fn() }))

const CASA = { id: 1, usuario_id: 1, nombre: 'Casa Norte', direccion: 'Ruta 40' }

async function montar(inicial = []) {
  listarInmuebles.mockResolvedValue(inicial)
  const user = userEvent.setup()
  window.localStorage.setItem('ecodet.token', 't')
  window.localStorage.setItem('ecodet.usuario', JSON.stringify({ id: 1, nombre: 'Carlos' }))
  render(
    <AuthProvider>
      <PanelInmuebles />
    </AuthProvider>
  )
  await waitFor(() => expect(listarInmuebles).toHaveBeenCalled())
  return user
}

const abrirFormulario = (user) => user.click(screen.getByRole('button', { name: /nuevo inmueble/i }))
const guardar = (user) => user.click(screen.getByRole('button', { name: /guardar/i }))

beforeEach(() => {
  listarInmuebles.mockReset()
  crearInmueble.mockReset()
})

describe('PanelInmuebles · lista (HU-05, criterio 1)', () => {
  it('sin inmuebles muestra el panel vacío; con inmuebles, los de la API', async () => {
    await montar([])
    expect(await screen.findByText(/todavía no tienes ningún inmueble/i)).toBeInTheDocument()
  })

  it('carga la lista desde la API al abrir el panel (sobrevive a recargar)', async () => {
    await montar([CASA, { id: 2, usuario_id: 1, nombre: 'Casa de mamá', direccion: null }])
    expect(await screen.findByText('Casa Norte')).toBeInTheDocument()
    expect(screen.getByText('Casa de mamá')).toBeInTheDocument()
    expect(screen.getByText('Sin dirección registrada')).toBeInTheDocument()
  })
})

describe('PanelInmuebles · formulario vacío (HU-05, criterio 2)', () => {
  it('con el nombre vacío muestra el error debajo del campo y no llama a la API', async () => {
    const user = await montar([])
    await abrirFormulario(user)
    expect(screen.getByLabelText(/nombre del inmueble/i)).toBeInTheDocument() // la etiqueta se ve

    await guardar(user)

    expect(screen.getByText(MENSAJE_NOMBRE_VACIO)).toBeInTheDocument()
    expect(screen.getByLabelText(/nombre del inmueble/i)).toHaveAttribute('aria-invalid', 'true')
    expect(crearInmueble).not.toHaveBeenCalled()
  })

  it('un nombre de solo espacios cuenta como vacío', async () => {
    const user = await montar([])
    await abrirFormulario(user)
    await user.type(screen.getByLabelText(/nombre del inmueble/i), '   ')
    await guardar(user)
    expect(screen.getByText(MENSAJE_NOMBRE_VACIO)).toBeInTheDocument()
    expect(crearInmueble).not.toHaveBeenCalled()
  })
})

describe('PanelInmuebles · envío correcto (HU-05, criterios 1 y 3)', () => {
  it('crea el inmueble, cierra el formulario y lo agrega a la lista', async () => {
    const user = await montar([])
    crearInmueble.mockResolvedValue(CASA)
    await abrirFormulario(user)
    await user.type(screen.getByLabelText(/nombre del inmueble/i), 'Casa Norte')
    await user.type(screen.getByLabelText(/dirección/i), 'Ruta 40')
    await guardar(user)

    expect(crearInmueble).toHaveBeenCalledWith({ nombre: 'Casa Norte', direccion: 'Ruta 40' })
    expect(await screen.findByText('Casa Norte')).toBeInTheDocument()
    expect(screen.queryByRole('form')).not.toBeInTheDocument()
  })

  it('la dirección es opcional', async () => {
    const user = await montar([])
    crearInmueble.mockResolvedValue({ ...CASA, direccion: '' })
    await abrirFormulario(user)
    await user.type(screen.getByLabelText(/nombre del inmueble/i), 'Casa Norte')
    await guardar(user)
    expect(crearInmueble).toHaveBeenCalledWith({ nombre: 'Casa Norte', direccion: '' })
  })

  it('permite tener más de un inmueble', async () => {
    const user = await montar([CASA])
    crearInmueble.mockResolvedValue({ id: 2, usuario_id: 1, nombre: 'Casa de mamá', direccion: '' })
    await abrirFormulario(user)
    await user.type(screen.getByLabelText(/nombre del inmueble/i), 'Casa de mamá')
    await guardar(user)
    expect(await screen.findByText('Casa de mamá')).toBeInTheDocument()
    expect(screen.getByText('Casa Norte')).toBeInTheDocument()
  })
})

describe('PanelInmuebles · errores del servidor debajo del campo (HU-05, criterio 2)', () => {
  it('409: nombre repetido, mensaje del servidor debajo del campo y sin crear', async () => {
    const user = await montar([CASA])
    crearInmueble.mockRejectedValue(new ApiError(409, { errores: { nombre: 'Ya tienes un inmueble con este nombre.' } }))
    await abrirFormulario(user)
    await user.type(screen.getByLabelText(/nombre del inmueble/i), 'Casa Norte')
    await guardar(user)

    expect(await screen.findByText('Ya tienes un inmueble con este nombre.')).toBeInTheDocument()
    expect(screen.getByLabelText(/nombre del inmueble/i)).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText(/nombre del inmueble/i)).toHaveValue('Casa Norte') // lo escrito se conserva
    expect(screen.getAllByText('Casa Norte')).toHaveLength(1) // no se duplicó en la lista
  })

  it('422: muestra el mensaje del campo que devolvió el servidor', async () => {
    const user = await montar([])
    crearInmueble.mockRejectedValue(
      new ApiError(422, { detail: [{ msg: 'x' }], errores: { nombre: 'El nombre no puede superar los 100 caracteres.' } })
    )
    await abrirFormulario(user)
    await user.type(screen.getByLabelText(/nombre del inmueble/i), 'Casa')
    await guardar(user)
    expect(await screen.findByText('El nombre no puede superar los 100 caracteres.')).toBeInTheDocument()
  })

  it('sin conexión: muestra un aviso general y no marca ningún campo', async () => {
    const user = await montar([])
    crearInmueble.mockRejectedValue(new ApiError(0, null))
    await abrirFormulario(user)
    await user.type(screen.getByLabelText(/nombre del inmueble/i), 'Casa')
    await guardar(user)
    expect(await screen.findByText(/no se pudo conectar con el servidor/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/nombre del inmueble/i)).not.toHaveAttribute('aria-invalid')
  })

  it('al cancelar y reabrir el formulario se limpian los errores', async () => {
    const user = await montar([])
    await abrirFormulario(user)
    await guardar(user)
    expect(screen.getByText(MENSAJE_NOMBRE_VACIO)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /cancelar/i }))
    await abrirFormulario(user)
    expect(screen.queryByText(MENSAJE_NOMBRE_VACIO)).not.toBeInTheDocument()
  })
})
