import React from 'react'
import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { AuthProvider, useAuth } from './AuthContext'

let ctx
function Espia() {
  ctx = useAuth()
  return <p>{ctx.estaAutenticado ? `hola ${ctx.usuario?.nombre}` : 'anónimo'}</p>
}
const montar = () => render(<AuthProvider><Espia /></AuthProvider>)

describe('AuthContext', () => {
  it('arranca sin sesión', () => {
    montar()
    expect(screen.getByText('anónimo')).toBeInTheDocument()
    expect(ctx.token).toBeNull()
  })

  it('login guarda token y usuario', () => {
    montar()
    act(() => ctx.login('tok', { id: 1, nombre: 'Laura' }))
    expect(screen.getByText('hola Laura')).toBeInTheDocument()
    expect(ctx.token).toBe('tok')
    expect(window.localStorage.getItem('ecodet.token')).toBe('tok')
  })

  it('la sesión se conserva al recargar la página', () => {
    const primera = montar()
    act(() => ctx.login('tok', { id: 1, nombre: 'Laura' }))
    primera.unmount()

    montar() // equivale a recargar: un provider nuevo lee del almacenamiento
    expect(screen.getByText('hola Laura')).toBeInTheDocument()
    expect(ctx.token).toBe('tok')
  })

  it('logout borra el token y el usuario', () => {
    montar()
    act(() => ctx.login('tok', { id: 1, nombre: 'Laura' }))
    act(() => ctx.logout())
    expect(screen.getByText('anónimo')).toBeInTheDocument()
    expect(window.localStorage.getItem('ecodet.token')).toBeNull()
    expect(window.localStorage.getItem('ecodet.usuario')).toBeNull()
  })

  it('useAuth fuera del provider avisa con un error claro', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {}) // React loguea el error esperado
    const ocultar = (e) => e.preventDefault()
    window.addEventListener('error', ocultar)
    expect(() => render(<Espia />)).toThrow(/AuthProvider/)
    window.removeEventListener('error', ocultar)
  })
})
