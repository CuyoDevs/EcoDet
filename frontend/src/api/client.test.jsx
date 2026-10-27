import React from 'react'
import { render, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { apiFetch, ApiError } from './client'
import { AuthProvider, useAuth } from '../auth/AuthContext'

function respuesta(status, cuerpo) {
  return Promise.resolve({ ok: status >= 200 && status < 300, status, json: () => Promise.resolve(cuerpo) })
}

describe('apiFetch', () => {
  it('agrega Authorization: Bearer cuando hay token', async () => {
    window.localStorage.setItem('ecodet.token', 'abc')
    const fetchMock = vi.fn(() => respuesta(200, { ok: true }))
    vi.stubGlobal('fetch', fetchMock)
    await apiFetch('/api/algo')
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer abc')
  })

  it('no manda Authorization sin sesión', async () => {
    const fetchMock = vi.fn(() => respuesta(200, {}))
    vi.stubGlobal('fetch', fetchMock)
    await apiFetch('/api/algo')
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined()
  })

  it('envía el body como JSON', async () => {
    const fetchMock = vi.fn(() => respuesta(201, {}))
    vi.stubGlobal('fetch', fetchMock)
    await apiFetch('/api/x', { method: 'POST', body: { a: 1 } })
    const [, opciones] = fetchMock.mock.calls[0]
    expect(opciones.body).toBe('{"a":1}')
    expect(opciones.headers['Content-Type']).toBe('application/json')
  })

  it('convierte los errores en ApiError con status y errores por campo', async () => {
    vi.stubGlobal('fetch', vi.fn(() => respuesta(422, { errores: { correo: 'mal' }, detail: [{ msg: 'mal' }] })))
    const err = await apiFetch('/api/x').catch((e) => e)
    expect(err).toBeInstanceOf(ApiError)
    expect(err.status).toBe(422)
    expect(err.errores).toEqual({ correo: 'mal' })
    expect(err.message).toBe('mal')
  })

  it('sin red lanza ApiError con status 0', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new TypeError('fallo'))))
    const err = await apiFetch('/api/x').catch((e) => e)
    expect(err.status).toBe(0)
    expect(err.message).toMatch(/no se pudo conectar/i)
  })

  it('un 401 con token cierra la sesión sola', async () => {
    let ctx
    const Espia = () => ((ctx = useAuth()), null)
    render(<AuthProvider><Espia /></AuthProvider>)
    act(() => ctx.login('vencido', { id: 1, nombre: 'Laura' }))
    vi.stubGlobal('fetch', vi.fn(() => respuesta(401, { detail: 'Token vencido' })))

    await act(async () => { await apiFetch('/api/privado').catch(() => {}) })
    expect(ctx.estaAutenticado).toBe(false)
  })

  it('un 401 SIN token (ej.: login con credenciales mal) no toca la sesión', async () => {
    let ctx
    const Espia = () => ((ctx = useAuth()), null)
    render(<AuthProvider><Espia /></AuthProvider>)
    vi.stubGlobal('fetch', vi.fn(() => respuesta(401, { detail: 'Credenciales incorrectas' })))
    const err = await apiFetch('/api/auth/login', { method: 'POST', body: {} }).catch((e) => e)
    expect(err.status).toBe(401)
    expect(ctx.estaAutenticado).toBe(false)
  })
})
