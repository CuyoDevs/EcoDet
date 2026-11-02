import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import FormularioConsumo from './FormularioConsumo'
import * as consumosApi from '../api/consumos'

vi.mock('../api/consumos', () => ({
  crearLecturaConsumo: vi.fn()
}))

describe('FormularioConsumo (HU-08 / DET-16)', () => {
  it('renderiza correctamente el formulario con los tres servicios y unidades', () => {
    render(<FormularioConsumo inmuebleId={1} />)

    expect(screen.getByText('Registrar lectura de consumo')).toBeInTheDocument()
    expect(screen.getByText('Luz (kWh)')).toBeInTheDocument()
    expect(screen.getByText('Gas (m³)')).toBeInTheDocument()
    expect(screen.getByText('Agua (m³)')).toBeInTheDocument()
    expect(screen.getByLabelText(/Fecha de inicio/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Fecha de fin/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Consumo \(kWh\)/i)).toBeInTheDocument()
  })

  it('permite cambiar de servicio y actualiza la unidad', () => {
    render(<FormularioConsumo inmuebleId={1} />)

    fireEvent.click(screen.getByText('Gas (m³)'))
    expect(screen.getByLabelText(/Consumo \(m³\)/i)).toBeInTheDocument()

    fireEvent.click(screen.getByText('Agua (m³)'))
    expect(screen.getByLabelText(/Consumo \(m³\)/i)).toBeInTheDocument()
  })

  it('envía los datos correctamente y muestra mensaje de éxito', async () => {
    consumosApi.crearLecturaConsumo.mockResolvedValueOnce({
      id: 1,
      inmueble_id: 1,
      servicio: 'LUZ',
      fecha_inicio: '2026-08-01',
      fecha_fin: '2026-08-31',
      consumo: 120.5
    })

    const onLecturaCreada = vi.fn()
    render(<FormularioConsumo inmuebleId={1} onLecturaCreada={onLecturaCreada} />)

    fireEvent.change(screen.getByLabelText(/Fecha de inicio/i), { target: { value: '2026-08-01' } })
    fireEvent.change(screen.getByLabelText(/Fecha de fin/i), { target: { value: '2026-08-31' } })
    fireEvent.change(screen.getByLabelText(/Consumo/i), { target: { value: '120.5' } })

    fireEvent.click(screen.getByRole('button', { name: /Registrar consumo/i }))

    await waitFor(() => {
      expect(consumosApi.crearLecturaConsumo).toHaveBeenCalledWith({
        inmueble_id: 1,
        servicio: 'LUZ',
        fecha_inicio: '2026-08-01',
        fecha_fin: '2026-08-31',
        consumo: 120.5
      })
      expect(screen.getByText('¡Lectura registrada con éxito!')).toBeInTheDocument()
      expect(onLecturaCreada).toHaveBeenCalled()
    })
  })

  it('muestra errores de campo devueltos por el backend (409 / 422)', async () => {
    consumosApi.crearLecturaConsumo.mockRejectedValueOnce({
      errores: {
        fecha_inicio: 'El período ingresado se superpone con otra lectura existente.'
      }
    })

    render(<FormularioConsumo inmuebleId={1} />)

    fireEvent.change(screen.getByLabelText(/Fecha de inicio/i), { target: { value: '2026-08-15' } })
    fireEvent.change(screen.getByLabelText(/Fecha de fin/i), { target: { value: '2026-09-15' } })
    fireEvent.change(screen.getByLabelText(/Consumo/i), { target: { value: '80' } })

    fireEvent.click(screen.getByRole('button', { name: /Registrar consumo/i }))

    await waitFor(() => {
      expect(screen.getByText('El período ingresado se superpone con otra lectura existente.')).toBeInTheDocument()
    })
  })
})
