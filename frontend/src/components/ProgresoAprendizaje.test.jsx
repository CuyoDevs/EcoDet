import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ProgresoAprendizaje from './ProgresoAprendizaje'

describe('ProgresoAprendizaje (W4 · HU-14)', () => {
  it('muestra una barra de progreso accesible con "4 de 6 lecturas"', () => {
    render(<ProgresoAprendizaje registradas={4} faltantes={2} />)

    const barra = screen.getByRole('progressbar', { name: 'Progreso del aprendizaje' })
    expect(barra).toHaveAttribute('aria-valuenow', '4')
    expect(barra).toHaveAttribute('aria-valuemin', '0')
    expect(barra).toHaveAttribute('aria-valuemax', '6')
    expect(barra).toHaveAttribute('aria-valuetext', '4 de 6 lecturas')
    expect(screen.getByText('4 de 6 lecturas')).toBeInTheDocument()
  })

  it('el progreso se dice con texto, no solo con color', () => {
    render(<ProgresoAprendizaje registradas={4} faltantes={2} />)
    expect(screen.getByText(/aún estamos aprendiendo tu patrón/i)).toBeInTheDocument()
    expect(screen.getByText('Faltan 2 lecturas para activar las alertas.')).toBeInTheDocument()
  })

  it('el relleno de la barra es proporcional a lo registrado', () => {
    render(<ProgresoAprendizaje registradas={3} faltantes={3} />)
    expect(screen.getByRole('progressbar').firstChild).toHaveStyle({ width: '50%' })
  })

  it('usa el singular cuando falta una lectura', () => {
    render(<ProgresoAprendizaje registradas={5} faltantes={1} />)
    expect(screen.getByText('Falta 1 lectura para activar las alertas.')).toBeInTheDocument()
    expect(screen.getByRole('progressbar').firstChild).toHaveStyle({ width: '83%' })
  })

  it('el total sale de lo que informa el backend (no está fijado en 6)', () => {
    render(<ProgresoAprendizaje registradas={2} faltantes={1} />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '3')
    expect(screen.getByText('2 de 3 lecturas')).toBeInTheDocument()
  })

  it.each([0, undefined, null])('con faltantes = %s no se muestra (el detector ya está activo o no hay dato)', (faltantes) => {
    const { container } = render(<ProgresoAprendizaje registradas={6} faltantes={faltantes} />)
    expect(container).toBeEmptyDOMElement()
  })
})
