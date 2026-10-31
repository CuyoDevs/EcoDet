import React from 'react'
import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { tokenStorage } from './tokenStorage'
import { AuthProvider, useAuth } from './AuthContext'

const LAURA = { id: 1, nombre: 'Laura Pérez', correo: 'laura@correo.com' }

// Simula un navegador que bloquea el almacenamiento (modo privado estricto, política de la empresa…).
function bloquearAlmacenamiento() {
  const bloqueado = () => {
    throw new Error('almacenamiento bloqueado')
  }
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(bloqueado)
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(bloqueado)
  vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(bloqueado)
}

describe('tokenStorage', () => {
  it('guarda y recupera el token y el usuario', () => {
    tokenStorage.guardar('tok', LAURA)
    expect(tokenStorage.leerToken()).toBe('tok')
    expect(tokenStorage.leerUsuario()).toEqual(LAURA)
  })

  it('guardar sin usuario no deja el usuario de la sesión anterior', () => {
    tokenStorage.guardar('tok1', LAURA)
    tokenStorage.guardar('tok2')
    expect(tokenStorage.leerToken()).toBe('tok2')
    expect(tokenStorage.leerUsuario()).toBeNull()
  })

  it('borrar elimina token y usuario', () => {
    tokenStorage.guardar('tok', LAURA)
    tokenStorage.borrar()
    expect(tokenStorage.leerToken()).toBeNull()
    expect(tokenStorage.leerUsuario()).toBeNull()
  })

  it('un usuario guardado con formato corrupto se ignora en vez de romper la pantalla', () => {
    window.localStorage.setItem('ecodet.usuario', '{no es json')
    expect(tokenStorage.leerUsuario()).toBeNull()
  })

  it('con el almacenamiento bloqueado nada lanza error: se lee vacío y guardar/borrar no hacen nada', () => {
    bloquearAlmacenamiento()
    expect(tokenStorage.leerToken()).toBeNull()
    expect(tokenStorage.leerUsuario()).toBeNull()
    expect(() => tokenStorage.guardar('tok', LAURA)).not.toThrow()
    expect(() => tokenStorage.borrar()).not.toThrow()
  })
})

describe('sesión con el almacenamiento bloqueado', () => {
  it('iniciar y cerrar sesión siguen funcionando en memoria hasta recargar la página', () => {
    bloquearAlmacenamiento()
    let ctx
    function Espia() {
      ctx = useAuth()
      return <p>{ctx.estaAutenticado ? `hola ${ctx.usuario?.nombre}` : 'anónimo'}</p>
    }
    render(<AuthProvider><Espia /></AuthProvider>)

    act(() => ctx.login('tok', LAURA))
    expect(screen.getByText('hola Laura Pérez')).toBeInTheDocument()

    act(() => ctx.logout())
    expect(screen.getByText('anónimo')).toBeInTheDocument()
  })
})
