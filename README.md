# EcoDet · Detector de anomalías en consumo del hogar

Aplicación web donde el usuario registra su consumo de luz, gas y agua (en kWh o m³, nunca en dinero). El sistema aprende el patrón de cada inmueble y avisa cuando una lectura se aleja de lo normal, indicando servicio, período y desvío.

Proyecto del Taller de Tecnología Aplicada (implementación de Scrum con Jira). Alcance: Release 1 (MVP) en 2 sprints.

---

## 🔗 Enlaces y Documentación

- **Repositorio:** [https://github.com/CuyoDevs/EcoDet](https://github.com/CuyoDevs/EcoDet)
- **Tablero de Jira:** [https://mateolujan13.atlassian.net/jira/software/projects/DET/boards/2](https://mateolujan13.atlassian.net/jira/software/projects/DET/boards/2)
- **Documentación del Producto:**
  - [01 · Definición del producto y MVP](docs/producto/01-definicion-del-producto.md)
  - [02 · Product Backlog y criterios de aceptación](docs/producto/02-product-backlog.md)
  - [03 · Casos de uso, reglas y wireframes](docs/producto/03-documentacion-de-apoyo.md)
- **Diseño y Arquitectura:**
  - [ADR-001 · Decisiones del Stack Tecnológico](docs/diseno/decisiones/ADR-001-stack.md)
  - [Guía de Estilo Visual y UI](docs/diseno/guia-de-estilo.md)
  - [Diagrama de Casos de Uso](docs/diseno/diagramas/casos-de-uso.md)
  - [Diagrama de Clases del Dominio](docs/diseno/diagramas/clases-dominio.md)
  - [Modelo de Datos Relacional](docs/diseno/diagramas/modelo-datos.md)
- **Gestión del Sprint:**
  - [Planificación del Sprint 1 (Sprint Planning)](docs/sprints/sprint-1/planificacion.md)
  - [Sprint Backlog del Sprint 1](docs/sprints/sprint-1/sprint-backlog.md)

---

## 👥 Equipo

| Rol | Integrante |
| :--- | :--- |
| **Product Owner** | Mateo |
| **Scrum Master** | Ari |
| **Equipo de desarrollo** | Josue, Gimena, Ari, Angel, William, Lisandro y Mateo |
- Repositorio: https://github.com/CuyoDevs/EcoDet
- Tablero de Jira: https://mateolujan13.atlassian.net/jira/software/projects/DET/boards/2
- Documentos del producto: Ver documentación en el repositorio (Objetivo del producto, Product Backlog, Documentación de apoyo)

---

## 📅 Calendario

- **Sprint 1:** 19/10/2026 al 02/11/2026
- **Sprint 2:** 02/11/2026 al 16/11/2026
- **Presentación final:** 30/11/2026

---

## 💻 Stack Tecnológico (ADR-001)

- **Backend:** Python 3.11+ con [FastAPI](https://fastapi.tiangolo.com/) y Pydantic V2.
- **Base de Datos:** [SQLite](https://www.sqlite.org/) con ORM [SQLAlchemy 2.0](https://www.sqlalchemy.org/).
- **Frontend:** SPA con [React 18](https://react.dev/), [Vite](https://vitejs.dev/) y [Tailwind CSS](https://tailwindcss.com/).
- **Visualización / Gráficos:** [Chart.js](https://www.chartjs.org/) + `react-chartjs-2`.
- **Autenticación:** JWT (JSON Web Tokens) con contraseñas cifradas en `bcrypt`.
- **Pruebas:** `pytest` para backend y `vitest` para frontend.

---

## ⚙️ Parámetros del Sistema (Fuera del Código)

Los parámetros globales del detector se configuran en `backend/config.json`:
- **Mínimo de lecturas para alertas:** `6` (RN-07)
- **Umbral inicial de tolerancia:** `2.0` desvíos estándar (RN-09)
- **Piso del desvío:** `10.0 %` del promedio para consumos planos o con desvío cero (RN-12)

---

## 🚀 Cómo correr el proyecto

### Requisitos previos
- **Python 3.11 o superior**
- **Node.js 18 o superior** (con `npm`)
- **Git**

### 1. Clonar el repositorio
```bash
git clone https://github.com/CuyoDevs/EcoDet.git
cd EcoDet
```

### 2. Levantar el Backend (FastAPI + SQLite)
En una terminal:
```bash
# Ir a la carpeta del backend
cd backend

# (Opcional recomendado) Crear y activar entorno virtual
python -m venv .venv
# En Windows:
.venv\Scripts\activate
# En Linux/macOS:
# source .venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Copiar variables de entorno de ejemplo (si no existe .env)
copy .env.example .env

# Iniciar servidor de desarrollo
uvicorn app.main:app --reload --port 8000
```
- **API en vivo:** [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Swagger UI interactivo:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Endpoint de salud y base de datos:** [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)

### 3. Levantar el Frontend (React + Vite)
En una segunda terminal:
```bash
# Ir a la carpeta del frontend
cd frontend

# Instalar dependencias de Node
npm install

# Iniciar servidor de desarrollo
npm run dev
```
- **Aplicación web:** [http://localhost:5173](http://localhost:5173)

### 4. Ejecutar Pruebas Automáticas
```bash
# Pruebas del backend y detector
python -m pytest backend/tests/
```

---

## 📋 Cómo trabajamos

El flujo de ramas (`DET-<id>-descripcion`), las reglas de pull request con squash merge, la Definition of Ready (DoR) y la Definition of Done (DoD) están detalladas en [CONTRIBUTING.md](CONTRIBUTING.md).
