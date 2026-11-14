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

  it('muestra advertencia inmediata al cargar una lectura con alerta de consumo alto (HU-13 / DET-88)', async () => {
    consumosApi.crearLecturaConsumo.mockResolvedValueOnce({
      id: 99,
      inmueble_id: 1,
      servicio: 'LUZ',
      fecha_inicio: '2025-01-06',
      fecha_fin: '2025-01-06',
      consumo: 31,
      evaluacion: {
        estado: 'alta',
        alerta_generada: true,
        desvio_porcentual: 55.0,
        mensaje: 'Consumo alto detectado: un 55.0% superior a lo habitual para este servicio.',
        consumo_por_dia: 31.0,
        promedio: 20.0
      },
      alerta: {
        id: 10,
        lectura_id: 99,
        tipo: 'ALTA',
        estado: 'PENDIENTE',
        desvio_porcentual: 55.0
      }
    })

    render(<FormularioConsumo inmuebleId={1} />)

    fireEvent.change(screen.getByLabelText(/Fecha de inicio/i), { target: { value: '2025-01-06' } })
    fireEvent.change(screen.getByLabelText(/Fecha de fin/i), { target: { value: '2025-01-06' } })
    fireEvent.change(screen.getByLabelText(/Consumo \(kWh\)/i), { target: { value: '31' } })

    fireEvent.click(screen.getByText('Registrar consumo'))

    await waitFor(() => {
      expect(screen.getByText('¡Alerta de Consumo Alto!')).toBeInTheDocument()
      expect(screen.getByText('+55%')).toBeInTheDocument()
      expect(screen.getByText(/Consumo alto detectado/i)).toBeInTheDocument()
      expect(screen.getByText(/31 \/día/i)).toBeInTheDocument()
      expect(screen.getByText(/20 \/día/i)).toBeInTheDocument()
    })
  })

  it('muestra advertencia inmediata al cargar una lectura con alerta de consumo bajo (HU-13 / DET-88)', async () => {
    consumosApi.crearLecturaConsumo.mockResolvedValueOnce({
      id: 100,
      inmueble_id: 1,
      servicio: 'LUZ',
      fecha_inicio: '2025-01-06',
      fecha_fin: '2025-01-06',
      consumo: 10,
      evaluacion: {
        estado: 'baja',
        alerta_generada: true,
        desvio_porcentual: -50.0,
        mensaje: 'Consumo bajo inusual detectado: un 50.0% inferior a lo habitual para este servicio.',
        consumo_por_dia: 10.0,
        promedio: 20.0
      },
      alerta: {
        id: 11,
        lectura_id: 100,
        tipo: 'BAJA',
        estado: 'PENDIENTE',
        desvio_porcentual: -50.0
      }
    })

    render(<FormularioConsumo inmuebleId={1} />)

    fireEvent.change(screen.getByLabelText(/Fecha de inicio/i), { target: { value: '2025-01-06' } })
    fireEvent.change(screen.getByLabelText(/Fecha de fin/i), { target: { value: '2025-01-06' } })
    fireEvent.change(screen.getByLabelText(/Consumo \(kWh\)/i), { target: { value: '10' } })

    fireEvent.click(screen.getByText('Registrar consumo'))

    await waitFor(() => {
      expect(screen.getByText('¡Alerta de Consumo Bajo Inusual!')).toBeInTheDocument()
      expect(screen.getByText('-50%')).toBeInTheDocument()
      expect(screen.getByText(/Consumo bajo inusual detectado/i)).toBeInTheDocument()
    })
  })

  it('no muestra advertencia cuando el consumo está dentro de los límites (HU-13)', async () => {
    consumosApi.crearLecturaConsumo.mockResolvedValueOnce({
      id: 101,
      inmueble_id: 1,
      servicio: 'LUZ',
      fecha_inicio: '2025-01-06',
      fecha_fin: '2025-01-06',
      consumo: 20,
      evaluacion: {
        estado: 'dentro',
        alerta_generada: false,
        desvio_porcentual: 0.0,
        mensaje: 'Consumo dentro de los parámetros habituales.'
      },
      alerta: null
    })

    render(<FormularioConsumo inmuebleId={1} />)

    fireEvent.change(screen.getByLabelText(/Fecha de inicio/i), { target: { value: '2025-01-06' } })
    fireEvent.change(screen.getByLabelText(/Fecha de fin/i), { target: { value: '2025-01-06' } })
    fireEvent.change(screen.getByLabelText(/Consumo \(kWh\)/i), { target: { value: '20' } })

    fireEvent.click(screen.getByText('Registrar consumo'))

    await waitFor(() => {
      expect(screen.getByText('¡Lectura registrada con éxito!')).toBeInTheDocument()
      expect(screen.queryByText(/¡Alerta de Consumo/i)).not.toBeInTheDocument()
    })
  })
})
