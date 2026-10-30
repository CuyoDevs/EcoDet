# EcoDet · Frontend (React + Vite)

```bash
npm install
npm run dev     # http://localhost:5173  (el proxy de Vite reenvía /api al backend en :8000)
npm test        # pruebas automáticas (vitest)
npm run build
```

Si el backend corre en otra dirección, crear `frontend/.env` con `VITE_API_URL=http://host:puerto`.

## Cliente de API y sesión (base de HU-02, HU-03 y HU-04)

| Archivo | Para qué sirve |
| :--- | :--- |
| `src/api/client.js` | `apiFetch(path, { method, body })`: un único cliente HTTP. Agrega solo `Authorization: Bearer <token>` y lanza `ApiError` con `status`, `message` y `errores` (`{ campo: mensaje }` en los 422). `status === 0` significa sin conexión. |
| `src/api/auth.js` | Llamadas de autenticación: `registrar()`, `iniciarSesion()` y `obtenerUsuarioActual()` (`GET /api/auth/me`). |
| `src/auth/AuthContext.jsx` | `<AuthProvider>` y el hook `useAuth()`. |
| `src/auth/tokenStorage.js` | Dónde se guarda la sesión (hoy `localStorage`, así sobrevive a recargar la página). |
| `src/auth/useSesionVerificada.js` | Al abrir la página con un token guardado, lo confirma con `GET /api/auth/me` antes de mostrar el panel. Lo usa `Rutas`; no hace falta llamarlo en otros componentes. |

### Usar la sesión en un componente

```jsx
import { useAuth } from '../auth/AuthContext'

const { usuario, token, estaAutenticado, login, logout } = useAuth()
```

- `login(token, usuario)`: guarda la sesión. Los endpoints de registro y login devuelven `{ access_token, usuario }`, así que se usa `login(datos.access_token, datos.usuario)`.
- `logout()`: borra token y usuario. No existe endpoint de logout: el JWT no se guarda en el servidor, alcanza con descartarlo.
- Si la API responde **401 con un token enviado** (vencido o inválido), `apiFetch` llama solo a `logout()`. Un 401 sin token (ej.: contraseña mal en el login) **no** cierra nada.

### Rutas públicas y privadas

`src/routes/Rutas.jsx` decide qué pantalla se ve según la ruta (con `#`, sin librería de rutas) y la sesión:

| Ruta | Tipo | Con sesión | Sin sesión |
| :--- | :--- | :--- | :--- |
| `#/acceso` | pública (W1) | redirige a `#/inmuebles` | se muestra el login / registro |
| `#/inmuebles` y `#/inmuebles/...` | privada (W2) | se muestra el panel | redirige a `#/acceso` |
| cualquier otra | — | redirige a `#/inmuebles` | redirige a `#/acceso` |

- Iniciar sesión, registrarse y cerrar sesión **solo cambian el estado** de `useAuth()`: no hay que navegar a mano, `Rutas` redirige solo.
- Para una pantalla privada nueva, colgarla de `/inmuebles/...` o agregarla a `esRutaPrivada()`.
- Al recargar con un token guardado se ve "Verificando tu sesión…" hasta que `/api/auth/me` responde. Si el token venció, se vuelve al acceso; si no hay conexión, se conserva la sesión.

### Llamar a un endpoint protegido

```js
import { apiFetch } from '../api/client'
const inmuebles = await apiFetch('/api/inmuebles')   // ya lleva el token
```

### Mostrar errores de formulario

```js
try { await registrar(datos) }
catch (err) {
  if (err.status === 422) setErrores(err.errores)   // { correo: '...', contrasena: '...' }
  else if (err.status === 409) /* conflicto: err.message */
  else /* err.message sirve como mensaje general */
}
```

`src/components/CampoFormulario.jsx` ya pinta etiqueta + input + error debajo (con ícono y texto, no solo color), listo para reutilizar en el login y en los formularios de inmuebles y lecturas.

## Pantallas

- `routes/Rutas.jsx` · rutas públicas y privadas con redirección (ver arriba).
- `pages/AccesoPage.jsx` · vista **W1** con dos pestañas, abre en **Iniciar sesión** (`components/LoginForm.jsx`, HU-03) y tiene **Registrarse** (`components/RegistroForm.jsx`, HU-02).
- `components/PanelVacio.jsx` · estado vacío del panel **W2**, que se muestra mientras la lista de inmuebles esté vacía.
- `pages/PanelInmuebles.jsx` · **provisorio**: es privado (lo protege `Rutas`), pero el listado real llega con HU-05 y el botón "Cerrar sesión" definitivo con DET-43.

## Pruebas

`npm test` corre vitest + Testing Library (jsdom). Los archivos `*.test.jsx` viven al lado del código que prueban.
