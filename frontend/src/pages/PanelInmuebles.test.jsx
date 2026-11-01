import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import PanelInmuebles, { MENSAJE_NOMBRE_VACIO } from './PanelInmuebles'
import { AuthProvider } from '../auth/AuthContext'
import { ApiError } from '../api/client'
import { listarInmuebles, crearInmueble, actualizarInmueble } from '../api/inmuebles'

vi.mock('../api/inmuebles', () => ({ listarInmuebles: vi.fn(), crearInmueble: vi.fn(), actualizarInmueble: vi.fn() }))

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
  actualizarInmueble.mockReset()
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

describe('PanelInmuebles · editar (HU-06)', () => {
  const abrirEdicion = (user, nombre = 'Casa Norte') => user.click(screen.getByRole('button', { name: `Editar ${nombre}` }))
  const guardarCambios = (user) => user.click(screen.getByRole('button', { name: /guardar cambios/i }))

  it('abre un modal con los datos actuales precargados', async () => {
    const user = await montar([CASA])
    await screen.findByText('Casa Norte')
    await abrirEdicion(user)

    const dialogo = screen.getByRole('dialog', { name: /editar inmueble/i })
    expect(dialogo).toBeInTheDocument()
    expect(screen.getByLabelText(/nombre del inmueble/i)).toHaveValue('Casa Norte')
    expect(screen.getByLabelText(/dirección/i)).toHaveValue('Ruta 40')
  })

  it('guarda los cambios, cierra el modal y actualiza la tarjeta sin duplicarla', async () => {
    const user = await montar([CASA, { id: 2, usuario_id: 1, nombre: 'Depto', direccion: null }])
    await screen.findByText('Casa Norte')
    actualizarInmueble.mockResolvedValue({ ...CASA, nombre: 'Casa Sur', direccion: 'Ruta 7' })

    await abrirEdicion(user)
    const nombre = screen.getByLabelText(/nombre del inmueble/i)
    await user.clear(nombre)
    await user.type(nombre, '  Casa Sur ')
    const direccion = screen.getByLabelText(/dirección/i)
    await user.clear(direccion)
    await user.type(direccion, 'Ruta 7')
    await guardarCambios(user)

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(actualizarInmueble).toHaveBeenCalledWith(1, { nombre: 'Casa Sur', direccion: 'Ruta 7' })
    expect(screen.getByText('Casa Sur')).toBeInTheDocument()
    expect(screen.getByText('Ruta 7')).toBeInTheDocument()
    expect(screen.queryByText('Casa Norte')).not.toBeInTheDocument()
    expect(screen.getByText('Depto')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
  })

  it('con el nombre vacío muestra el error debajo del campo y no llama a la API', async () => {
    const user = await montar([CASA])
    await screen.findByText('Casa Norte')
    await abrirEdicion(user)
    await user.clear(screen.getByLabelText(/nombre del inmueble/i))
    await guardarCambios(user)

    expect(screen.getByText(MENSAJE_NOMBRE_VACIO)).toBeInTheDocument()
    expect(screen.getByLabelText(/nombre del inmueble/i)).toHaveAttribute('aria-invalid', 'true')
    expect(actualizarInmueble).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog')).toBeInTheDocument() // sigue abierto para corregir
  })

  it('un nombre repetido (409) se muestra debajo del campo, conserva lo escrito y no cambia la lista', async () => {
    const user = await montar([CASA, { id: 2, usuario_id: 1, nombre: 'Depto', direccion: null }])
    await screen.findByText('Depto')
    actualizarInmueble.mockRejectedValue(
      new ApiError(409, { errores: { nombre: 'Ya tienes otro inmueble con este nombre.' } })
    )

    await abrirEdicion(user, 'Depto')
    const nombre = screen.getByLabelText(/nombre del inmueble/i)
    await user.clear(nombre)
    await user.type(nombre, 'Casa Norte')
    await guardarCambios(user)

    expect(await screen.findByText('Ya tienes otro inmueble con este nombre.')).toBeInTheDocument()
    expect(screen.getByLabelText(/nombre del inmueble/i)).toHaveValue('Casa Norte')
    expect(screen.getByLabelText(/nombre del inmueble/i)).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    expect(screen.getByText('Depto')).toBeInTheDocument()
  })

  it('un fallo de conexión se avisa en el modal sin marcar ningún campo', async () => {
    const user = await montar([CASA])
    await screen.findByText('Casa Norte')
    actualizarInmueble.mockRejectedValue(new ApiError(0, null))

    await abrirEdicion(user)
    await guardarCambios(user)

    expect(await screen.findByText(/no se pudo conectar con el servidor/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/nombre del inmueble/i)).not.toHaveAttribute('aria-invalid')
  })

  it('Cancelar y Esc cierran el modal sin llamar a la API; al reabrir no quedan errores', async () => {
    const user = await montar([CASA])
    await screen.findByText('Casa Norte')

    await abrirEdicion(user)
    await user.clear(screen.getByLabelText(/nombre del inmueble/i))
    await guardarCambios(user)
    expect(screen.getByText(MENSAJE_NOMBRE_VACIO)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /cancelar/i }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await abrirEdicion(user)
    expect(screen.queryByText(MENSAJE_NOMBRE_VACIO)).not.toBeInTheDocument()
    expect(screen.getByLabelText(/nombre del inmueble/i)).toHaveValue('Casa Norte') // datos originales
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(actualizarInmueble).not.toHaveBeenCalled()
  })
})
