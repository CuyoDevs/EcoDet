import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'

afterEach(() => {
  window.localStorage.clear()
  window.history.replaceState(null, '', '/') // vuelve a la ruta raíz (sin #)
  vi.restoreAllMocks()
})
