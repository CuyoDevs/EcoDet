// HU-14 · DET-94: indicador de progreso del aprendizaje en el historial (W4).
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import HistorialConsumos from './HistorialConsumos'
import * as consumosApi from '../api/consumos'

const lectura = (id, mes) => ({
  id, servicio: 'LUZ', fecha_inicio: `2025-${mes}-01`, fecha_fin: `2025-${mes}-28`,
  consumo: 100, consumo_por_dia: 3.57, tiene_alerta: false
})
const servicio = (cantidad, faltantes) => ({
  detector_activo: faltantes === 0,
  lecturas_faltantes: faltantes,
  lecturas: Array.from({ length: cantidad }, (_, i) => lectura(i + 1, String(i + 1).padStart(2, '0'))),
  estadisticas: cantidad ? { promedio: 3.57, minimo: 3.57, maximo: 3.57, tendencia: 'estable' } : null
})
const historial = (luz, gas, agua) => ({ inmueble_id: 1, LUZ: luz, GAS: gas, AGUA: agua })

async function mostrar(datos) {
  vi.spyOn(consumosApi, 'obtenerHistorial').mockResolvedValue(datos)
  render(<HistorialConsumos inmuebleId={1} />)
  await waitFor(() => expect(screen.queryByText('Cargando historial…')).not.toBeInTheDocument())
}

describe('HistorialConsumos · progreso del aprendizaje (HU-14)', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('un servicio con menos de 6 lecturas muestra cuántas lleva y cuántas le faltan', async () => {
    await mostrar(historial(servicio(4, 2), servicio(0, 6), servicio(0, 6)))

    const barra = screen.getByRole('progressbar', { name: 'Progreso del aprendizaje' })
    expect(barra).toHaveAttribute('aria-valuetext', '4 de 6 lecturas')
    expect(screen.getByText(/aún estamos aprendiendo tu patrón/i)).toBeInTheDocument()
    expect(screen.getByText('Faltan 2 lecturas para activar las alertas.')).toBeInTheDocument()
  })

  it('con 5 lecturas falta una sola y se dice en singular', async () => {
    await mostrar(historial(servicio(5, 1), servicio(0, 6), servicio(0, 6)))
    expect(screen.getByText('Falta 1 lectura para activar las alertas.')).toBeInTheDocument()
  })

  it('criterio 2: al llegar a 6 lecturas el indicador desaparece y queda "Detector activo"', async () => {
    await mostrar(historial(servicio(6, 0), servicio(0, 6), servicio(0, 6)))

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    expect(screen.queryByText(/aún estamos aprendiendo/i)).not.toBeInTheDocument()
    expect(screen.getByText(/Detector activo/)).toBeInTheDocument()
  })

  it('cada servicio tiene su propio indicador', async () => {
    await mostrar(historial(servicio(6, 0), servicio(2, 4), servicio(3, 3)))

    const barras = screen.getAllByRole('progressbar')
    expect(barras.map((b) => b.getAttribute('aria-valuetext'))).toEqual(['2 de 6 lecturas', '3 de 6 lecturas'])
  })

  it('un servicio sin lecturas no muestra barra: ya dice que no hay lecturas', async () => {
    await mostrar(historial(servicio(0, 6), servicio(0, 6), servicio(0, 6)))
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    expect(screen.getAllByText('Sin lecturas registradas.')).toHaveLength(3)
  })

  it('con un backend que todavía no informa los faltantes no se inventa un progreso', async () => {
    const sinDato = { ...servicio(3, 3) }
    delete sinDato.lecturas_faltantes
    await mostrar(historial(sinDato, servicio(0, 6), servicio(0, 6)))
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })
})
