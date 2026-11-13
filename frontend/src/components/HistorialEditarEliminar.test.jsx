// HistorialEditarEliminar.test.jsx — HU-11 / DET-77: editar y eliminar lecturas desde el historial
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react'
import HistorialConsumos from './HistorialConsumos'
import * as consumosApi from '../api/consumos'
import { ApiError } from '../api/client'

const lectura1 = { id: 1, servicio: 'LUZ', fecha_inicio: '2026-01-01', fecha_fin: '2026-01-31', consumo: 120, consumo_por_dia: 3.87, tiene_alerta: false }
const lectura2 = { id: 2, servicio: 'LUZ', fecha_inicio: '2026-02-01', fecha_fin: '2026-02-28', consumo: 200, consumo_por_dia: 7.14, tiene_alerta: true }
const vacio = { detector_activo: false, lecturas: [], estadisticas: null }

const historial = (lecturas) => ({
  inmueble_id: 1,
  LUZ: { detector_activo: false, lecturas, estadisticas: null },
  GAS: vacio,
  AGUA: vacio,
})

async function abrirHistorial(lecturas = [lectura1, lectura2]) {
  vi.spyOn(consumosApi, 'obtenerHistorial').mockResolvedValue(historial(lecturas))
  render(<HistorialConsumos inmuebleId={1} />)
  await waitFor(() => screen.getAllByRole('button', { name: /^Editar lectura/ }))
}

const botonEditar = (inicio, fin) => screen.getByRole('button', { name: `Editar lectura ${inicio} al ${fin}` })
const botonEliminar = (inicio, fin) => screen.getByRole('button', { name: `Eliminar lectura ${inicio} al ${fin}` })

