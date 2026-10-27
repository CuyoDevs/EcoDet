// Único lugar que sabe DÓNDE se guarda la sesión. Hoy: localStorage (sobrevive a recargar la página).
// Si el equipo prefiere que la sesión muera al cerrar la pestaña, alcanza con cambiar
// `almacen()` para que devuelva window.sessionStorage.
const CLAVE_TOKEN = 'ecodet.token'
const CLAVE_USUARIO = 'ecodet.usuario'

function almacen() {
  return window.localStorage
}

export const tokenStorage = {
  leerToken() {
    try {
      return almacen().getItem(CLAVE_TOKEN)
    } catch {
      return null
    }
  },
  leerUsuario() {
    try {
      const crudo = almacen().getItem(CLAVE_USUARIO)
      return crudo ? JSON.parse(crudo) : null
    } catch {
      return null
    }
  },
  guardar(token, usuario = null) {
    try {
      almacen().setItem(CLAVE_TOKEN, token)
      if (usuario) almacen().setItem(CLAVE_USUARIO, JSON.stringify(usuario))
      else almacen().removeItem(CLAVE_USUARIO)
    } catch {
      /* almacenamiento bloqueado: la sesión dura hasta recargar */
    }
  },
  borrar() {
    try {
      almacen().removeItem(CLAVE_TOKEN)
      almacen().removeItem(CLAVE_USUARIO)
    } catch {
      /* nada que borrar */
    }
  }
}
