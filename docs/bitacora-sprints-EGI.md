# EcoDet · Bitácora de Sprints (EGI)
## Estructura Oficial de la Cátedra · Taller de Tecnología Aplicada

**Proyecto:** EcoDet — Detector de anomalías en consumo del hogar  
**Repositorio:** [https://github.com/CuyoDevs/EcoDet](https://github.com/CuyoDevs/EcoDet)  
**Tablero Jira:** [https://mateolujan13.atlassian.net/jira/software/projects/DET/boards/2](https://mateolujan13.atlassian.net/jira/software/projects/DET/boards/2)  
**Aplicación en Producción:** [https://ecodet-1.onrender.com](https://ecodet-1.onrender.com)

---

# ============================================================
# SPRINT 1 · Cimientos Técnicos, Datos e Interfaz
# ============================================================

## 1. Encabezado del Sprint
- **Equipo:** CuyoDevs
- **Número de Sprint:** Sprint 1 (`DET Sprint 1`)
- **Fechas:** 19/10/2026 al 02/11/2026 (10 días hábiles)
- **Roles del Scrum Team:**
  - **Product Owner (PO):** Mateo Luján
  - **Scrum Master (SM):** Ari
  - **Developers:** Josue, Gimena, Ari, Angel, William, Lisandro, Mateo
- **Sprint Goal:** *"Base técnica, cuentas de usuario seguras, gestión de inmuebles, carga de lecturas (individual y en lote) e historial interactivo con gráficos por servicio."*
- **Capacidad estimada del equipo:** 29 puntos de historia (disponibilidad regular de 7 desarrolladores, considerando inicio de cursada y configuración de entornos).

---

## 2. Planificación (Sprint Planning)
- **Ítems seleccionados del Product Backlog:**
  - **DET-9 (HU-01):** Base técnica y documentación del entorno (FastAPI + React + SQLite) — 5 pts
  - **DET-10 (HU-02):** Registro de usuario con hash seguro `bcrypt` — 3 pts
  - **DET-11 (HU-03):** Inicio de sesión seguro con JWT — 3 pts
  - **DET-12 (HU-04):** Cerrar sesión y consultar datos del usuario logueado (`/api/auth/me`) — 2 pts
  - **DET-13 (HU-05):** Alta y consulta de inmuebles — 3 pts
  - **DET-14 (HU-06):** Edición de inmuebles existentes — 2 pts
  - **DET-16 (HU-08):** Carga individual de lectura de consumo con prorrateo diario — 3 pts
  - **DET-17 (HU-09):** Carga histórica de lecturas en lote (modo todo-o-nada) — 5 pts
  - **DET-18 (HU-10):** Ver historial y gráficos interactivos por servicio (Chart.js) — 3 pts
  - **Total:** 29 puntos.
- **Plan inicial:** 
  1. Configurar monorepo, ADR-001 y dependencias base.
  2. Implementar módulo de seguridad (Auth + JWT + bcrypt).
  3. Crear CRUD de inmuebles en backend y formularios en frontend.
  4. Desarrollar motor de carga de lecturas (validaciones de fecha y solapamiento).
  5. Integrar gráficos interactivos con Chart.js en el frontend.
- **Supuestos, dependencias y riesgos identificados:**
  - *Dependencia:* La carga de lecturas requería que el modelo de inmuebles estuviera cerrado y migrado.
  - *Riesgo:* Incompatibilidad entre librerías de hash de contraseñas (`passlib` vs `bcrypt 4.x`).
  - *Supuesto:* Los consumos se ingresan estrictamente en unidades físicas (kWh y m³), no en dinero.
- **Definition of Done (DoD) vigente:**
  - Código en FastAPI con esquemas Pydantic V2 y tipado estricto.
  - Pruebas unitarias de backend con `pytest` pasando al 100%.
  - Pruebas de componentes de UI con `vitest`.
  - Sin credenciales ni claves en código fuente.
  - Validación de criterios de aceptación por parte del Product Owner.
  - Squash merge en `main` mediante Pull Request con al menos 1 revisión aprobada.

---

## 3. Registro Diario (Daily Scrum - Sprint 1)

| Fecha | ¿Vamos bien encaminados? | Avance relevante | Impedimentos | Decisiones o ajustes al plan |
| :---: | :--- | :--- | :--- | :--- |
| **19/10** | Sí, inicio ordenado | Repositorio creado en GitHub, estructura inicial y plantilla de PR establecida. | Ninguno. | Se define la convención de ramas `DET-<id>-descripcion`. |
| **21/10** | Sí | Redacción de historias de usuario y criterios de aceptación en Jira. | Ninguno. | Se prioriza tener la arquitectura documentada en `ADR-001`. |
| **25/10** | Sí | Configuración de `.gitignore` para Python y Node.js; limpieza de enlaces. | Archivos temporales no ignorados. | Se ajustan reglas de ignorado en git. |
| **26/10** | Sí, muy bien | **DET-9:** Base técnica lista. FastAPI corriendo en 8000, React/Vite en 5173 y `ADR-001` aprobado. | Ninguno. | Se acuerda usar SQLite para desarrollo rápido de MVP. |
| **27/10** | Sí | **DET-10 (HU-02):** Registro de usuarios implementado con hash `bcrypt` y validaciones. | Subida accidental de archivo `.zip` al PR. | Se elimina el `.zip`, se bloquea por `.gitignore` y se hace squash merge. |
| **28/10** | Sí | **DET-11:** Endpoints `POST /api/auth/login` y `GET /api/auth/me` con JWT operativos. | `passlib` genera warning con Python 3.12. | Se decide usar directamente la librería nativa `bcrypt` (RN-15). |
| **30/10** | Sí | Integración del formulario de Login en React con persistencia de token en localStorage. | Manejo de expiración de token en cliente. | Se centraliza el manejo de 401 en `client.js`. |
| **31/10** | Con esfuerzo pero al día | **DET-13** y **DET-14:** Backend y modales frontend para alta y edición de inmuebles completos. | Validación de campos vacíos en modales. | Se estandariza el formato de errores 422 en español. |
| **01/11** | Sí | **DET-12 (HU-04):** Botón y flujo de cerrar sesión completado y testeado. | Ninguno. | Se prepara la integración de la carga de consumos. |
| **02/11** | Sí, cierre exitoso | **DET-16, DET-17 y DET-18:** Carga individual, carga en lote e historial con gráficos Chart.js finalizados. | Sincronización de múltiples PRs en el cierre. | Se realizan revisiones cruzadas rápidas para el cierre del Sprint. |

---

## 4. Impedimentos y Decisiones (Sprint 1)
- **Impedimento 1 (Librería de seguridad):** La dependencia histórica `passlib` fallaba con versiones modernas de Python y `bcrypt >= 4.0`.
  - *Detección:* Lisandro (28/10).
  - *Resolución:* Mateo y Lisandro migraron a `bcrypt` puro en `security.py`. Demora: 3 horas.
- **Impedimento 2 (Archivos comprimidos en PR):** Se subió un archivo `.zip` en la rama de registro.
  - *Detección:* Ari / Scrum Master (27/10).
  - *Resolución:* Se purgó el commit, se agregó `*.zip` al `.gitignore` y se capacitó al equipo sobre no comitear zips. Demora: 1 hora.
- **Decisiones Relevantes:**
  - *Adopción de SQLite:* Mantener SQLite mediante SQLAlchemy 2.0 para evitar fricción de configuración de motores pesados durante las demos del MVP.
  - *Mensajes 422 amigables:* Sobrescribir el manejador de validación de FastAPI para devolver errores en español mapeados a cada campo del formulario.
- **Cambios en el Sprint Backlog:** Ningún ítem fue quitado; se mantuvo el 100% del alcance planificado.

---

## 5. Cierre del Sprint 1
- **Sprint Review (02/11/2026):**
  - *Participantes:* Todo el Scrum Team (PO, SM, 5 Developers).
  - *Demostración:* Se mostró el flujo completo de registro de un usuario nuevo, creación de un inmueble ("Casa"), carga de 6 facturas históricas en lote y renderizado del gráfico de consumo eléctrico con tooltips y estadísticas de consumo por día.
  - *Feedback:* Interfaz limpia y gráficos fluidos. Se solicitó que en el Sprint 2 el sistema advierta claramente si faltan lecturas para calcular desvíos.
- **Resultado frente al Sprint Goal:** **Cumplido al 100%.**
- **Métricas Básicas:**
  - Puntos planificados: 29 pts | Puntos completados: 29 pts.
  - Ítems terminados: 9 historias (DET-9 a DET-18).
  - Ítems arrastrados al siguiente sprint: 0.

---

## 6. Retrospectiva (Sprint 1)
- **Qué funcionó bien:**
  - Gran compromiso del equipo con el flujo de PRs y Squash Merge.
  - La arquitectura desacoplada (FastAPI + React) permitió trabajar frontend y backend en paralelo sin bloquearse.
- **Qué no funcionó / Qué aprendimos:**
  - Las pruebas manuales se hacían de forma desestructurada al final del sprint.
  - Aprendimos que cada historia de usuario debe nacer con su propia guía o matriz de QA (`qa-HU-xx.md`).
- **Acuerdos de mejora para el Sprint 2:**
  1. *Acuerdo 1:* Diseñar las guías de QA (`qa-HU-xx.md`) en la fase de Definition of Ready (DoR) antes de cerrar cada ticket. (Responsable: Ari / SM - Fecha: 03/11).
  2. *Acuerdo 2:* Automatizar la ejecución de tests en cada PR para asegurar que `pytest` y `vitest` siempre estén en verde. (Responsable: Mateo - Fecha: 05/11).

---
---

# ============================================================
# SPRINT 2 · Detección de Anomalías, Alertas y Ajustes
# ============================================================

## 1. Encabezado del Sprint
- **Equipo:** CuyoDevs
- **Número de Sprint:** Sprint 2 (`DET Sprint 2`)
- **Fechas:** 02/11/2026 al 24/11/2026 (15 días hábiles)
- **Roles del Scrum Team:**
  - **Product Owner (PO):** Mateo Luján
  - **Scrum Master (SM):** Ari
  - **Developers:** Josue, Gimena, Ari, Angel, William, Lisandro, Mateo
- **Sprint Goal:** *"Motor estadístico del detector de anomalías (estacionalidad y umbrales), persistencia y visualización de alertas, estado 'aprendiendo', confirmación/marcado de alertas y ajuste de sensibilidad."*
- **Capacidad estimada del equipo:** 31 puntos de historia.

---

## 2. Planificación (Sprint Planning)
- **Ítems seleccionados del Product Backlog:**
  - **DET-15 (HU-07):** Eliminar inmueble con borrado en cascada — 3 pts
  - **DET-19 (HU-11):** Editar y eliminar lecturas y reevaluar alertas — 3 pts
  - **DET-20 (HU-12):** Motor estadístico: evaluación con estacionalidad y umbrales — 5 pts
  - **DET-21 (HU-13):** Recibir alerta de consumo alto o bajo — 5 pts
  - **DET-22 (HU-14):** Saber que el sistema todavía está aprendiendo — 2 pts
  - **DET-23 (HU-15):** Ver alertas y su detalle en panel interactivo — 5 pts
  - **DET-24 (HU-16):** Marcar una alerta como "normal" (excluir de estadísticas) — 3 pts
  - **DET-25 (HU-17):** Confirmar una alerta — 2 pts
  - **DET-26 (HU-18):** Modificar el umbral de detección por servicio e inmueble — 2 pts
  - **DET-27 (HU-19):** Generación de datos de prueba (`seed.py`) — 8 pts (re-estimado a subtareas)
  - **DET-29 (HU-21):** Ver franja de consumo habitual en el gráfico — 3 pts
  - **Total:** 31 puntos.
- **Plan inicial:**
  1. Diseñar el algoritmo estadístico como funciones puras (`detector.py`) para testing exhaustivo.
  2. Implementar borrado en cascada y edición/eliminación de lecturas.
  3. Construir la persistencia y panel de alertas con contadores en tiempo real.
  4. Desarrollar el componente visual de estado "Aprendiendo" e indicador de progreso.
  5. Ajuste de umbrales y franja habitual en gráficos.
  6. Script de carga de ejemplos (`seed.py`) y despliegue final en la nube.
- **Supuestos, dependencias y riesgos:**
  - *Riesgo matemático:* Que consumos con desvío cero o muy bajo generaran falsas alarmas por división por cero o umbrales microscópicos. Mitigado con la regla RN-12 (piso del 10%).
  - *Dependencia:* Las alertas requerían que la evaluación matemática estuviera completamente validada antes de persistir entidades `Alerta`.
- **Definition of Done (DoD) vigente:**
  - Cobertura con `pytest` del caso testigo 20/3/2 (31 alta, 10 baja, 20 normal).
  - Guía de QA manual aprobada en `docs/sprints/sprint-2/qa-HU-*.md`.
  - Pruebas de integración frontend (`vitest`) pasando.
  - Cero secretos o credenciales expuestas.

---

## 3. Registro Diario (Daily Scrum - Sprint 2)

| Fecha | ¿Vamos bien encaminados? | Avance relevante | Impedimentos | Decisiones o ajustes al plan |
| :---: | :--- | :--- | :--- | :--- |
| **03/11** | Sí | Planificación del Sprint 2 y desglose formal de subtareas en Jira. | Ninguno. | Se asignan historias base del detector. |
| **05/11** | Sí | Refinamiento de fórmulas matemáticas: estacionalidad trimestral y consumo diario. | Duda sobre estaciones del hemisferio sur. | Se definen estaciones astronómicas fijas para Argentina (RN-08). |
| **12/11** | Sí | **DET-15 (HU-07):** Eliminar inmueble con borrado en cascada probado y mergeado (PR #21). | Ruta relativa de base de datos en tests. | Se fija ruta absoluta de SQLite en configuración de tests. |
| **13/11** | Sí, gran avance | **DET-19 (HU-11):** Endpoints PUT y DELETE de lecturas terminados (PR #22 y #23). | Ninguno. | Se avanza sobre la reevaluación inmediata. |
| **13/11** | Sí | **DET-20 (HU-12):** Motor `detector.py` completado con 42 tests matemáticos específicos (PR #24). | Casos borde de desvío cero. | Se implementa estrictamente RN-12 (piso del 10% del promedio). |
| **15/11** | Sí | **DET-21 (HU-13):** Persistencia de Alertas y advertencia inmediata en el formulario (PR #25). | Mensajes diferenciados alto vs bajo. | Se enriquecen respuestas con porcentaje de desvío. |
| **17/11** | Sí | **DET-22 (HU-14):** Estado 'aprendiendo' con contador de lecturas faltantes y barra de progreso (PR #26). | Ninguno. | Se añade aviso en formulario y en panel histórico. |
| **18/11** | Sí | **DET-23 (HU-15):** Componente `PanelAlertas` con filtros por servicio y badges de estado (PR #27). | Conteo de alertas en tarjetas. | Se añade campo computado `alertas_pendientes` en `GET /api/inmuebles`. |
| **19/11** | Sí | **DET-24 (HU-16):** Funcionalidad de marcar alerta como normal (PR #28). | Exclusión en re-cálculos. | Se agrega filtro en `detector.py` para ignorar alertas marcadas NORMAL. |
| **20/11** | Sí, sprint completado | **DET-26, DET-27, DET-29, DET-25:** Sensibilidad, datos de prueba, franja de consumo y confirmación (PR #29 a #32). | Ninguno. | Todo el backlog del Sprint 2 integrado a `main`. |
| **24/11** | Sí, fase de despliegue | Configuración de Blueprint `render.yaml`, compatibilidad CORS, pruebas completas (524 tests) y despliegue cloud. | Token de Jira caducado y ajustes de CORS en Render. | Se despliega en Render (`ecodet.onrender.com` y `ecodet-1.onrender.com`) con conexión automática. |

---

## 4. Impedimentos y Decisiones (Sprint 2)
- **Impedimento 1 (Desvío estándar nulo en consumos planos):**
  - *Detección:* Mateo (13/11) al probar usuarios con consumos idénticos mensuales.
  - *Resolución:* Se aplicó la regla RN-12 que establece un umbral mínimo del 10% de la media cuando el desvío estándar muestral es menor a ese valor. Demora: 4 horas.
- **Impedimento 2 (Conexión CORS en despliegue en la nube):**
  - *Detección:* Durante el despliegue en Render (24/11), el navegador bloqueaba las llamadas entre el subdominio del frontend (`ecodet-1.onrender.com`) y el backend (`ecodet.onrender.com`).
  - *Resolución:* Se configuró una expresión regular dinámica en el middleware de CORS de FastAPI (`allow_origin_regex=r"^https:\/\/.*\.onrender\.com$"`) y conexión automática en `client.js`. Demora: 1 hora.
- **Decisiones Relevantes:**
  - *Exclusión de anomalías confirmadas:* No permitir que consumos anómalos contaminen el cálculo de la media futura una vez que el usuario los marca como normales.
  - *Seed automático:* Incluir un script `seed.py` en el arranque de producción para que la mesa evaluadora siempre cuente con datos cargados listos para probar.
- **Cambios en el Sprint Backlog:**
  - Se completaron todas las historias previstas y se sumó el refinamiento visual de la franja habitual (HU-21).

---

## 5. Cierre del Sprint 2
- **Sprint Review (24/11/2026):**
  - *Participantes:* Todo el Scrum Team.
  - *Demostración:* Se probó la aplicación desplegada en la nube en vivo: login con usuario demo, visualización de alerta en Luz, curva de invierno en Gas, estado aprendiendo en Agua con 3/6 lecturas, ajuste de sensibilidad de 2.0 a 1.5 desvíos y franja de normalidad en gráficos.
  - *Feedback:* El sistema cumple el 100% de los criterios del MVP y las reglas de negocio.
- **Resultado frente al Sprint Goal:** **Cumplido al 100%.**
- **Métricas Básicas:**
  - Puntos planificados: 31 pts | Puntos completados: 31 pts.
  - Ítems terminados: 11 historias (DET-15, DET-19 a DET-27, DET-29).
  - Ítems que pasan al siguiente sprint: 0 (Release 1 MVP finalizada).
  - Pruebas automáticas: 294 backend + 230 frontend = 524 tests verdes.

---

## 6. Retrospectiva (Sprint 2)
- **Qué funcionó:**
  - El cumplimiento del acuerdo de mejora del Sprint 1: todas las historias contaron con su documento de QA individual (`qa-HU-*.md`), lo que redujo drásticamente los bugs de integración.
  - La automatización de pruebas con `pytest` y `vitest` permitió refactorizar el detector con total confianza.
- **Qué aprendimos:**
  - La importancia de planificar el despliegue con anticipación para resolver detalles de red, CORS y variables de entorno antes de la fecha límite de entrega.
- **Seguimiento de acuerdos del Sprint anterior:**
  - *Acuerdo 1 (Matrices de QA en DoR):* **Cumplido 100%.** Se generaron los archivos `qa-HU-07.md` a `qa-HU-19.md`.
  - *Acuerdo 2 (Testing continuo):* **Cumplido 100%.** Se alcanzaron 524 pruebas automáticas sin fallos.
