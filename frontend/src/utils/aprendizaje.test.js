import { describe, it, expect } from 'vitest'
import { MENSAJE_APRENDIENDO, NOMBRES_SERVICIO, textoLecturasFaltantes } from './aprendizaje'

describe('textos del estado "aprendiendo" (HU-14)', () => {
  it('el mensaje principal es el del criterio de aceptación', () => {
    expect(MENSAJE_APRENDIENDO).toMatch(/aún estamos aprendiendo tu patrón/i)
  })

  it.each([
    [1, 'Falta 1 lectura'],
    [2, 'Faltan 2 lecturas'],
    [5, 'Faltan 5 lecturas']
  ])('con %i faltantes dice "%s"', (faltantes, esperado) => {
    expect(textoLecturasFaltantes(faltantes)).toBe(esperado)
  })

  it('nombra cada servicio en minúscula para armar frases', () => {
    expect(NOMBRES_SERVICIO).toEqual({ LUZ: 'luz', GAS: 'gas', AGUA: 'agua' })
  })
})
