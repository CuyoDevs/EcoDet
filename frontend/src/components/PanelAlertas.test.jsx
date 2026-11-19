import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import PanelAlertas from './PanelAlertas'
import { listarAlertasInmueble, marcarAlertaNormal, obtenerDetalleAlerta } from '../api/alertas'
import { listarInmuebles } from '../api/inmuebles'
import { ApiError } from '../api/client'

vi.mock('../api/alertas', () => ({
  listarAlertasInmueble: vi.fn(),
  obtenerDetalleAlerta: vi.fn(),
  marcarAlertaNormal: vi.fn(),
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
  marcarAlertaNormal.mockReset()
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

describe('PanelAlertas · marcar como normal (HU-16 / DET-102)', () => {
  // Muestra la lista con una alerta y abre su detalle.
  async function abrirDetalle(alerta = ALERTA_LUZ) {
    const user = userEvent.setup()
    listarAlertasInmueble.mockResolvedValue([alerta])
    obtenerDetalleAlerta.mockResolvedValue(alerta)
    render(<PanelAlertas inmuebleId={1} />)
    await user.click(await screen.findByRole('button', { name: /2025-07-01 — 2025-07-28/i }))
    await screen.findByText(/Consumo total del período/i)
    return user
  }

  const BOTON = { name: 'Marcar como normal' }
  const CONFIRMAR = { name: 'Sí, marcar como normal' }

  it('ofrece "Marcar como normal" en una alerta pendiente', async () => {
    await abrirDetalle()

    expect(screen.getByRole('button', BOTON)).toBeInTheDocument()
  })

  it.each(['CONFIRMADA', 'NORMAL'])('no ofrece "Marcar como normal" en una alerta %s', async (estado) => {
    await abrirDetalle({ ...ALERTA_LUZ, estado })

    expect(screen.queryByRole('button', BOTON)).not.toBeInTheDocument()
  })

  it('en una alerta ya normal explica que no se usa en las próximas detecciones', async () => {
    await abrirDetalle({ ...ALERTA_LUZ, estado: 'NORMAL' })

    expect(screen.getByText(/fue marcada como normal/i)).toBeInTheDocument()
  })

  it('al elegir "Marcar como normal" pide confirmación y todavía no cambia nada', async () => {
    const user = await abrirDetalle()

    await user.click(screen.getByRole('button', BOTON))

    expect(await screen.findByRole('alertdialog')).toHaveTextContent('2025-07-01 al 2025-07-28')
    expect(marcarAlertaNormal).not.toHaveBeenCalled()
  })

  it('si cancela, la alerta queda como estaba', async () => {
    const user = await abrirDetalle()
    await user.click(screen.getByRole('button', BOTON))

    await user.click(await screen.findByRole('button', { name: 'Cancelar' }))

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(marcarAlertaNormal).not.toHaveBeenCalled()
    expect(screen.getAllByText('PENDIENTE')).toHaveLength(2) // en la lista y en el detalle
    expect(screen.getByRole('button', BOTON)).toBeInTheDocument()
  })

  it('al confirmar marca la alerta como normal, avisa y deja de ofrecer el botón', async () => {
    marcarAlertaNormal.mockResolvedValue({ ...ALERTA_LUZ, estado: 'NORMAL' })
    const user = await abrirDetalle()
    await user.click(screen.getByRole('button', BOTON))

    await user.click(await screen.findByRole('button', CONFIRMAR))

    await waitFor(() => expect(marcarAlertaNormal).toHaveBeenCalledWith(10))
    expect(await screen.findByText(/se excluirá de los próximos cálculos/i)).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    expect(screen.queryByRole('button', BOTON)).not.toBeInTheDocument()
    expect(screen.getAllByText('NORMAL')).toHaveLength(2) // en la lista y en el detalle
    expect(screen.queryByText('PENDIENTE')).not.toBeInTheDocument()
  })

  it('con el filtro "Pendiente" la alerta marcada sale de la lista', async () => {
    marcarAlertaNormal.mockResolvedValue({ ...ALERTA_LUZ, estado: 'NORMAL' })
    const user = await abrirDetalle()
    await user.selectOptions(screen.getByLabelText(/estado/i), 'PENDIENTE')
    await user.click(await screen.findByRole('button', BOTON))

    await user.click(await screen.findByRole('button', CONFIRMAR))

    expect(
      await screen.findByText(/no hay alertas que coincidan con los filtros seleccionados/i)
    ).toBeInTheDocument()
    expect(screen.getByText(/se excluirá de los próximos cálculos/i)).toBeInTheDocument()
  })

  it('si la alerta ya no está pendiente (409) muestra el error en el diálogo y vuelve a pedir la lista', async () => {
    marcarAlertaNormal.mockRejectedValue(
      new ApiError(409, { errores: { general: 'Solo se puede marcar como normal una alerta pendiente.' } })
    )
    const user = await abrirDetalle()
    await user.click(screen.getByRole('button', BOTON))

    await user.click(await screen.findByRole('button', CONFIRMAR))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Solo se puede marcar como normal una alerta pendiente.'
    )
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    await waitFor(() => expect(listarAlertasInmueble).toHaveBeenCalledTimes(2))
  })
})
