// HistorialConsumos.test.jsx — HU-10 / DET-18
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import HistorialConsumos from './HistorialConsumos'
import * as consumosApi from '../api/consumos'

// Historial de ejemplo con lecturas
const historialConDatos = {
  inmueble_id: 1,
  LUZ: {
    detector_activo: true,
    lecturas: [
      { id: 1, servicio: 'LUZ', fecha_inicio: '2026-01-01', fecha_fin: '2026-01-31', consumo: 120, consumo_por_dia: 3.87, tiene_alerta: false },
      { id: 2, servicio: 'LUZ', fecha_inicio: '2026-02-01', fecha_fin: '2026-02-28', consumo: 200, consumo_por_dia: 7.14, tiene_alerta: true },
    ],
    estadisticas: { promedio: 5.5, minimo: 3.87, maximo: 7.14, tendencia: 'sube' },
  },
  GAS: {
    detector_activo: false,
    lecturas: [],
    estadisticas: null,
  },
  AGUA: {
    detector_activo: false,
    lecturas: [],
    estadisticas: null,
  },
}

// Historial sin ninguna lectura
const historialVacio = {
  inmueble_id: 2,
  LUZ:  { detector_activo: false, lecturas: [], estadisticas: null },
  GAS:  { detector_activo: false, lecturas: [], estadisticas: null },
  AGUA: { detector_activo: false, lecturas: [], estadisticas: null },
}

describe('HistorialConsumos', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('muestra "Cargando historial…" mientras espera la respuesta', () => {
    vi.spyOn(consumosApi, 'obtenerHistorial').mockReturnValue(new Promise(() => {}))
    render(<HistorialConsumos inmuebleId={1} />)
    expect(screen.getByRole('status')).toHaveTextContent('Cargando historial…')
  })

  it('muestra los paneles de servicios cuando hay datos', async () => {
    vi.spyOn(consumosApi, 'obtenerHistorial').mockResolvedValue(historialConDatos)
    render(<HistorialConsumos inmuebleId={1} />)
    await waitFor(() => {
      expect(screen.getByText(/LUZ/)).toBeInTheDocument()
      expect(screen.getByText(/GAS/)).toBeInTheDocument()
      expect(screen.getByText(/AGUA/)).toBeInTheDocument()
    })
  })

  it('muestra el estado del detector activo para LUZ', async () => {
    vi.spyOn(consumosApi, 'obtenerHistorial').mockResolvedValue(historialConDatos)
    render(<HistorialConsumos inmuebleId={1} />)
    await waitFor(() => {
      expect(screen.getByText(/Detector activo/)).toBeInTheDocument()
    })
  })

  it('muestra "Sin lecturas registradas" cuando el servicio no tiene datos', async () => {
    vi.spyOn(consumosApi, 'obtenerHistorial').mockResolvedValue(historialVacio)
    render(<HistorialConsumos inmuebleId={2} />)
    await waitFor(() => {
      const msgs = screen.getAllByText('Sin lecturas registradas.')
      expect(msgs.length).toBeGreaterThanOrEqual(2) // al menos LUZ y GAS
    })
  })

  it('muestra error cuando la API falla', async () => {
    vi.spyOn(consumosApi, 'obtenerHistorial').mockRejectedValue(new Error('Error de red'))
    render(<HistorialConsumos inmuebleId={1} />)
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Error de red')
    })
  })

  it('llama a onCerrar cuando se hace clic en "Cerrar"', async () => {
    vi.spyOn(consumosApi, 'obtenerHistorial').mockResolvedValue(historialConDatos)
    const onCerrar = vi.fn()
    render(<HistorialConsumos inmuebleId={1} onCerrar={onCerrar} />)
    await waitFor(() => screen.getByText(/Historial de consumos/))
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar historial' }))
    expect(onCerrar).toHaveBeenCalledTimes(1)
  })

  it('muestra el tooltip de lectura al hacer clic en un punto del gráfico', async () => {
    vi.spyOn(consumosApi, 'obtenerHistorial').mockResolvedValue(historialConDatos)
    render(<HistorialConsumos inmuebleId={1} />)
    await waitFor(() => screen.getByLabelText('Gráfico de consumo por día'))
    // Hacer clic en el primer punto del gráfico (primer lectura de LUZ)
    const puntos = screen.getAllByRole('button', { name: /Período/ })
    fireEvent.click(puntos[0])
    // El dialog de detalle debe aparecer
    expect(screen.getByRole('dialog', { name: 'Detalle de lectura' })).toBeInTheDocument()
    // Verifica texto "Período seleccionado"
    expect(screen.getByText('Período seleccionado')).toBeInTheDocument()
  })
})
