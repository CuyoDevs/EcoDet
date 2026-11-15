// Textos del estado "aprendiendo" (HU-14 · RN-07): se comparten entre la carga de lecturas (W3) y el historial (W4)
// para que el usuario lea siempre lo mismo. El mínimo de lecturas lo decide el backend (config.json); acá no se fija.

export const MENSAJE_APRENDIENDO = 'Aún estamos aprendiendo tu patrón.'

export const NOMBRES_SERVICIO = { LUZ: 'luz', GAS: 'gas', AGUA: 'agua' }

// "Falta 1 lectura" / "Faltan 3 lecturas"
export function textoLecturasFaltantes(faltantes) {
  return faltantes === 1 ? 'Falta 1 lectura' : `Faltan ${faltantes} lecturas`
}
