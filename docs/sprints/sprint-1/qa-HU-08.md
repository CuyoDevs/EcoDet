# QA · Registro de lecturas de consumo (DET-16 / HU-08)

> **Quién prueba:** alguien que **no** escribió el código de este módulo.
> **Antes de empezar:** backend en `:8000` y frontend en `:5173` (ver README). Es necesario tener al menos un usuario registrado e iniciar sesión, además de contar con al menos un inmueble creado en el panel.
> La columna "Auto" indica si el criterio ya está cubierto por una prueba automática; **igual se prueba a mano** (el DoD lo exige).

## Criterios de aceptación del módulo de consumos (HU-08)

| # | Dado / Cuando / Entonces | Pasos a mano | Auto | Resultado |
| :-: | :--- | :--- | :-: | :-: |
| 1 | **Registro exitoso de consumo (201).** Con datos válidos y un inmueble propio seleccionado → se registra la lectura correctamente con unidad fija (kWh para luz, m³ para gas y agua). | 1. Entrar al panel de inmuebles y hacer clic en el botón **+ Cargar consumo** de una tarjeta de inmueble.<br>2. Seleccionar el servicio (ej. Luz kWh), completar una fecha de inicio y de fin válidas, y un valor numérico en consumo.<br>3. Hacer clic en **Registrar consumo**.<br>4. Verificar que aparece el mensaje de éxito y la lectura queda guardada. | `test_consumo_exitoso_luz_gas_agua`, `FormularioConsumo.test.jsx` | ☐ |
| 2 | **Agua opcional (RN-04).** La aplicación funciona sin problemas si un inmueble no carga agua. | 1. Cargar lecturas únicamente de Luz y Gas en un inmueble.<br>2. Verificar que no se produce ningún error en la aplicación ni en el servidor. | `test_consumo_exitoso_luz_gas_agua` | ☐ |
| 3 | **Inmueble inexistente o ajeno (404, RN-01).** Si el ID del inmueble no existe o no pertenece al usuario actual, el backend lo rechaza con 404. | 1. Enviar una petición con un `inmueble_id` de otro usuario.<br>2. Verificar que la API responde con código `404 Not Found` y `{"errores": {"inmueble_id": "..."}}`. | `test_consumo_inmueble_inexistente_o_ajeno_da_404` | ☐ |
| 4 | **Superposición de períodos (409, RN-14).** No se permite registrar lecturas para el mismo servicio si las fechas se solapan. | 1. Registrar una lectura de Gas del `2026-08-01` al `2026-08-31`.<br>2. Intentar registrar otra lectura de Gas del `2026-08-15` al `2026-09-15` para el mismo inmueble.<br>3. Verificar que la API responde con código `409 Conflict` y que el formulario muestra el mensaje de error bajo el campo. | `test_consumo_superposicion_periodos_da_409`, `FormularioConsumo.test.jsx` | ☐ |
| 5 | **Validación de esquemas y fechas (422, RN-03, RN-05).** Consumo no numérico, negativo, o fecha de fin anterior al inicio. | 1. Ingresar consumo negativo o fecha fin anterior a fecha inicio.<br>2. Intentar enviar el formulario.<br>3. Verificar que el servidor rechaza con `422 Unprocessable Entity` y el frontend muestra el error bajo el campo. | `test_consumo_validaciones_de_esquema` | ☐ |
| 6 | **Seguridad y Autenticación (401).** Las peticiones sin token son rechazadas. | 1. Intentar realizar un POST a `/api/consumos` sin cabecera Authorization.<br>2. Verificar código `401 Unauthorized`. | `test_consumo_sin_token_da_401` | ☐ |

## Definition of Done del equipo
- ☐ El código está en GitHub y pasó por un pull request **revisado y aprobado por al menos un compañero**.
- ☐ **Squash and merge** y rama borrada.
- ☐ `python -m pytest backend/tests/` pasa al 100%.
- ☐ `npm test` y `npm run build` pasan al 100%.
- ☐ No hay contraseñas, claves ni `.env` en el cambio.
- ☐ El **Product Owner** aceptó el ticket y Jira pasó a **Listo**.
