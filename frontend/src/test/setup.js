import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'

// 1. Creamos un mock robusto para asegurar que localStorage funcione siempre
const localStorageMock = (() => {
  let store = {}
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = String(value) },
    clear: () => { store = {} },
    removeItem: (key) => { delete store[key] },
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

// 2. Limpieza de cada test se mantiene igual
afterEach(() => {
  window.localStorage.clear()
  window.history.replaceState(null, '', '/') // vuelve a la ruta raíz (sin #)
  vi.restoreAllMocks()
})