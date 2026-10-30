// Mismas reglas que el backend (backend/app/schemas.py). El servidor siempre valida de nuevo.
const CORREO_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/

export const AYUDA_CONTRASENA = 'mín. 8, letras y números'

export function validarNombre(valor) {
  const nombre = valor.trim()
  if (!nombre) return 'El nombre no puede estar vacío.'
  if (nombre.length > 100) return 'El nombre no puede superar los 100 caracteres.'
  return null
}

export function validarCorreo(valor) {
  const correo = valor.trim()
  if (!correo) return 'Ingresa tu correo.'
  if (correo.length > 255 || !CORREO_RE.test(correo)) return 'Ingresa un correo válido (por ejemplo, nombre@correo.com).'
  return null
}

export function validarContrasena(valor) {
  if (!valor) return 'Ingresa una contraseña.'
  if (valor.length < 8 || !/\p{L}/u.test(valor) || !/\d/.test(valor)) {
    return 'La contraseña debe tener al menos 8 caracteres, con letras y números.'
  }
  if (new TextEncoder().encode(valor).length > 72) return 'La contraseña es demasiado larga (máximo 72 bytes).'
  return null
}

// Devuelve { campo: mensaje } solo con los campos inválidos.
export function validarRegistro({ nombre, correo, contrasena }) {
  const errores = {}
  const e = { nombre: validarNombre(nombre), correo: validarCorreo(correo), contrasena: validarContrasena(contrasena) }
  for (const [campo, mensaje] of Object.entries(e)) if (mensaje) errores[campo] = mensaje
  return errores
}

// Login (CU-02): solo se exige que los campos no estén vacíos. A propósito NO se valida el formato del
// correo ni las reglas de contraseña: así el login no revela la política de contraseñas y cualquier dato
// incorrecto recibe el mismo error genérico del servidor (ver LoginIn en backend/app/schemas.py).
export function validarLogin({ correo, contrasena }) {
  const errores = {}
  if (!correo.trim()) errores.correo = 'Ingresa tu correo.'
  if (!contrasena) errores.contrasena = 'Ingresa tu contraseña.'
  return errores
}
