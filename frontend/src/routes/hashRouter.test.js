import { describe, it, expect } from 'vitest'
import { irA, rutaActual } from './hashRouter'

describe('hashRouter', () => {
  it('sin hash la ruta es la raíz', () => {
    expect(rutaActual()).toBe('/')
  })

  it('lee la ruta que viene después del #', () => {
    window.location.hash = '#/inmuebles/nuevo'
    expect(rutaActual()).toBe('/inmuebles/nuevo')
  })

  it('un ancla que no es una ruta (#seccion) cuenta como la raíz', () => {
    window.location.hash = '#seccion'
    expect(rutaActual()).toBe('/')
  })

  it('irA navega y deja una entrada nueva en el historial (el botón "atrás" vuelve)', () => {
    const antes = window.history.length
    irA('/inmuebles')
    expect(window.location.hash).toBe('#/inmuebles')
    expect(window.history.length).toBe(antes + 1)
  })

  it('irA con reemplazar cambia la ruta SIN agregar entrada (así "atrás" no vuelve a la ruta redirigida)', () => {
    const antes = window.history.length
    irA('/acceso', { reemplazar: true })
    expect(window.location.hash).toBe('#/acceso')
    expect(window.history.length).toBe(antes)
  })
})
