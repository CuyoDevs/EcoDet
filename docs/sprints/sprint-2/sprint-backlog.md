# EcoDet · Sprint Backlog del Sprint 2
## Elementos seleccionados, subtareas técnicas y criterios de aceptación
**Taller de Tecnología Aplicada · Proyecto: Implementación de Scrum con Jira**  
**Versión:** 1.1 · **Sprint:** 2 · **Product Owner:** Mateo · **Scrum Master:** Ari

---

## 1. Estado de Historias del Sprint 2

| Clave | HU | Título | Pts | Estado |
| :---: | :---: | :--- | :---: | :---: |
| **DET-15** | HU-07 | Eliminar un inmueble (con cascada de datos y confirmación) | 3 | **Completada (PR #21)** |
| **DET-19** | HU-11 | Editar o eliminar una lectura y reevaluar su alerta (RN-17) | 3 | **Completada (PR #22 y #23)** |
| **DET-20** | HU-12 | Evaluar cada lectura contra su historial (estacionalidad y umbral) | 5 | **Completada (PR #24)** |
| **DET-21** | **HU-13** | Recibir una alerta de consumo alto o bajo | 5 | **Completada / En revisión (Subtareas DET-86 a DET-90)** |
| **DET-22** | **HU-14** | Saber que el sistema todavía está aprendiendo | 2 | **Desglosada en Jira (Subtareas DET-92 a DET-95)** |
| **DET-23** | **HU-15** | Ver mis alertas y su detalle (W5) | 5 | **Desglosada en Jira (Subtareas DET-91, DET-96 a DET-99)** |
| **DET-24** | **HU-16** | Marcar una alerta como "normal" (RN-11, RN-13) | 3 | **Desglosada en Jira (Subtareas DET-100 a DET-103)** |

---

## 2. Desglose formal de Subtareas Técnicas en Jira

### 📌 DET-21 · HU-13: Recibir una alerta de consumo alto o bajo (5 pts)
- **DET-86:** [Backend] Crear y guardar la alerta alta o baja cuando la evaluación sale de los límites.
- **DET-87:** [Backend] Mensajes distintos para consumo alto y bajo y magnitud del desvío.
- **DET-88:** [Frontend] Mostrar la alerta al guardar una lectura y en el resumen de la carga histórica.
- **DET-89:** [Pruebas] pytest y vitest de las alertas con el caso 20 / 3 / 2 (31 alta, 10 baja).
- **DET-90:** [QA/DoD] Probar criterios de aceptación y cerrar la historia.

---

### 📌 DET-22 · HU-14: Saber que el sistema todavía está aprendiendo (2 pts)
- **DET-92:** [Backend] Incluir estado 'aprendiendo' y conteo de lecturas faltantes en la respuesta de evaluación.
- **DET-93:** [Frontend] Mensaje explicativo en la carga de lecturas (W3) cuando el detector está aprendiendo.
- **DET-94:** [Frontend] Indicador visual de progreso del aprendizaje en el historial de consumos (W4).
- **DET-95:** [Pruebas/DoD] Tests automáticos de backend y vitest para el estado aprendiendo y guía de QA (`qa-HU-14.md`).

---

### 📌 DET-23 · HU-15: Ver mis alertas y su detalle (5 pts)
- **DET-91:** [Backend] Conteo de alertas pendientes por inmueble en `GET /api/inmuebles/`.
- **DET-96:** [Backend] Endpoint `GET /api/inmuebles/{id}/alertas` con filtros por estado y servicio.
- **DET-97:** [Frontend] Componente `PanelAlertas` (W5) con lista, filtros y detalle interactivo.
- **DET-98:** [Frontend] Integración del contador de alertas en la tarjeta de inmueble (W2).
- **DET-99:** [Pruebas/DoD] Tests de integración backend, vitest de la UI de alertas y guía `qa-HU-15.md`.

---

### 📌 DET-24 · HU-16: Marcar una alerta como "normal" (3 pts)
- **DET-100:** [Backend] Endpoint `PATCH /api/alertas/{id}/normal` para cambiar estado a NORMAL.
- **DET-101:** [Backend] Exclusión de la lectura marcada como normal en evaluaciones futuras (RN-11, RN-17).
- **DET-102:** [Frontend] Botón interactivo [Marcar como normal] en el panel de alertas (W5).
- **DET-103:** [Pruebas/DoD] Tests de cambio de estado a NORMAL, exclusión estadística y guía `qa-HU-16.md`.
