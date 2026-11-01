# QA · Registro de lecturas de consumo (DET-54 / DET-55 / DET-56)

> **Quién prueba:** alguien que **no** escribió el código de este módulo.
> **Antes de empezar:** backend en `:8000` y frontend en `:5173` (ver README). Es necesario tener al menos un usuario registrado e iniciar sesión, además de contar con al menos un inmueble creado en el panel.
> La columna "Auto" indica si el criterio ya está cubierto por una prueba automática; **igual se prueba a mano** (el DoD lo exige).

## Criterios de aceptación del módulo de consumos

| # | Dado / Cuando / Entonces | Pasos a mano | Auto | Resultado |
| :-: | :--- | :--- | :-: | :-: |
| 1 | **Registro exitoso de consumo (201).** Con datos válidos y un inmueble propio seleccionado → se registra la lectura correctamente. | 1. Entrar al panel de inmuebles y hacer clic en el botón **+ Cargar Consumo** de una tarjeta de inmueble.<br>2. Seleccionar el servicio (ej. LUZ), completar una fecha de inicio y de fin válidas, y un valor numérico en consumo.<br>3. Hacer clic en **Registrar Consumo**.<br>4. Verificar que aparece el mensaje de éxito, se limpian los campos y la lectura queda guardada. | `test_crear_lectura_consumo_exitoso…`, `FormularioConsumo.jsx` | ☐ |
| 2 | **Inmueble inexistente o ajeno (404).** Si el ID del inmueble no existe o no pertenece al usuario actual, el backend lo rechaza. | 1. Enviar una petición (o simular la carga) con un `inmueble_id` que no pertenezca al usuario (ej. `9999`).<br>2. Verificar que la API responde con código `404 Not Found` y un JSON estructurado como `{"errores": {"inmueble_id": "..."}}`.<br>3. Comprobar que el error se despliega dinámicamente debajo del campo correspondiente en el formulario. | `test_crear_lectura_inmueble_inexistente…` | ☐ |
| 3 | **Superposición de períodos (409).** No se permite registrar lecturas para el mismo servicio si las fechas se solapan. | 1. Registrar una lectura de GAS del `2026-12-01` al `2026-12-15`.<br>2. Intentar registrar otra lectura de GAS del `2026-12-10` al `2026-12-20` para el mismo inmueble.<br>3. Verificar que la API responde con código `409 Conflict` y que el formulario muestra el mensaje de error correspondiente. | `test_crear_lectura_superposicion_fechas…` | ☐ |
| 4 | **Validación de esquemas y fechas (422).** Pydantic V2 valida las restricciones de tipos y lógica de fechas. | 1. Ingresar una `fecha_inicio` posterior a la `fecha_fin` (ej. inicio `30/11/2026`, fin `01/11/2026`).<br>2. Intentar enviar el formulario.<br>3. Verificar que el servidor rechaza la petición con `422 Unprocessable Entity` y el frontend muestra el error por campo. | `test_crear_lectura_fechas_invalidas…` | ☐ |
| 5 | **Seguridad y Autenticación (401).** Las peticiones sin token o con token inválido son rechazadas. | 1. Intentar realizar un POST a `/api/consumos` directamente sin cabecera de autorización o sin sesión iniciada.<br>2. Verificar que la API responde con un código `401 Unauthorized`. | `test_crear_lectura_consumo_sin_token…` | ☐ |

## Comprobaciones de apoyo (dependencias del módulo)

| # | Qué se comprueba | Pasos a mano | Auto | Resultado |
| :-: | :--- | :--- | :-: | :-: |
| A | **Carga dinámica de inmuebles en el selector.** El formulario de consumos obtiene los inmuebles del usuario autenticado de forma automática. | 1. Abrir el formulario de consumo desde el panel.<br>2. Desplegar el selector de inmuebles: debe listar exactamente los inmuebles creados por el usuario activo, mostrando sus nombres y direcciones. | `FormularioConsumo.jsx`, `listarInmuebles` | ☐ |
| B | **Manejo de errores por campo (`err.errores`).** Los errores devueltos por el backend se posicionan exactamente debajo de su input correspondiente. | 1. Provocar un error de validación o conflicto al enviar el formulario.<br>2. Verificar que los textos de error no rompen la interfaz y se ubican de manera limpia y legible bajo cada campo afectado. | `FormularioConsumo.jsx` | ☐ |

## Registro de ejecución

> Lo completa quien hace QA al terminar. Marcar cada resultado con ☑ (pasa) o ☒ (falla); si falla, anotar en **Observaciones** el paso, lo que se esperaba y lo que pasó.

| Dato | Valor |
| :--- | :--- |
| Quién probó (no escribió el código) | |
| Fecha | |
| Versión probada (`git rev-parse --short HEAD` en `main`) | |
| Navegador y sistema operativo | |
| `python -m pytest backend/tests/test_consumos.py` | ☐ pasa — ___ pruebas |
| `npm test` (en `frontend`) | ☐ pasa — ___ pruebas |
| `npm run build` (en `frontend`) | ☐ compila |

## Definition of Done del equipo

- ☐ El código está en GitHub y pasó por un pull request **revisado y aprobado por al menos un compañero** (nadie aprueba su propio PR).
- ☐ **Squash and merge** y rama borrada.
- ☐ `python -m pytest backend/tests/` pasa (desde la raíz del repo).
- ☐ `npm test` y `npm run build` pasan (dentro de `frontend`).
- ☐ No hay contraseñas, claves ni `.env` en el cambio (`git diff main --stat` y revisar).
- ☐ El backend responde con formato estandarizado de errores `{"errores": {...}}` y códigos correctos (`404`, `409`, `422`, `401`).
- ☐ README / ayuda actualizados si corresponde.
- ☐ El **Product Owner** aceptó el ticket y Jira pasó a **Hecho**.

## Observaciones del QA

_(anotar acá lo que se encuentre)_