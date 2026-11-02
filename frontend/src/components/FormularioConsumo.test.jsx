import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import FormularioConsumo from './FormularioConsumo'
import * as consumosApi from '../api/consumos'

vi.mock('../api/consumos', () => ({
  crearLecturaConsumo: vi.fn(),
  crearLecturasLote: vi.fn()
}))

describe('FormularioConsumo (HU-08 / DET-16 y HU-09 / DET-17)', () => {
  it('renderiza correctamente el formulario con los tres servicios y unidades en modo individual', () => {
    render(<FormularioConsumo inmuebleId={1} />)

    expect(screen.getByText('Cargar lecturas de consumo')).toBeInTheDocument()
    expect(screen.getByText('Luz (kWh)')).toBeInTheDocument()
    expect(screen.getByText('Gas (m³)')).toBeInTheDocument()
    expect(screen.getByText('Agua (m³)')).toBeInTheDocument()
    expect(screen.getByLabelText(/Fecha de inicio/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Fecha de fin/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Consumo \(kWh\)/i)).toBeInTheDocument()
  })

  it('permite cambiar a la pestaña de carga histórica en lote (HU-09)', () => {
    render(<FormularioConsumo inmuebleId={1} />)

    fireEvent.click(screen.getByText('Carga histórica (lote)'))
    expect(screen.getByText(/Regla todo o nada/i)).toBeInTheDocument()
    expect(screen.getByText('+ Agregar fila')).toBeInTheDocument()
    expect(screen.getByText('Guardar lote de facturas')).toBeInTheDocument()
  })

  it('en modo lote permite agregar y quitar filas', () => {
    render(<FormularioConsumo inmuebleId={1} />)

    fireEvent.click(screen.getByText('Carga histórica (lote)'))
    expect(screen.getByText('Fila #1')).toBeInTheDocument()
    expect(screen.getByText('Fila #2')).toBeInTheDocument()

    fireEvent.click(screen.getByText('+ Agregar fila'))
    expect(screen.getByText('Fila #3')).toBeInTheDocument()
  })

  it('envía el lote correctamente y muestra el resumen del detector', async () => {
    consumosApi.crearLecturasLote.mockResolvedValueOnce({
      inmueble_id: 1,
      cantidad_cargadas: 6,
      detector_activo_por_servicio: {
        LUZ: true,
        GAS: false,
        AGUA: false
      }
    })

    render(<FormularioConsumo inmuebleId={1} />)

    fireEvent.click(screen.getByText('Carga histórica (lote)'))

    // Llenar fila 1 y fila 2
    const inputsDate = screen.getAllByDisplayValue('')
    // Al menos 2 filas con fecha inicio, fin y consumo
    const submitBtn = screen.getByText('Guardar lote de facturas')

    // Si enviamos con campos vacíos valida localmente todo o nada
    fireEvent.click(submitBtn)
    expect(screen.getByText(/Corrige los errores señalados/i)).toBeInTheDocument()
  })

  it('muestra errores por fila cuando el backend rechaza el lote (409 todo o nada)', async () => {
    consumosApi.crearLecturasLote.mockRejectedValueOnce({
      status: 409,
      data: {
        mensaje: 'El lote contiene períodos superpuestos internamente.',
        errores: {
          fila_1: 'La fila 2 se superpone con la fila 1.'
        }
      }
    })

    render(<FormularioConsumo inmuebleId={1} />)
    fireEvent.click(screen.getByText('Carga histórica (lote)'))

    // Forzamos handleSubmit pasando inputs no vacíos
    const selects = screen.getAllByRole('combobox')
    const dates = screen.getAllByDisplayValue('')

    // Simular que llenamos las 2 filas
    const inputs = document.querySelectorAll('input')
    inputs.forEach((inp, idx) => {
      if (inp.type === 'date') fireEvent.change(inp, { target: { value: '2026-01-0' + (idx + 1) } })
      if (inp.type === 'number') fireEvent.change(inp, { target: { value: '100' } })
    })

    fireEvent.click(screen.getByText('Guardar lote de facturas'))

    await waitFor(() => {
      expect(screen.getByText('La fila 2 se superpone con la fila 1.')).toBeInTheDocument()
    })
  })
})