describe('HU-11 · Editar una lectura', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('cada lectura tiene sus botones Editar y Eliminar', async () => {
    await abrirHistorial()
    expect(screen.getAllByRole('button', { name: /^Editar lectura/ })).toHaveLength(2)
    expect(screen.getAllByRole('button', { name: /^Eliminar lectura/ })).toHaveLength(2)
  })

  it('al elegir Editar se abre el modal con los datos actuales', async () => {
    await abrirHistorial()
    fireEvent.click(botonEditar('2026-01-01', '2026-01-31'))

    const modal = screen.getByRole('dialog', { name: 'Editar lectura' })
    expect(within(modal).getByLabelText(/Fecha de inicio/)).toHaveValue('2026-01-01')
    expect(within(modal).getByLabelText(/Fecha de fin/)).toHaveValue('2026-01-31')
    expect(within(modal).getByLabelText(/Consumo/)).toHaveValue(120)
    expect(within(modal).getByLabelText(/Servicio/)).toHaveValue('LUZ')
  })

  it('criterio 1: con valores válidos guarda con PUT y vuelve a pedir el historial', async () => {
    await abrirHistorial()
    const actualizar = vi.spyOn(consumosApi, 'actualizarLectura').mockResolvedValue({ id: 1 })
    consumosApi.obtenerHistorial.mockClear()

    fireEvent.click(botonEditar('2026-01-01', '2026-01-31'))
    fireEvent.change(screen.getByLabelText(/Consumo/), { target: { value: '95.5' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Editar lectura' })).not.toBeInTheDocument())
    expect(actualizar).toHaveBeenCalledWith(1, {
      servicio: 'LUZ', fecha_inicio: '2026-01-01', fecha_fin: '2026-01-31', consumo: 95.5,
    })
    expect(consumosApi.obtenerHistorial).toHaveBeenCalledTimes(1) // se refresca sin pasar por "Cargando…"
  })

  it('datos inválidos (422): muestra el error bajo el campo y deja el modal abierto', async () => {
    await abrirHistorial()
    vi.spyOn(consumosApi, 'actualizarLectura').mockRejectedValue(
      new ApiError(422, { errores: { consumo: 'El consumo no puede ser negativo.' } })
    )

    fireEvent.click(botonEditar('2026-01-01', '2026-01-31'))
    fireEvent.change(screen.getByLabelText(/Consumo/), { target: { value: '-5' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(await screen.findByText('El consumo no puede ser negativo.')).toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: 'Editar lectura' })).toBeInTheDocument()
  })

  it('período superpuesto (409): muestra el aviso en la fecha de inicio', async () => {
    await abrirHistorial()
    vi.spyOn(consumosApi, 'actualizarLectura').mockRejectedValue(
      new ApiError(409, { errores: { fecha_inicio: 'El período ingresado se superpone con otra lectura existente para este servicio.' } })
    )

    fireEvent.click(botonEditar('2026-02-01', '2026-02-28'))
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(await screen.findByText(/se superpone con otra lectura/)).toBeInTheDocument()
  })

  it('sin conexión: muestra el mensaje general dentro del modal', async () => {
    await abrirHistorial()
    vi.spyOn(consumosApi, 'actualizarLectura').mockRejectedValue(new ApiError(0, null))

    fireEvent.click(botonEditar('2026-01-01', '2026-01-31'))
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(await screen.findByText(/No se pudo conectar con el servidor/)).toBeInTheDocument()
  })

  it('mientras guarda deshabilita los botones (sin doble envío)', async () => {
    await abrirHistorial()
    const actualizar = vi.spyOn(consumosApi, 'actualizarLectura').mockReturnValue(new Promise(() => {}))

    fireEvent.click(botonEditar('2026-01-01', '2026-01-31'))
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(await screen.findByRole('button', { name: 'Guardando…' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Guardando…' }))
    expect(actualizar).toHaveBeenCalledTimes(1)
  })

  it('Cancelar y Esc cierran el modal sin llamar a la API', async () => {
    await abrirHistorial()
    const actualizar = vi.spyOn(consumosApi, 'actualizarLectura')

    fireEvent.click(botonEditar('2026-01-01', '2026-01-31'))
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByRole('dialog', { name: 'Editar lectura' })).not.toBeInTheDocument()

    fireEvent.click(botonEditar('2026-01-01', '2026-01-31'))
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog', { name: 'Editar lectura' })).not.toBeInTheDocument()
    expect(actualizar).not.toHaveBeenCalled()
  })
})

describe('HU-11 · Eliminar una lectura', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('criterio 3: pide confirmación y todavía no borra nada', async () => {
    await abrirHistorial()
    const eliminar = vi.spyOn(consumosApi, 'eliminarLectura')

    fireEvent.click(botonEliminar('2026-02-01', '2026-02-28'))

    const aviso = screen.getByRole('alertdialog', { name: 'Eliminar lectura' })
    expect(aviso).toHaveTextContent('2026-02-01 al 2026-02-28')
    expect(aviso).toHaveTextContent('También se borrará su alerta')
    expect(within(aviso).getByRole('button', { name: 'Cancelar' })).toBeInTheDocument()
    expect(within(aviso).getByRole('button', { name: 'Sí, eliminar' })).toBeInTheDocument()
    expect(eliminar).not.toHaveBeenCalled()
  })

  it('al confirmar llama a DELETE, cierra el aviso y la lectura desaparece del historial', async () => {
    await abrirHistorial()
    const eliminar = vi.spyOn(consumosApi, 'eliminarLectura').mockResolvedValue(null)
    consumosApi.obtenerHistorial.mockResolvedValue(historial([lectura1]))

    fireEvent.click(botonEliminar('2026-02-01', '2026-02-28'))
    fireEvent.click(screen.getByRole('button', { name: 'Sí, eliminar' }))

    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    expect(eliminar).toHaveBeenCalledWith(2)
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Eliminar lectura 2026-02-01 al 2026-02-28' })).not.toBeInTheDocument()
    )
    expect(botonEliminar('2026-01-01', '2026-01-31')).toBeInTheDocument()
  })

  it('al eliminar la última lectura del servicio vuelve el estado vacío', async () => {
    await abrirHistorial([lectura1])
    vi.spyOn(consumosApi, 'eliminarLectura').mockResolvedValue(null)
    consumosApi.obtenerHistorial.mockResolvedValue(historial([]))

    fireEvent.click(botonEliminar('2026-01-01', '2026-01-31'))
    fireEvent.click(screen.getByRole('button', { name: 'Sí, eliminar' }))

    await waitFor(() => expect(screen.getAllByText('Sin lecturas registradas.')).toHaveLength(3))
  })

  it('Cancelar y Esc no eliminan nada', async () => {
    await abrirHistorial()
    const eliminar = vi.spyOn(consumosApi, 'eliminarLectura')

    fireEvent.click(botonEliminar('2026-01-01', '2026-01-31'))
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()

    fireEvent.click(botonEliminar('2026-01-01', '2026-01-31'))
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()

    expect(eliminar).not.toHaveBeenCalled()
    expect(botonEliminar('2026-01-01', '2026-01-31')).toBeInTheDocument()
  })

  it('si el servidor falla muestra el error dentro del aviso y la lectura sigue', async () => {
    await abrirHistorial()
    vi.spyOn(consumosApi, 'eliminarLectura').mockRejectedValue(new ApiError(0, null))

    fireEvent.click(botonEliminar('2026-01-01', '2026-01-31'))
    fireEvent.click(screen.getByRole('button', { name: 'Sí, eliminar' }))

    const aviso = await screen.findByRole('alertdialog')
    await waitFor(() => expect(aviso).toHaveTextContent(/No se pudo conectar con el servidor/))
    expect(botonEliminar('2026-01-01', '2026-01-31')).toBeInTheDocument()

    // al cancelar y reabrir, el aviso vuelve sin el error
    fireEvent.click(within(aviso).getByRole('button', { name: 'Cancelar' }))
    fireEvent.click(botonEliminar('2026-01-01', '2026-01-31'))
    expect(screen.getByRole('alertdialog')).not.toHaveTextContent(/No se pudo conectar/)
  })

  it('lectura inexistente (404): muestra el mensaje del servidor', async () => {
    await abrirHistorial()
    vi.spyOn(consumosApi, 'eliminarLectura').mockRejectedValue(
      new ApiError(404, { errores: { general: 'Lectura no encontrada.' } })
    )

    fireEvent.click(botonEliminar('2026-01-01', '2026-01-31'))
    fireEvent.click(screen.getByRole('button', { name: 'Sí, eliminar' }))

    expect(await screen.findByText('Lectura no encontrada.')).toBeInTheDocument()
  })

  it('sin doble envío: mientras elimina los botones quedan deshabilitados', async () => {
    await abrirHistorial()
    const eliminar = vi.spyOn(consumosApi, 'eliminarLectura').mockReturnValue(new Promise(() => {}))

    fireEvent.click(botonEliminar('2026-01-01', '2026-01-31'))
    fireEvent.click(screen.getByRole('button', { name: 'Sí, eliminar' }))

    const enCurso = await screen.findByRole('button', { name: 'Eliminando…' })
    expect(enCurso).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled()
    fireEvent.click(enCurso)
    expect(eliminar).toHaveBeenCalledTimes(1)
  })
})
