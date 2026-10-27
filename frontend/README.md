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
| `src/api/auth.js` | Llamadas de autenticación. Hoy: `registrar()`. HU-03 agrega `iniciarSesion()` acá. |
| `src/auth/AuthContext.jsx` | `<AuthProvider>` y el hook `useAuth()`. |
| `src/auth/tokenStorage.js` | Dónde se guarda la sesión (hoy `localStorage`, así sobrevive a recargar la página). |

### Usar la sesión en un componente

```jsx
import { useAuth } from '../auth/AuthContext'

const { usuario, token, estaAutenticado, login, logout } = useAuth()
```

- `login(token, usuario)`: guarda la sesión. Los endpoints de registro y login devuelven `{ access_token, usuario }`, así que se usa `login(datos.access_token, datos.usuario)`.
- `logout()`: borra token y usuario. No existe endpoint de logout: el JWT no se guarda en el servidor, alcanza con descartarlo.
- Si la API responde **401 con un token enviado** (vencido o inválido), `apiFetch` llama solo a `logout()`. Un 401 sin token (ej.: contraseña mal en el login) **no** cierra nada.

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

- `pages/AccesoPage.jsx` · vista **W1** con dos pestañas. HU-02 trae la de **Registrarse** (`components/RegistroForm.jsx`). DET-39 agrega `LoginForm.jsx` en el mismo componente.
- `components/PanelVacio.jsx` · estado vacío del panel **W2**. DET-40 lo muestra cuando la lista de inmuebles está vacía.
- `pages/PanelInmuebles.jsx` · **provisorio**: DET-40 lo reemplaza con las rutas privadas y DET-43 con el botón "Cerrar sesión" definitivo.

## Pruebas

`npm test` corre vitest + Testing Library (jsdom). Los archivos `*.test.jsx` viven al lado del código que prueban.
