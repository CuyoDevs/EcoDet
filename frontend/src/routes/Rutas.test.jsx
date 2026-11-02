import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, afterEach } from 'vitest'
import App from '../App'
import { RUTA_ACCESO, RUTA_PANEL, destinoDeRedireccion, esRutaPrivada } from './Rutas'

// Acá NO se mockea ./api/auth: se usa el apiFetch real con un fetch simulado, para probar también
// que un token vencido (401) cierra la sesión sola.
const LAURA = { id: 1, nombre: 'Laura Pérez', correo: 'laura@correo.com' }

function respuesta(status, cuerpo) {
  return Promise.resolve({ ok: status >= 200 && status < 300, status, json: () => Promise.resolve(cuerpo) })
}

// rutas: { 'GET /api/auth/me': (opciones) => respuesta(...) }
function simularApi(rutas) {
  const fetchMock = vi.fn((url, opciones = {}) => {
    const manejador = rutas[`${opciones.method ?? 'GET'} ${url}`]
    return manejador ? manejador(opciones) : respuesta(404, { detail: 'No encontrado' })
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

// El panel también pide GET /api/inmuebles/ (HU-05): estas pruebas cuentan solo las llamadas de autenticación.
const llamadasDeAuth = (fetchMock) => fetchMock.mock.calls.filter(([url]) => url.startsWith('/api/auth/'))

const guardarSesion = (usuario = LAURA) => {
  window.localStorage.setItem('ecodet.token', 'tok-guardado')
  window.localStorage.setItem('ecodet.usuario', JSON.stringify(usuario))
}
const panel = () => screen.queryByRole('heading', { name: 'Mis inmuebles' })

afterEach(() => vi.unstubAllGlobals())

describe('destinoDeRedireccion (reglas puras)', () => {
  it.each([
    ['sin sesión', '/inmuebles', false, RUTA_ACCESO],
    ['sin sesión', '/inmuebles/nuevo', false, RUTA_ACCESO],
    ['sin sesión', '/', false, RUTA_ACCESO],
    ['sin sesión', '/ruta-inventada', false, RUTA_ACCESO],
    ['sin sesión', '/acceso', false, null],
    ['con sesión', '/acceso', true, RUTA_PANEL],
    ['con sesión', '/', true, RUTA_PANEL],
    ['con sesión', '/ruta-inventada', true, RUTA_PANEL],
    ['con sesión', '/inmuebles', true, null],
    ['con sesión', '/inmuebles/nuevo', true, null]
  ])('%s en %s → %s', (_caso, ruta, autenticado, esperado) => {
    expect(destinoDeRedireccion(ruta, autenticado)).toBe(esperado)
  })

  it('solo /inmuebles y lo que cuelga de él es privado', () => {
    expect(esRutaPrivada('/inmuebles')).toBe(true)
    expect(esRutaPrivada('/inmuebles/3/editar')).toBe(true)
    expect(esRutaPrivada('/inmuebles-falso')).toBe(false)
    expect(esRutaPrivada('/acceso')).toBe(false)
  })
})

describe('Rutas privadas sin sesión', () => {
  it('entrar a #/inmuebles sin sesión redirige al acceso y nunca muestra el panel', async () => {
    window.location.hash = '#/inmuebles'
    render(<App />)

    expect(panel()).not.toBeInTheDocument()
    expect(await screen.findByRole('tab', { name: 'Iniciar sesión' })).toHaveAttribute('aria-selected', 'true')
    expect(panel()).not.toBeInTheDocument()
    expect(window.location.hash).toBe('#/acceso')
  })

  it('abrir la raíz sin sesión lleva al acceso', async () => {
    render(<App />)
    expect(await screen.findByRole('tab', { name: 'Iniciar sesión' })).toBeInTheDocument()
    expect(window.location.hash).toBe('#/acceso')
  })

  it('no se hace ninguna llamada a la API si no hay token guardado', async () => {
    const fetchMock = simularApi({})
    render(<App />)
    await screen.findByRole('tab', { name: 'Iniciar sesión' })
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('Sesión guardada al abrir o recargar la página', () => {
  it('con un token válido: muestra "Verificando…", confirma con /api/auth/me y entra al panel', async () => {
    guardarSesion()
    const fetchMock = simularApi({
      'GET /api/auth/me': () => respuesta(200, LAURA),
      'GET /api/inmuebles/': () => respuesta(200, [])
    })
    window.location.hash = '#/acceso'
    render(<App />)

    expect(screen.getByRole('status')).toHaveTextContent(/verificando tu sesión/i)
    expect(panel()).not.toBeInTheDocument()

    expect(await screen.findByRole('heading', { name: 'Mis inmuebles' })).toBeInTheDocument()
    expect(window.location.hash).toBe('#/inmuebles')
    const [url, opciones] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/auth/me')
    expect(opciones.headers.Authorization).toBe('Bearer tok-guardado')
    expect(llamadasDeAuth(fetchMock)).toHaveLength(1)
  })

  it('refresca los datos del usuario con los que devuelve el servidor', async () => {
    guardarSesion({ id: 1, nombre: 'Nombre viejo' })
    simularApi({ 'GET /api/auth/me': () => respuesta(200, LAURA) })
    render(<App />)

    expect(await screen.findByRole('heading', { name: /laura pérez/i })).toBeInTheDocument()
    expect(JSON.parse(window.localStorage.getItem('ecodet.usuario'))).toEqual(LAURA)
    expect(window.localStorage.getItem('ecodet.token')).toBe('tok-guardado')
  })

  it('con un token vencido o inválido (401): no muestra el panel, cierra la sesión y vuelve al acceso', async () => {
    guardarSesion()
    simularApi({ 'GET /api/auth/me': () => respuesta(401, { detail: 'Tu sesión no es válida o venció. Inicia sesión de nuevo.' }) })
    window.location.hash = '#/inmuebles'
    render(<App />)

    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(await screen.findByRole('tab', { name: 'Iniciar sesión' })).toBeInTheDocument()
    expect(panel()).not.toBeInTheDocument()
    expect(window.localStorage.getItem('ecodet.token')).toBeNull()
    expect(window.localStorage.getItem('ecodet.usuario')).toBeNull()
    expect(window.location.hash).toBe('#/acceso')
  })

  it('sin conexión no se expulsa a nadie: se conserva la sesión y se ve el panel', async () => {
    guardarSesion()
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))))
    render(<App />)

    expect(await screen.findByRole('heading', { name: 'Mis inmuebles' })).toBeInTheDocument()
    expect(window.localStorage.getItem('ecodet.token')).toBe('tok-guardado')
  })

  it('un error 500 del servidor tampoco cierra la sesión', async () => {
    guardarSesion()
    simularApi({ 'GET /api/auth/me': () => respuesta(500, null) })
    render(<App />)

    expect(await screen.findByRole('heading', { name: 'Mis inmuebles' })).toBeInTheDocument()
    expect(window.localStorage.getItem('ecodet.token')).toBe('tok-guardado')
  })

  it('con sesión, las rutas anidadas de /inmuebles se respetan (no se redirige)', async () => {
    guardarSesion()
    simularApi({ 'GET /api/auth/me': () => respuesta(200, LAURA) })
    window.location.hash = '#/inmuebles/nuevo'
    render(<App />)

    expect(await screen.findByRole('heading', { name: 'Mis inmuebles' })).toBeInTheDocument()
    expect(window.location.hash).toBe('#/inmuebles/nuevo')
  })
})

describe('Iniciar y cerrar sesión desde la interfaz', () => {
  it('login correcto: llama a /api/auth/login con el cuerpo esperado, entra al panel y no vuelve a verificar', async () => {
    const fetchMock = simularApi({
      'POST /api/auth/login': () => respuesta(200, { access_token: 'tok-nuevo', token_type: 'bearer', usuario: LAURA }),
      'GET /api/inmuebles/': () => respuesta(200, [])
    })
    const user = userEvent.setup()
    render(<App />)

    await user.type(await screen.findByLabelText('Correo'), 'laura@correo.com')
    await user.type(screen.getByLabelText('Contraseña'), 'Clave1234')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByRole('heading', { name: 'Mis inmuebles' })).toBeInTheDocument()
    expect(window.location.hash).toBe('#/inmuebles')
    expect(window.localStorage.getItem('ecodet.token')).toBe('tok-nuevo')

    const [url, opciones] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/auth/login')
    expect(opciones.method).toBe('POST')
    expect(JSON.parse(opciones.body)).toEqual({ correo: 'laura@correo.com', contrasena: 'Clave1234' })
    expect(opciones.headers.Authorization).toBeUndefined()
    expect(llamadasDeAuth(fetchMock)).toHaveLength(1) // sin /me: el token recién emitido ya es válido
  })

  it('login incorrecto: mensaje genérico, sigue en el acceso y no queda nada guardado', async () => {
    simularApi({
      'POST /api/auth/login': () => respuesta(401, { detail: 'Correo o contraseña incorrectos.' })
    })
    const user = userEvent.setup()
    render(<App />)

    await user.type(await screen.findByLabelText('Correo'), 'laura@correo.com')
    await user.type(screen.getByLabelText('Contraseña'), 'Equivocada1')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Correo o contraseña incorrectos.')
    expect(panel()).not.toBeInTheDocument()
    expect(window.location.hash).toBe('#/acceso')
    expect(window.localStorage.getItem('ecodet.token')).toBeNull()
  })

  it('con un 401 al iniciar sesión no se dispara el cierre de sesión automático', async () => {
    // Un 401 SIN token enviado es "credenciales mal", no "sesión vencida" (README · Cliente de API).
    const fetchMock = simularApi({ 'POST /api/auth/login': () => respuesta(401, { detail: 'x' }) })
    const user = userEvent.setup()
    render(<App />)
    await user.type(await screen.findByLabelText('Correo'), 'a@b.com')
    await user.type(screen.getByLabelText('Contraseña'), 'x')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Iniciar sesión' })).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('cerrar sesión vuelve al acceso y la ruta privada deja de estar disponible', async () => {
    guardarSesion()
    simularApi({ 'GET /api/auth/me': () => respuesta(200, LAURA) })
    const user = userEvent.setup()
    render(<App />)

    await user.click(await screen.findByRole('button', { name: /cerrar sesión/i }))
    expect(await screen.findByRole('tab', { name: 'Iniciar sesión' })).toBeInTheDocument()
    expect(window.location.hash).toBe('#/acceso')
    expect(window.localStorage.getItem('ecodet.token')).toBeNull()

    window.location.hash = '#/inmuebles' // intentar volver a la ruta privada sin sesión
    await waitFor(() => expect(window.location.hash).toBe('#/acceso'))
    expect(panel()).not.toBeInTheDocument()
  })
})
