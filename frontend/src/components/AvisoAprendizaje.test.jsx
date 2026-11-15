import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import AvisoAprendizaje from './AvisoAprendizaje'

const aprendiendo = (faltantes) => ({ estado: 'aprendiendo', motivo: 'lecturas_insuficientes', lecturas_registradas: 6 - faltantes, lecturas_faltantes: faltantes })

describe('AvisoAprendizaje (W3 · HU-14)', () => {
  it('explica que todavía se está aprendiendo, cuántas lecturas faltan y que no hay alertas', () => {
    render(<AvisoAprendizaje servicio="LUZ" evaluacion={aprendiendo(5)} />)

    const aviso = screen.getByRole('status')
    expect(aviso).toHaveTextContent(/aún estamos aprendiendo tu patrón/i)
    expect(aviso).toHaveTextContent('Faltan 5 lecturas de luz')
    expect(aviso).toHaveTextContent(/no se generan alertas/i)
  })

  it('usa el singular cuando falta una sola lectura', () => {
    render(<AvisoAprendizaje servicio="GAS" evaluacion={aprendiendo(1)} />)
    expect(screen.getByRole('status')).toHaveTextContent('Falta 1 lectura de gas')
  })

  it.each([
    ['LUZ', 'de luz'],
    ['GAS', 'de gas'],
    ['AGUA', 'de agua']
  ])('nombra el servicio %s', (servicio, esperado) => {
    render(<AvisoAprendizaje servicio={servicio} evaluacion={aprendiendo(3)} />)
    expect(screen.getByRole('status')).toHaveTextContent(esperado)
  })

  it('si el backend no informa los faltantes, igual muestra el mensaje sin inventar un número', () => {
    render(<AvisoAprendizaje servicio="LUZ" evaluacion={{ estado: 'aprendiendo' }} />)
    const aviso = screen.getByRole('status')
    expect(aviso).toHaveTextContent(/aún estamos aprendiendo tu patrón/i)
    expect(aviso).not.toHaveTextContent(/faltan?\s/i)
  })

  it.each(['dentro', 'alta', 'baja'])('con el estado "%s" no muestra nada (el aviso desaparece)', (estado) => {
    const { container } = render(<AvisoAprendizaje servicio="LUZ" evaluacion={{ estado, lecturas_faltantes: 0 }} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('sin evaluación no muestra nada', () => {
    const { container } = render(<AvisoAprendizaje servicio="LUZ" evaluacion={undefined} />)
    expect(container).toBeEmptyDOMElement()
  })
})
