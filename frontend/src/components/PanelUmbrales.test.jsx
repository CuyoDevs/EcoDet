import React from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import PanelUmbrales from './PanelUmbrales'
import { guardarUmbral, obtenerUmbrales } from '../api/umbrales'
import { ApiError } from '../api/client'

vi.mock('../api/umbrales', () => ({
  obtenerUmbrales: vi.fn(),
  guardarUmbral: vi.fn(),
}))

const UMBRALES_INICIALES = [
  { servicio: 'LUZ', desvios: 2, personalizado: false },
  { servicio: 'GAS', desvios: 2, personalizado: false },
  { servicio: 'AGUA', desvios: 2, personalizado: false },
]

const INVALIDO = 'Ingresá un número mayor que cero.'

beforeEach(() => {
  obtenerUmbrales.mockReset()
  guardarUmbral.mockReset()
  obtenerUmbrales.mockResolvedValue(UMBRALES_INICIALES)
})

async function campoDeLuz() {
  return screen.findByLabelText('Umbral de Luz (desvíos)')
}

describe('PanelUmbrales · ajustar la sensibilidad (HU-18 / DET-26)', () => {
  it('muestra los tres servicios con el valor inicial de 2 desvíos', async () => {
    render(<PanelUmbrales inmuebleId={1} />)

    expect(await campoDeLuz()).toHaveValue('2,0')
    expect(screen.getByLabelText('Umbral de Gas (desvíos)')).toHaveValue('2,0')
    expect(screen.getByLabelText('Umbral de Agua (desvíos)')).toHaveValue('2,0')
    expect(obtenerUmbrales).toHaveBeenCalledWith(1)
  })

  it('explica que más umbral da menos alertas y que aplica a las próximas lecturas', async () => {
    render(<PanelUmbrales inmuebleId={1} />)
    await campoDeLuz()

    expect(screen.getByText(/umbral mayor genera menos alertas y uno menor, más/i)).toBeInTheDocument()
    expect(screen.getByText(/se aplica a las próximas lecturas/i)).toBeInTheDocument()
  })

  it('guarda un valor válido (con coma decimal) y lo muestra como vigente', async () => {
    const user = userEvent.setup()
    guardarUmbral.mockResolvedValue({ servicio: 'LUZ', desvios: 3.5, personalizado: true })
    render(<PanelUmbrales inmuebleId={1} />)

    const campo = await campoDeLuz()
    await user.clear(campo)
    await user.type(campo, '3,5')
    await user.click(screen.getByRole('button', { name: 'Guardar umbral de Luz' }))

    await waitFor(() => expect(guardarUmbral).toHaveBeenCalledWith(1, 'LUZ', 3.5))
    const fila = within(screen.getByTestId('umbral-LUZ'))
    expect(await fila.findByRole('status')).toHaveTextContent(/guardado: 3,5 desvíos/i)
    expect(fila.getByText('Vigente: 3,5 desvíos')).toBeInTheDocument()
    // Gas no cambió.
    expect(within(screen.getByTestId('umbral-GAS')).getByText('Vigente: 2,0 desvíos')).toBeInTheDocument()
  })

  it.each(['abc', '0', '-1', ''])(
    'rechaza "%s" sin llamar a la API y conserva el umbral vigente',
    async (valor) => {
      const user = userEvent.setup()
      render(<PanelUmbrales inmuebleId={1} />)

      const campo = await campoDeLuz()
      await user.clear(campo)
      if (valor) await user.type(campo, valor)
      await user.click(screen.getByRole('button', { name: 'Guardar umbral de Luz' }))

      const fila = within(screen.getByTestId('umbral-LUZ'))
      expect(await fila.findByRole('alert')).toHaveTextContent(INVALIDO)
      expect(guardarUmbral).not.toHaveBeenCalled()
      expect(fila.getByText('Vigente: 2,0 desvíos')).toBeInTheDocument()
    }
  )

  it('si el servidor rechaza el valor (422) muestra su mensaje y conserva el vigente', async () => {
    const user = userEvent.setup()
    guardarUmbral.mockRejectedValue(
      new ApiError(422, { errores: { desvios: 'El umbral debe ser un número mayor que cero.' } })
    )
    render(<PanelUmbrales inmuebleId={1} />)

    const campo = await campoDeLuz()
    await user.clear(campo)
    await user.type(campo, '5')
    await user.click(screen.getByRole('button', { name: 'Guardar umbral de Luz' }))

    const fila = within(screen.getByTestId('umbral-LUZ'))
    expect(await fila.findByRole('alert')).toHaveTextContent('El umbral debe ser un número mayor que cero.')
    expect(fila.getByText('Vigente: 2,0 desvíos')).toBeInTheDocument()
  })

  it('si no hay conexión muestra el aviso y no cambia el umbral vigente', async () => {
    const user = userEvent.setup()
    guardarUmbral.mockRejectedValue(new ApiError(0, null))
    render(<PanelUmbrales inmuebleId={1} />)

    await user.click(await screen.findByRole('button', { name: 'Guardar umbral de Gas' }))

    const fila = within(screen.getByTestId('umbral-GAS'))
    expect(await fila.findByRole('alert')).toHaveTextContent(/no se pudo conectar con el servidor/i)
    expect(fila.getByText('Vigente: 2,0 desvíos')).toBeInTheDocument()
  })

  it('si el inmueble no existe (404) muestra el error de carga', async () => {
    obtenerUmbrales.mockRejectedValue(new ApiError(404, { errores: { general: 'Inmueble no encontrado.' } }))
    render(<PanelUmbrales inmuebleId={999} />)

    expect(await screen.findByRole('alert')).toHaveTextContent('Inmueble no encontrado.')
  })
})
