import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import PanelAlertas from './PanelAlertas'
import { listarAlertasInmueble, obtenerDetalleAlerta } from '../api/alertas'
import { listarInmuebles } from '../api/inmuebles'
import { ApiError } from '../api/client'

vi.mock('../api/alertas', () => ({
  listarAlertasInmueble: vi.fn(),
  obtenerDetalleAlerta: vi.fn(),
}))

vi.mock('../api/inmuebles', () => ({
  listarInmuebles: vi.fn(),
}))

vi.mock('react-chartjs-2', () => ({
  Bar: ({ data, options }) => (
    <div data-testid="grafico-alerta" aria-label={options?.plugins?.title?.text || 'Gráfico'}>
      {data?.labels?.join(' | ')}
    </div>
  ),
}))

const ALERTA_LUZ = {
  id: 10,
  lectura_id: 77,
  inmueble_id: 1,
  servicio: 'LUZ',
  fecha_inicio: '2025-07-01',
  fecha_fin: '2025-07-28',
  consumo: 450,
  tipo: 'ALTA',
  estado: 'PENDIENTE',
  desvio_porcentual: 125.0,
  consumo_por_dia: 16.07,
  consumo_habitual_por_dia: 7.14,
  fecha_creacion: '2025-07-29T10:00:00',
}

beforeEach(() => {
  listarAlertasInmueble.mockReset()
  obtenerDetalleAlerta.mockReset()
  listarInmuebles.mockReset()
  listarInmuebles.mockResolvedValue([{ id: 1, nombre: 'Casa Norte', direccion: 'Ruta 40', alertas_pendientes: 1 }])
})

describe('PanelAlertas · listado, filtros y detalle (HU-15)', () => {
  it('muestra mensaje de consumo normal cuando el inmueble no tiene alertas', async () => {
    listarAlertasInmueble.mockResolvedValue([])
    render(<PanelAlertas inmuebleId={1} />)

    expect(await screen.findByText(/el consumo está dentro de lo normal/i)).toBeInTheDocument()
    expect(await screen.findByText(/Casa Norte/)).toBeInTheDocument()
  })

  it('lista las alertas del inmueble y al seleccionar una muestra el detalle y el gráfico', async () => {
    const user = userEvent.setup()
    listarAlertasInmueble.mockResolvedValue([ALERTA_LUZ])
    obtenerDetalleAlerta.mockResolvedValue(ALERTA_LUZ)

    render(<PanelAlertas inmuebleId={1} />)

    expect(await screen.findByText('2025-07-01 — 2025-07-28')).toBeInTheDocument()
    expect(screen.getByText('PENDIENTE')).toBeInTheDocument()
    expect(screen.getByText(/Consumo alto \(\+125\.0%\)/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /2025-07-01 — 2025-07-28/i }))

    await waitFor(() => expect(obtenerDetalleAlerta).toHaveBeenCalledWith(10))
    expect(await screen.findByText(/Consumo total del período/i)).toBeInTheDocument()
    expect(screen.getByText('450 kWh')).toBeInTheDocument()
    expect(screen.getByTestId('grafico-alerta')).toBeInTheDocument()
  })

  it('filtra por servicio y por estado enviando los parámetros a la API', async () => {
    const user = userEvent.setup()
    listarAlertasInmueble.mockResolvedValue([ALERTA_LUZ])

    render(<PanelAlertas inmuebleId={1} />)
    await screen.findByText('2025-07-01 — 2025-07-28')

    listarAlertasInmueble.mockResolvedValueOnce([])
    await user.selectOptions(screen.getByLabelText(/servicio/i), 'GAS')

    await waitFor(() =>
      expect(listarAlertasInmueble).toHaveBeenLastCalledWith(1, { estado: '', servicio: 'GAS' })
    )
    expect(
      await screen.findByText(/no hay alertas que coincidan con los filtros seleccionados/i)
    ).toBeInTheDocument()
  })

  it('muestra un aviso de error si la API responde 404', async () => {
    listarAlertasInmueble.mockRejectedValue(
      new ApiError(404, { errores: { general: 'Inmueble no encontrado.' } })
    )

    render(<PanelAlertas inmuebleId={999} />)

    expect(await screen.findByRole('alert')).toHaveTextContent('Inmueble no encontrado.')
  })
})