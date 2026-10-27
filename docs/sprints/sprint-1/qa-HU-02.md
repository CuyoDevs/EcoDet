# QA · HU-02 Registrarme (DET-10 · subtarea DET-36)

> **Quién prueba:** alguien que **no** escribió el código de HU-02.
> **Antes de empezar:** backend en `:8000` y frontend en `:5173` (ver README). Para repetir las pruebas desde cero, borrar `backend/ecodet.db` con el backend detenido.
> La columna "Auto" indica si el criterio ya está cubierto por una prueba automática; **igual se prueba a mano** (el DoD lo exige).

## Criterios de aceptación (los cuatro de HU-02)

| # | Dado / Cuando / Entonces | Pasos a mano | Auto | Resultado |
| :-: | :--- | :--- | :-: | :-: |
| 1 | **Alta correcta.** Correo no registrado + nombre + correo válido + contraseña de 8+ con letras y números → se crea la cuenta, la contraseña queda cifrada, se inicia mi sesión y veo un panel vacío que me invita a crear mi primer inmueble. | 1. Abrir `http://localhost:5173`, pestaña **Registrarse**.<br>2. Nombre `Laura Pérez`, correo `laura@correo.com`, contraseña `Clave1234`.<br>3. Clic en **Crear cuenta**.<br>4. Verificar: se ve **Mis inmuebles** con tu nombre, el mensaje de bienvenida y el botón **Nuevo inmueble**.<br>5. Recargar la página (F5): la sesión sigue iniciada. | `test_registro_correcto…`, `test_la_contrasena_guardada…`, `App.test.jsx` | ☐ |
| 2 | **Correo repetido.** Correo ya registrado → veo el error, se me ofrece iniciar sesión y no se crea la cuenta. | 1. Cerrar sesión.<br>2. Registrarse otra vez con `laura@correo.com` (probar también `LAURA@CORREO.COM`).<br>3. Verificar: error debajo del correo + enlace **Ir a Iniciar sesión** que cambia de pestaña; no hay sesión iniciada. | `test_correo_repetido…` | ☐ |
| 3 | **Datos faltantes o inválidos.** El sistema indica qué corregir y no crea la cuenta. | 1. Enviar el formulario vacío → 3 errores, uno debajo de cada campo.<br>2. Correo `sin-arroba` → error de correo.<br>3. Contraseñas `abc12` (corta), `soloLetrasAqui`, `123456789` → error de contraseña en cada una.<br>4. Corregir un campo: su error desaparece.<br>5. Verificar que en ningún caso aparece el panel. | `test_contrasena_debil…`, `test_correo_invalido…`, `RegistroForm.test.jsx` | ☐ |
| 4 | **Aislamiento (RN-01).** La cuenta nueva no ve datos de ningún otro usuario. | 1. Registrar una segunda cuenta (`carlos@correo.com`).<br>2. Verificar que el panel está vacío y no aparece nada de Laura. | `test_cada_cuenta_recibe_su_propia_identidad…` | ☐ |

> Nota para QA del criterio 4: todavía no existen inmuebles ni lecturas (llegan con HU-05 y HU-08). Hoy se verifica que la cuenta nueva arranca vacía y con su propia identidad. **Repetir este criterio cuando HU-05 esté mergeada.**

## Definition of Done del equipo

- ☐ El código está en GitHub y pasó por un pull request **revisado y aprobado por al menos un compañero** (nadie aprueba su propio PR).
- ☐ **Squash and merge** y rama borrada.
- ☐ `python -m pytest backend/tests/` pasa (desde la raíz del repo).
- ☐ `npm test` pasa (dentro de `frontend`).
- ☐ No hay contraseñas, claves ni `.env` en el cambio (`git diff main --stat` y revisar). Ojo: `backend/ecodet.db` no debe estar versionado.
- ☐ Los mensajes de error coinciden con el caso de uso CU-01.
- ☐ README / ayuda actualizados (`frontend/README.md` documenta el cliente de API y la sesión).
- ☐ El **Product Owner** aceptó el ticket y Jira pasó a **Hecho**.

## Observaciones del QA

_(anotar acá lo que se encuentre)_
