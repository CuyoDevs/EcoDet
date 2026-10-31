# QA · HU-03 Iniciar sesión (DET-11)

> **Quién prueba:** alguien que **no** escribió el código de HU-03.
> **Antes de empezar:** backend en `:8000` y frontend en `:5173` (ver README). Hacen falta dos cuentas: registrar `laura@correo.com` (contraseña `Clave1234`) y `carlos@correo.com` (contraseña `Otra12345`) desde la pestaña **Registrarse**, y cerrar sesión. Para repetir desde cero, borrar `backend/ecodet.db` con el backend detenido.
> La columna "Auto" indica si el criterio ya está cubierto por una prueba automática; **igual se prueba a mano** (el DoD lo exige).

## Criterios de aceptación (los tres de HU-03)

| # | Dado / Cuando / Entonces | Pasos a mano | Auto | Resultado |
| :-: | :--- | :--- | :-: | :-: |
| 1 | **Credenciales correctas.** Con un correo y una contraseña registrados → entro y veo mi panel de inmuebles. | 1. Abrir `http://localhost:5173`: debe abrir en la pestaña **Iniciar sesión**.<br>2. Correo `laura@correo.com`, contraseña `Clave1234`, clic en **Entrar**.<br>3. Verificar: se ve **Mis inmuebles** con el nombre de Laura y la dirección termina en `#/inmuebles`.<br>4. Probar también con `LAURA@Correo.com` (mayúsculas): también entra.<br>5. Recargar (F5): sigue la sesión y se ve el panel. | `test_login_correcto…`, `test_el_correo_se_normaliza…`, `LoginForm.test.jsx`, `App.test.jsx`, `Rutas.test.jsx` | ☐ |
| 2 | **Credenciales incorrectas.** El mensaje es genérico: no dice si falló el correo o la contraseña. | 1. Cerrar sesión.<br>2. Correo `laura@correo.com` con contraseña `Equivocada1` → aviso **Correo o contraseña incorrectos.**<br>3. Correo `nadie@correo.com` con contraseña `Clave1234` → **el mismo aviso**, palabra por palabra.<br>4. Correo `sin-arroba` con contraseña `abc` → también el mismo aviso (el login no revela reglas de formato).<br>5. Verificar que en ningún caso se ve el panel, que no se marca ningún campo en rojo y que lo escrito se conserva. | `test_credenciales_incorrectas…`, `test_el_error_es_identico…`, `LoginForm.test.jsx` | ☐ |
| 3 | **Campos vacíos.** La validación aparece debajo de cada campo y no se envía el formulario. | 1. Con el formulario vacío, clic en **Entrar** → **Ingresa tu correo.** y **Ingresa tu contraseña.**, cada uno debajo de su campo, con ícono.<br>2. Completar solo el correo → queda solo el error de la contraseña.<br>3. Un correo de solo espacios cuenta como vacío.<br>4. Escribir en un campo: su error desaparece.<br>5. En la pestaña **Red** de las herramientas del navegador: no sale ninguna petición mientras haya campos vacíos. | `test_campos_vacios…`, `LoginForm.test.jsx`, `validaciones.test.js` | ☐ |

> Nota para QA del criterio 1: todavía no existen inmuebles (llegan con HU-05). Hoy el panel se ve vacío, con la invitación a crear el primero. **Repetir este criterio cuando HU-05 esté mergeada** y comprobar que cada cuenta ve solo sus inmuebles (RN-01).

## Comprobaciones de apoyo (no son criterios de HU-03, pero dependen de esta entrega)

| # | Qué se comprueba | Pasos a mano | Auto | Resultado |
| :-: | :--- | :--- | :-: | :-: |
| A | **Rutas públicas y privadas (DET-40).** Sin sesión no se entra al panel; con sesión no se vuelve al formulario. | 1. Sin sesión, escribir en la barra `http://localhost:5173/#/inmuebles` → se vuelve a `#/acceso` sin ver el panel.<br>2. Iniciar sesión y escribir `http://localhost:5173/#/acceso` → se vuelve al panel.<br>3. Cerrar sesión desde el panel → vuelve al acceso; con el botón **Atrás** del navegador no se vuelve al panel. | `Rutas.test.jsx` | ☐ |
| B | **Token vencido o alterado.** Una sesión guardada que ya no vale no deja ver el panel. | 1. Iniciar sesión.<br>2. Herramientas del navegador → Aplicación → Almacenamiento local → cambiar una letra del valor de `ecodet.token`.<br>3. Recargar (F5): se ve un instante "Verificando tu sesión…" y se llega al acceso, con el token ya borrado. | `Rutas.test.jsx`, `test_token_con_firma_adulterada…`, `test_token_vencido…` | ☐ |
| C | **Servidor caído.** Una caída del backend no expulsa a nadie ni se confunde con credenciales incorrectas. | 1. Iniciar sesión.<br>2. Detener el backend y recargar (F5): se sigue viendo el panel.<br>3. Con el backend detenido, cerrar sesión e intentar iniciar sesión: aviso **Ocurrió un error inesperado (500). Inténtalo de nuevo.** (en desarrollo, el proxy de Vite responde 500 si el backend está apagado). Nunca debe verse el aviso de credenciales ni el panel.<br>4. Volver a levantar el backend: el login funciona sin recargar nada más. | `Rutas.test.jsx`, `LoginForm.test.jsx` | ☐ |
| D | **Aislamiento (RN-01).** Una cuenta no ve rastros de otra. | 1. Entrar como Laura, cerrar sesión, entrar como Carlos.<br>2. Verificar que el panel muestra a Carlos y que el formulario no recuerda a Laura. | `test_cada_cuenta_entra…`, `App.test.jsx` | ☐ |

## Registro de ejecución

> Lo completa quien hace QA al terminar. Marcar cada resultado con ☑ (pasa) o ☒ (falla); si falla, anotar en **Observaciones** el paso, lo que se esperaba y lo que pasó.

| Dato | Valor |
| :--- | :--- |
| Quién probó (no escribió el código de HU-03) | |
| Fecha | |
| Versión probada (`git rev-parse --short HEAD` en `main`) | |
| Navegador y sistema operativo | |
| `python -m pytest backend/tests/` (desde la raíz) | ☐ pasa — ___ pruebas |
| `npm test` (en `frontend`) | ☐ pasa — ___ pruebas |
| `npm run build` (en `frontend`) | ☐ compila |

## Definition of Done del equipo

- ☐ El código está en GitHub y pasó por un pull request **revisado y aprobado por al menos un compañero** (nadie aprueba su propio PR).
- ☐ **Squash and merge** y rama borrada.
- ☐ `python -m pytest backend/tests/` pasa (desde la raíz del repo).
- ☐ `npm test` y `npm run build` pasan (dentro de `frontend`).
- ☐ No hay contraseñas, claves ni `.env` en el cambio (`git diff main --stat` y revisar). Ojo: `backend/ecodet.db` no debe estar versionado.
- ☐ El mensaje de error del login es genérico y coincide con el caso de uso CU-02.
- ☐ README / ayuda actualizados (`frontend/README.md` documenta el cliente de API, la sesión y las rutas).
- ☐ El **Product Owner** aceptó el ticket y Jira pasó a **Hecho**.

## Observaciones del QA

_(anotar acá lo que se encuentre)_
