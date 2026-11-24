# EcoDet · Bitácora de Sprints 1 y 2
## Taller de Tecnología Aplicada (EGI) · Estructura Oficial de la Cátedra

**Cátedra:** Taller de Tecnología Aplicada (EGI)  
**Proyecto:** EcoDet — Detector de anomalías en consumo del hogar (Luz, Gas y Agua)  
**Equipo:** CuyoDevs  
**Fecha de Presentación:** Miércoles 25/11/2026  
**Repositorio GitHub:** [https://github.com/CuyoDevs/EcoDet](https://github.com/CuyoDevs/EcoDet)  
**Tablero Jira:** [https://mateolujan13.atlassian.net/jira/software/projects/DET/boards/2](https://mateolujan13.atlassian.net/jira/software/projects/DET/boards/2)

---

## 👥 Roles del Scrum Team
- **Product Owner (PO):** Mateo Luján
- **Scrum Master (SM):** Ari
- **Developers:** Josue, Gimena, Ari, Angel, William, Lisandro, Mateo

---

# ============================================================
# SPRINT 1 · Cimientos Técnicos, Cuentas, Inmuebles e Historial
# ============================================================

## 1. Encabezado del Sprint
- **Equipo:** CuyoDevs
- **Número de Sprint:** Sprint 1 (`DET Sprint 1` en Jira)
- **Fechas:** 19/10/2026 al 02/11/2026 (10 días hábiles / 2 semanas)
- **Roles:** PO: Mateo Luján · SM: Ari · Developers: Josue, Gimena, Ari, Angel, William, Lisandro, Mateo
- **Sprint Goal:** *"Base técnica, cuentas de usuario seguras, gestión de inmuebles, carga de lecturas (individual y en lote) e historial interactivo con gráficos por servicio."*
- **Compromiso del Sprint Backlog:** 9 historias y 43 puntos de historia (7 Must con 40 pts y 2 Should con 3 pts), con 7 desarrolladores activos de 10 h semanales c/u.

---

## 2. Planificación (Sprint Planning)
- **Ítems seleccionados del Product Backlog:**
  - **DET-9 (HU-01):** Base técnica y documentación del entorno (FastAPI + React + SQLite) — 5 pts
  - **DET-10 (HU-02):** Registro de usuario con hash seguro `bcrypt` — 5 pts
  - **DET-11 (HU-03):** Inicio de sesión seguro con JWT y consulta del usuario autenticado (`GET /api/auth/me`, DET-38) — 3 pts
  - **DET-12 (HU-04):** Cerrar sesión — 1 pt
  - **DET-13 (HU-05):** Alta y consulta de inmuebles — 3 pts
  - **DET-14 (HU-06):** Edición de inmuebles existentes — 2 pts
  - **DET-16 (HU-08):** Carga individual de lectura de consumo con validaciones y consumo por día — 8 pts
  - **DET-17 (HU-09):** Carga histórica de lecturas en lote (modo todo-o-nada) — 8 pts
  - **DET-18 (HU-10):** Ver historial y gráficos interactivos por servicio (Chart.js) — 8 pts
  - **Total comprometido:** 43 puntos de historia.
- **Plan inicial:** Configurar monorepo con `ADR-001`, construir el backend de autenticación e inmuebles en paralelo con los componentes de UI en React/Tailwind, e integrar gráficos en la segunda semana.
- **Supuestos, dependencias y riesgos:** Las lecturas se cargan en kWh o m³ (no en dinero). Dependencia: la carga de consumos requiere inmuebles persistidos. Riesgo: incompatibilidad de librerías de hash.
- **Definition of Done (DoD):** Código con tipado y validaciones de Pydantic, pruebas automáticas con `pytest` pasando, sin credenciales ni secretos en el repositorio, aceptación funcional del Product Owner y entrada a `main` por Pull Request con al menos 1 aprobación y squash merge.

---

## 3. Registro Diario (Daily Scrum - Sprint 1)

| Fecha | ¿Vamos bien encaminados? | Avance relevante | Impedimentos | Decisiones o ajustes al plan |
| :---: | :--- | :--- | :--- | :--- |
| **19/10** | Sí | Creación del repositorio `CuyoDevs/EcoDet`, `README.md` base y plantilla de PR. | Ninguno. | Convención estricta de ramas `DET-<id>-descripcion`. |
| **21/10** | Sí | Configuración del proyecto `DET` en Jira y carga del Product Backlog refinado. | Ninguno. | Se prioriza definir el stack técnico en `ADR-001`. |
| **25/10** | Sí | Configuración de `.gitignore` para monorepo (Python `.venv` y Node `node_modules`). | Archivos temporales no ignorados. | Se ajustan exclusiones de git. |
| **26/10** | Sí | **DET-9:** Base técnica completa. Servidores backend y frontend corriendo y documentados. | Ninguno. | Se adopta SQLite con SQLAlchemy 2.0 para el MVP. |
| **27/10** | Sí | **DET-10 (HU-02):** Registro de usuarios implementado con hash seguro y validaciones. | Subida accidental de `.zip` al PR. | Se elimina el zip, se agrega `*.zip` al gitignore y se hace squash merge. |
| **28/10** | Sí | **DET-11:** Endpoints `POST /api/auth/login` y `GET /api/auth/me` con JWT listos. | `passlib` arroja warning en Python 3.12. | Se decide usar directamente la librería nativa `bcrypt` (RN-15). |
| **30/10** | Sí | Formulario de Login en React conectado con persistencia de token en `localStorage`. | Manejo de expiración de sesión. | Se centraliza el interceptor de 401 en `client.js`. |
| **31/10** | Sí | **DET-13** y **DET-14:** Backend y modales frontend para alta y edición de inmuebles. | Validación de campos vacíos. | Se estandarizan errores 422 en español por campo. |
| **01/11** | Sí | **DET-12 (HU-04):** Botón y flujo de cerrar sesión completado y testeado. | Ninguno. | Se prepara la carga de consumos. |
| **02/11** | Sí, cierre exitoso | **DET-16, DET-17 y DET-18:** Carga individual, lote histórico e historial con gráficos terminados. | Sincronización final de PRs. | Revisiones cruzadas rápidas y cierre del Sprint 1. |

---

## 4. Impedimentos y Decisiones (Sprint 1)
- **Impedimento 1 (Librería `passlib` obsoleta):** Passlib 1.7.4 ya no se mantiene y falla con bcrypt 5.x (la versión que instala `requirements.txt`). Se reemplazó por la librería nativa `bcrypt` en `backend/app/security.py`. Demora: 3 horas.
- **Impedimento 2 (Archivo zip en commit):** Se subió un zip por error en el ticket de registro. Se purgó el historial de la rama y se configuró `.gitignore`. Demora: 1 hora.
- **Decisiones Relevantes:** Mantener SQLite para simplificar la portabilidad del MVP sin requerir configurar servidores de base de datos externos en las máquinas de los alumnos. Formatear errores 422 en español para mostrar mensajes bajo cada input.

---

## 5. Cierre del Sprint 1
- **Sprint Review (02/11/2026):** Se realizó la demostración en vivo del registro de usuario, alta de inmueble "Casa Principal", carga por lote de 6 facturas históricas de luz y visualización de la curva en Chart.js. Feedback positivo de la interfaz.
- **Resultado frente al Sprint Goal:** **Cumplido al 100%.**
- **Métricas:** 43 puntos planificados vs 43 puntos completados (0 puntos arrastrados). 9 historias terminadas.

---

## 6. Retrospectiva (Sprint 1)
- **Qué funcionó:** El flujo de ramas y squash merge evitó roturas en `main`. Excelente coordinación entre frontend y backend.
- **Qué no funcionó / Aprendizaje:** La validación manual de DoD se hacía a último momento.
- **Acuerdos de mejora para el Sprint 2:** 
  1. Escribir una matriz de pruebas de QA manual (`qa-HU-xx.md`) por cada historia antes de considerarla lista.
  2. Automatizar tests unitarios obligatorios en cada PR.

---
---

# ============================================================
# SPRINT 2 · Motor Estadístico, Alertas y Sensibilidad
# ============================================================

## 1. Encabezado del Sprint
- **Equipo:** CuyoDevs
- **Número de Sprint:** Sprint 2 (`DET Sprint 2` en Jira)
- **Fechas:** 02/11/2026 al 16/11/2026 según el Product Backlog. El primer merge del sprint es del 12/11 (PR #21) y el cierre efectivo, con el despliegue final, fue el 24/11/2026.
- **Roles:** PO: Mateo Luján · SM: Ari · Developers: Josue, Gimena, Ari, Angel, William, Lisandro, Mateo
- **Sprint Goal:** *"Motor estadístico del detector de anomalías (estacionalidad y umbrales), persistencia y visualización de alertas, estado 'aprendiendo', confirmación/marcado de alertas y ajuste de sensibilidad."*
- **Compromiso del Sprint Backlog:** 12 historias y 42 puntos de historia (incluye las de prioridad Should y Could).

---

## 2. Planificación (Sprint Planning)
- **Ítems seleccionados:**
  - **DET-15 (HU-07):** Eliminar inmueble con borrado en cascada — 3 pts
  - **DET-19 (HU-11):** Editar y eliminar lecturas y reevaluar alertas — 3 pts
  - **DET-20 (HU-12):** Motor estadístico del detector (estacionalidad y umbrales) — 5 pts
  - **DET-21 (HU-13):** Recibir alerta de consumo alto o bajo persistida — 5 pts
  - **DET-22 (HU-14):** Estado 'aprendiendo' del detector ($< 6$ lecturas) — 2 pts
  - **DET-23 (HU-15):** Panel central de alertas con filtros — 5 pts
  - **DET-24 (HU-16):** Marcar una alerta como "normal" (exclusión estadística) — 3 pts
  - **DET-25 (HU-17):** Confirmar una alerta — 2 pts
  - **DET-26 (HU-18):** Ajuste de sensibilidad del detector por servicio e inmueble — 3 pts
  - **DET-27 (HU-19):** Cargar datos de ejemplo (inmueble de demostración con anomalías conocidas, `POST /api/inmuebles/demo`) — 5 pts
  - **DET-28 (HU-20):** Probar con usuarios reales y registrar los resultados — 3 pts
  - **DET-29 (HU-21):** Ver franja de consumo habitual en gráficos — 3 pts
  - **Total comprometido:** 42 puntos de historia.
- **Plan inicial:** Aislar la lógica matemática en `detector.py` como funciones puras para asegurar cobertura matemática total; luego acoplar la persistencia de alertas, UI de alertas, ajustes de sensibilidad y despliegue.
- **Riesgos:** Falsas alarmas en consumos con desvío estándar nulo (consumo constante). Se mitiga implementando la regla RN-12 (piso mínimo del 10%).

---

## 3. Registro Diario (Daily Scrum - Sprint 2)

| Fecha | ¿Vamos bien encaminados? | Avance relevante | Impedimentos | Decisiones o ajustes al plan |
| :---: | :--- | :--- | :--- | :--- |
| **03/11** | Sí | Planificación formal del Sprint 2 y desglose de subtareas en Jira. | Ninguno. | Se asignan parejas de trabajo. |
| **05/11** | Sí | Definición de la estacionalidad: estaciones meteorológicas del hemisferio sur (verano dic–feb, otoño mar–may, invierno jun–ago, primavera sep–nov), asignadas por el punto medio del período. | Ninguno. | Se fijan los rangos de meses por estación (RN-08). |
| **12/11** | Sí | **DET-15 (HU-07):** Eliminar inmueble con borrado en cascada completado (PR #21). | Ruta relativa en base de test. | Se fija path absoluto en `test_inmuebles.py`. |
| **13/11** | Sí | **DET-19 (HU-11):** Endpoints PUT y DELETE de lecturas terminados (PR #22 y #23). | Ninguno. | Reevaluación inmediata de alertas. |
| **13/11** | Sí, hito clave | **DET-20 (HU-12):** Motor estadístico `detector.py` finalizado con 42 tests unitarios (PR #24). | Consumos planos con desvío 0. | Se aplica estrictamente RN-12 (piso del 10% del promedio). |
| **15/11** | Sí | **DET-21 (HU-13):** Persistencia de Alertas y advertencia inmediata en formulario (PR #25). | Diferenciar alta vs baja. | Se enriquece la respuesta con % de desvío. |
| **17/11** | Sí | **DET-22 (HU-14):** Estado 'aprendiendo' con contador de lecturas y barra de progreso (PR #26). | Ninguno. | Avisos visuales en W3 y W4. |
| **18/11** | Sí | **DET-23 (HU-15):** Componente `PanelAlertas` con filtros por servicio y badges (PR #27). | Conteo en tarjetas de inmuebles. | Se añade campo computado `alertas_pendientes`. |
| **19/11** | Sí | **DET-24 (HU-16):** Funcionalidad de marcar alerta como normal terminada (PR #28). | Exclusión en re-cálculos. | Se filtra en `detector.py` para ignorar normales. |
| **20/11** | Sí | **DET-26, DET-27, DET-29, DET-25:** Sensibilidad, datos de prueba, franja y confirmación (PRs #29 a #32). | Ninguno. | Historias de producto del Sprint 2 integradas a `main` (HU-20 se cierra el 24/11). |
| **24/11** | Sí, despliegue final | **DET-28 (HU-20):** registro de pruebas con 3 usuarios reales (PR #33). Blueprint `render.yaml`, compatibilidad CORS, 524 pruebas automáticas y puesta en producción en la nube. | Token de Jira expirado y CORS inicial. | Backend en `ecodet.onrender.com` y frontend en `ecodet-1.onrender.com` operativos. |

---

## 4. Impedimentos y Decisiones (Sprint 2)
- **Impedimento 1 (Desvío estándar nulo):** Lecturas consecutivas con idéntico consumo generaban división por cero o umbrales idénticos a la media. Se implementó la regla RN-12 (piso del 10% del promedio como umbral mínimo). Demora: 4 horas.
- **Impedimento 2 (Conexión CORS en Render):** El frontend en `ecodet-1.onrender.com` requería comunicarse con `ecodet.onrender.com`. Se configuró `allow_origin_regex` en FastAPI y autoconexión en `client.js`. Demora: 1 hora.
- **Decisiones Relevantes:** Precargar datos demostrativos en cada arranque del servidor (`python seed.py` en el comando de inicio de Render) para que la mesa evaluadora cuente con casos de prueba listos. El script recrea los inmuebles del usuario `demo@ecodet.com`, por lo que esa cuenta vuelve a su estado inicial en cada arranque.

---

## 5. Cierre del Sprint 2
- **Sprint Review (24/11/2026):** Demostración completa en la nube: alerta de luz anómala (450 kWh, salto a más del doble), curva estacional de gas en invierno, estado aprendiendo en agua (3/6 lecturas), ajuste de sensibilidad de 2.0 a 1.5 desvíos y franja habitual sombreada en el gráfico.
- **Resultado frente al Sprint Goal:** **Cumplido al 100%.**
- **Métricas:** 42 puntos planificados vs 42 puntos completados. 12 historias terminadas. 524 pruebas automáticas en verde (294 backend + 230 frontend).

---

## 6. Retrospectiva (Sprint 2)
- **Qué funcionó:** Las matrices de QA individuales (`qa-HU-xx.md`, en `docs/sprints/`) ayudaron a verificar los criterios de aceptación de cada historia antes de mergearla.
- **Qué aprendimos:** La importancia de automatizar el despliegue mediante Infraestructura como Código (Blueprint) para garantizar reproducibilidad exacta entre entornos.
- **Seguimiento de acuerdos del Sprint 1:** Se cumplieron ambos acuerdos: matrices de QA por historia y tests automáticos incluidos en cada PR (el repositorio no tiene un pipeline de CI, así que los tests se corren a mano).
