# ADR-001 · Definición del Stack Tecnológico y Decisiones Técnicas (D-01 a D-14)
**Estado:** Aceptada  
**Fecha:** 20/10/2026  
**Decide:** Mateo (Product Owner)  
**Proyecto:** EcoDet · Detector de anomalías en consumo del hogar  

---

## Contexto
Para el desarrollo del MVP de EcoDet (Release 1, Sprints 1 y 2) se requiere definir la arquitectura base, lenguaje de backend, motor de base de datos, frontend, visualización de datos, estadísticas, autenticación y herramientas de soporte. El equipo está conformado por 7 integrantes universitarios con tiempo acotado a 2 semanas por sprint, por lo que las decisiones priorizan:
1. Facilidad y rapidez de instalación en las máquinas de los 7 integrantes (sin servidores complejos).
2. Curva de aprendizaje baja y código legible.
3. Modularidad (separación frontend / backend) para trabajo en paralelo.
4. Soporte directo para gráficos interactivos y cálculo estadístico de series de tiempo.

---

## Decisiones Técnicas Registradas

### D-01 · Backend: Python + FastAPI
- **Decisión:** Se adopta **Python 3.11+ con FastAPI**.
- **Justificación:** FastAPI ofrece alto rendimiento, tipado estático con Pydantic (vital para validar esquemas de lecturas, fechas y parámetros), documentación interactiva Swagger (`/docs`) generada automáticamente y soporte nativo para cálculos matemáticos en Python.

### D-02 · Base de datos relacional: SQLite + SQLAlchemy
- **Decisión:** Se utiliza **SQLite** como motor relacional de desarrollo local gestionado mediante **SQLAlchemy**.
- **Justificación:** Cero fricción de instalación para los 7 desarrolladores (un único archivo local `.db`). Cumple plenamente con el modelo relacional (claves foráneas, unicidad, integridad referencial en cascada).

### D-03 · Frontend: React + Vite
- **Decisión:** SPA (Single Page Application) desarrollada con **React 18+ y Vite**.
- **Justificación:** Inicialización ultra rápida, recarga en caliente (HMR), arquitectura modular basada en componentes y desacople total de la API REST.

### D-04 · Librería de gráficos: Chart.js (`react-chartjs-2`)
- **Decisión:** Se adopta **Chart.js** con su wrapper para React.
- **Justificación:** Permite configurar un gráfico de líneas/barras por servicio, personalización de colores por servicio (luz, gas, agua), destacar visualmente puntos anómalos y desplegar tooltips detallados (HU-10).

### D-05 · Módulo estadístico del detector: Implementación nativa en Python
- **Decisión:** Implementación propia de las fórmulas estadísticas en Python puro sin dependencias externas pesadas.
- **Justificación:** Las fórmulas del dominio son directas: media aritmética ($\bar{x}$), desvío estándar muestral ($s$ con denominador $n-1$), desvío efectivo $\max(s, 0.10 \times \bar{x})$, y límites $\bar{x} \pm (umbral \times desvío)$. Al ser Python nativo, se ejecuta y testea en milisegundos con `pytest`.

### D-06 · Autenticación y sesiones: JWT (JSON Web Tokens) + Passlib/Bcrypt
- **Decisión:** Autenticación por tokens **JWT** transmitidos en cabecera `Authorization: Bearer <token>`, con contraseñas hasheadas mediante **bcrypt**.
- **Justificación:** Cumple con la RN-15 y facilita la integración sin estado entre la SPA en React y los endpoints protegidos de FastAPI.

### D-07 · Pruebas automáticas: pytest + vitest
- **Decisión:** **pytest** para backend y suite de pruebas del detector; **vitest** para frontend.
- **Justificación:** La Definition of Done exige pruebas automáticas del detector y de las validaciones de datos. `pytest` es el estándar indiscutido en Python.

### D-08 · Entorno de demostración: Localhost asistido
- **Decisión:** Demostración en **localhost** con instrucciones de arranque claras y datos de ejemplo pre-cargados (CU-08).
- **Justificación:** Evita caídas de red, cuotas de servicios cloud gratuitos o retrasos de despliegue durante la Sprint Review ante la cátedra.

### D-09 · Estructura de carpetas: Monorepo limpio
- **Decisión:** Estructura de repositorio único con carpetas `/backend`, `/frontend` y `/docs`.
- **Justificación:** Centraliza el versionado, las revisiones de PR y la gestión de tickets de Jira en un solo lugar, manteniendo los entornos de ejecución aislados.

### D-10 · Configuración de parámetros: `config.json` + `.env`
- **Decisión:** Parámetros del sistema (`minimo_de_lecturas = 6`, `umbral_inicial_en_desvios = 2`, `piso_del_desvio_porcentaje_del_promedio = 10`) en archivo de configuración `config.json` fuera del código fuente. Secretos en `.env` (con `.env.example` versionado en el repo).

### D-11 · Versiones y dependencias
- **Decisión:** Python $\ge 3.11$ (`backend/requirements.txt`) y Node.js $\ge 18$ (`frontend/package.json`).

### D-12 · Calidad de código
- **Decisión:** Prioridad en funcionalidad y tests unitarios. Sin linter ni pipelines de CI bloqueantes obligatorios por el momento para maximizar la velocidad de entrega del Sprint 1.

### D-13 · Herramientas de diagramas
- **Decisión:** **Mermaid** integrado en los archivos Markdown para diagramas de clases, estados y entidad-relación; **draw.io** (con fuente `.drawio` en el repo) para Casos de Uso.

### D-14 · Ubicación de notas de reunión
- **Decisión:** Versionadas en el repositorio bajo `docs/sprints/sprint-1/` y enlazadas desde Jira.

---

## Consecuencias
- Quedan desbloqueadas las tareas de inicialización de código (A8), diagramas (A5, A6) y guía de estilo (A7).
