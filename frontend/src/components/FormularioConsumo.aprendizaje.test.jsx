// HU-14 · DET-93: aviso "aprendiendo" en la carga de lecturas (W3), individual y en lote.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import FormularioConsumo from './FormularioConsumo'
import * as consumosApi from '../api/consumos'

vi.mock('../api/consumos', () => ({
  crearLecturaConsumo: vi.fn(),
  crearLecturasLote: vi.fn()
}))

const respuesta = (evaluacion) => ({
  id: 1, inmueble_id: 1, servicio: 'LUZ', fecha_inicio: '2025-01-01', fecha_fin: '2025-01-31', consumo: 100, evaluacion
})
const aprendiendo = (faltantes) => ({
  estado: 'aprendiendo', motivo: 'lecturas_insuficientes', lecturas_registradas: 6 - faltantes, lecturas_faltantes: faltantes
})
const dentro = { estado: 'dentro', motivo: null, lecturas_registradas: 6, lecturas_faltantes: 0 }

async function guardarLecturaIndividual({ servicio } = {}) {
  if (servicio) fireEvent.click(screen.getByText(servicio))
  fireEvent.change(screen.getByLabelText(/Fecha de inicio/i), { target: { value: '2025-01-01' } })
  fireEvent.change(screen.getByLabelText(/Fecha de fin/i), { target: { value: '2025-01-31' } })
  fireEvent.change(screen.getByLabelText(/Consumo \(/i), { target: { value: '100' } })
  fireEvent.click(screen.getByText('Registrar consumo'))
  await waitFor(() => expect(consumosApi.crearLecturaConsumo).toHaveBeenCalled())
}

describe('FormularioConsumo · aviso de aprendizaje al guardar una lectura (HU-14)', () => {
  beforeEach(() => vi.resetAllMocks())

  it('criterio 1: con menos de 6 lecturas explica que todavía se está aprendiendo y cuántas faltan', async () => {
    consumosApi.crearLecturaConsumo.mockResolvedValueOnce(respuesta(aprendiendo(5)))
    render(<FormularioConsumo inmuebleId={1} />)

    await guardarLecturaIndividual()

    expect(await screen.findByText(/aún estamos aprendiendo tu patrón/i)).toBeInTheDocument()
    expect(screen.getByText(/Faltan 5 lecturas de luz/)).toBeInTheDocument()
    expect(screen.getByText(/no se generan alertas/i)).toBeInTheDocument()
    expect(screen.getByText('¡Lectura registrada con éxito!')).toBeInTheDocument() // el aviso no reemplaza el éxito
  })

  it('nombra el servicio de la lectura que se acaba de guardar', async () => {
    consumosApi.crearLecturaConsumo.mockResolvedValueOnce(respuesta(aprendiendo(4)))
    render(<FormularioConsumo inmuebleId={1} />)

    await guardarLecturaIndividual({ servicio: 'Gas (m³)' })

    expect(await screen.findByText(/Faltan 4 lecturas de gas/)).toBeInTheDocument()
  })

  it('criterio 2: al llegar a 6 lecturas el aviso desaparece', async () => {
    consumosApi.crearLecturaConsumo
      .mockResolvedValueOnce(respuesta(aprendiendo(1)))
      .mockResolvedValueOnce(respuesta(dentro))
    render(<FormularioConsumo inmuebleId={1} />)

    await guardarLecturaIndividual()
    expect(await screen.findByText(/Falta 1 lectura de luz/)).toBeInTheDocument()

    await guardarLecturaIndividual()
    await waitFor(() => expect(consumosApi.crearLecturaConsumo).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(screen.queryByText(/aún estamos aprendiendo/i)).not.toBeInTheDocument())
    expect(screen.getByText('¡Lectura registrada con éxito!')).toBeInTheDocument()
  })

  it('con un servicio que ya se evalúa no muestra ningún aviso', async () => {
    consumosApi.crearLecturaConsumo.mockResolvedValueOnce(respuesta(dentro))
    render(<FormularioConsumo inmuebleId={1} />)

    await guardarLecturaIndividual()

    expect(await screen.findByText('¡Lectura registrada con éxito!')).toBeInTheDocument()
    expect(screen.queryByText(/aprendiendo/i)).not.toBeInTheDocument()
  })

  it('si la lectura se rechaza no queda ningún aviso de aprendizaje', async () => {
    consumosApi.crearLecturaConsumo.mockResolvedValueOnce(respuesta(aprendiendo(5)))
    render(<FormularioConsumo inmuebleId={1} />)
    await guardarLecturaIndividual()
    await screen.findByText(/aún estamos aprendiendo/i)

    consumosApi.crearLecturaConsumo.mockRejectedValueOnce(Object.assign(new Error('x'), { errores: { fecha_inicio: 'Se superpone.' } }))
    await guardarLecturaIndividual()

    await waitFor(() => expect(screen.queryByText(/aún estamos aprendiendo/i)).not.toBeInTheDocument())
  })

  it('cambiar a la carga en lote limpia el aviso', async () => {
    consumosApi.crearLecturaConsumo.mockResolvedValueOnce(respuesta(aprendiendo(5)))
    render(<FormularioConsumo inmuebleId={1} />)
    await guardarLecturaIndividual()
    await screen.findByText(/aún estamos aprendiendo/i)

    fireEvent.click(screen.getByText('Carga histórica (lote)'))

    expect(screen.queryByText(/aún estamos aprendiendo/i)).not.toBeInTheDocument()
  })
})

describe('FormularioConsumo · resumen del lote con el estado de aprendizaje (HU-14)', () => {
  beforeEach(() => vi.resetAllMocks())

  async function guardarLote(resultado) {
    consumosApi.crearLecturasLote.mockResolvedValueOnce(resultado)
    const { container } = render(<FormularioConsumo inmuebleId={1} />)
    fireEvent.click(screen.getByText('Carga histórica (lote)'))

    const fechas = container.querySelectorAll('input[type="date"]')
    const consumos = screen.getAllByPlaceholderText('0.0')
    ;[['2025-01-01', '2025-01-31'], ['2025-02-01', '2025-02-28']].forEach(([ini, fin], i) => {
      fireEvent.change(fechas[i * 2], { target: { value: ini } })
      fireEvent.change(fechas[i * 2 + 1], { target: { value: fin } })
      fireEvent.change(consumos[i], { target: { value: '100' } })
    })
    fireEvent.click(screen.getByText('Guardar lote de facturas'))
    await screen.findByText(/Estado del detector tras la carga/i)
  }

  it('cada servicio dice si ya está activo o cuántas lecturas le faltan', async () => {
    await guardarLote({
      inmueble_id: 1, cantidad_cargadas: 2, lecturas: [],
      detector_activo_por_servicio: { LUZ: true, GAS: false, AGUA: false },
      lecturas_faltantes_por_servicio: { LUZ: 0, GAS: 1, AGUA: 6 }
    })

    expect(screen.getByText(/Luz:/).closest('li')).toHaveTextContent('Activo (≥ 6 lecturas)')
    expect(screen.getByText(/Gas:/).closest('li')).toHaveTextContent(/aún estamos aprendiendo tu patrón\. Falta 1 lectura para empezar a evaluar\./i)
    expect(screen.getByText(/Agua:/).closest('li')).toHaveTextContent('Faltan 6 lecturas para empezar a evaluar.')
  })

  it('con un backend que todavía no informa los faltantes, igual muestra el mensaje', async () => {
    await guardarLote({
      inmueble_id: 1, cantidad_cargadas: 2, lecturas: [],
      detector_activo_por_servicio: { LUZ: false, GAS: false, AGUA: false }
    })

    expect(screen.getByText(/Luz:/).closest('li')).toHaveTextContent(/aún estamos aprendiendo tu patrón/i)
    expect(screen.getByText(/Luz:/).closest('li')).not.toHaveTextContent(/faltan?\s/i)
  })
})
