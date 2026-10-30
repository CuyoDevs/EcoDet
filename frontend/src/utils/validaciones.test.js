import { describe, it, expect } from 'vitest'
import { validarLogin } from './validaciones'

describe('validarLogin (CU-02)', () => {
  it('sin errores cuando ambos campos tienen contenido', () => {
    expect(validarLogin({ correo: 'laura@correo.com', contrasena: 'Clave1234' })).toEqual({})
  })

  it('marca cada campo vacío con su propio mensaje', () => {
    expect(validarLogin({ correo: '', contrasena: '' })).toEqual({
      correo: 'Ingresa tu correo.',
      contrasena: 'Ingresa tu contraseña.'
    })
  })

  it('un correo de solo espacios está vacío; una contraseña de solo espacios no', () => {
    expect(validarLogin({ correo: '  ', contrasena: ' ' })).toEqual({ correo: 'Ingresa tu correo.' })
  })

  it('no aplica el formato de correo ni las reglas de contraseña del registro', () => {
    expect(validarLogin({ correo: 'sin-arroba', contrasena: 'abc' })).toEqual({})
  })
})
