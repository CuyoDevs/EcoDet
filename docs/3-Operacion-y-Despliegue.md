# EcoDet · Documentación de Operación y Despliegue
## Taller de Tecnología Aplicada (EGI) · Manual de Usuario e Instalación

**Cátedra:** Taller de Tecnología Aplicada (EGI)  
**Proyecto:** EcoDet — Detector de anomalías en consumo del hogar (Luz, Gas y Agua)  
**Equipo:** CuyoDevs  
**Fecha de Presentación:** Miércoles 25/11/2026  
**Repositorio GitHub:** [https://github.com/CuyoDevs/EcoDet](https://github.com/CuyoDevs/EcoDet)

---

# PARTE 1 · Manual de Usuario

## 1.1. Acceso al Sistema (Producción en la Nube)

La aplicación está disponible públicamente en:

| Recurso | URL |
| :--- | :--- |
| **Frontend (Aplicación Web)** | https://ecodet-1.onrender.com |
| **Backend API** | https://ecodet.onrender.com |
| **Documentación Swagger** | https://ecodet.onrender.com/docs |
| **Health Check** | https://ecodet.onrender.com/api/health |

> **Nota:** Los servidores de Render en plan gratuito entran en modo *sleep* tras 15 minutos de inactividad. El primer request puede tardar entre 30 y 45 segundos mientras el servidor se reactiva.

### Credenciales de Demostración

| Campo | Valor |
| :--- | :--- |
| **Correo** | demo@ecodet.com |
| **Contraseña** | Password123 |

La cuenta demo ya tiene cargados 3 inmuebles con historial de consumos que activan el motor estadístico del detector.

---

## 1.2. Registro y Acceso

### Crear una cuenta nueva
1. Ingresar a `https://ecodet-1.onrender.com`.
2. Hacer clic en **"Registrarse"**.
3. Completar: Nombre completo, Correo electrónico, Contraseña (mínimo 6 caracteres).
4. Hacer clic en **"Crear cuenta"**.

### Iniciar sesión
1. Ingresar a la pantalla de inicio.
2. Completar correo y contraseña.
3. Hacer clic en **"Ingresar"**.
4. Se redirige al **Panel Principal** con la lista de inmuebles.

### Cerrar sesión
- Hacer clic en el ícono de usuario en la esquina superior derecha y seleccionar **"Cerrar sesión"**.

---

## 1.3. Gestión de Inmuebles

Los inmuebles son las propiedades donde se registran los consumos (casa, departamento, local comercial).

### Agregar un inmueble
1. En el Panel Principal, hacer clic en **"Agregar inmueble"** (botón verde).
2. Completar nombre y dirección del inmueble.
3. Confirmar con **"Guardar"**.

### Editar un inmueble
1. En la tarjeta del inmueble, hacer clic en el ícono de lápiz ✏️.
2. Modificar nombre y/o dirección.
3. Guardar los cambios.

### Eliminar un inmueble
1. En la tarjeta del inmueble, hacer clic en el ícono de papelera 🗑️.
2. Confirmar la eliminación en el diálogo de confirmación.
> **Atención:** Eliminar un inmueble borra permanentemente todas sus lecturas y alertas asociadas.

---

## 1.4. Carga de Lecturas de Consumo

Las lecturas representan las facturas de servicios (Luz, Gas, Agua). Se registran en unidades físicas: **kWh** para Luz y **m³** para Gas y Agua (no en dinero).

### Cargar una lectura individual
1. Ingresar al inmueble haciendo clic en su tarjeta.
2. Seleccionar la pestaña del servicio: **Luz**, **Gas** o **Agua**.
3. Hacer clic en **"Nueva lectura"**.
4. Completar:
   - **Fecha de inicio** del período de la factura.
   - **Fecha de fin** del período de la factura.
   - **Consumo** en kWh o m³.
5. Hacer clic en **"Guardar"**.

> El sistema calculará automáticamente el consumo por día y ejecutará el motor estadístico. Si se detecta una anomalía, aparecerá una alerta inmediatamente.

### Carga histórica en lote
Para cargar varias facturas pasadas de una vez:
1. Hacer clic en **"Carga en lote"**.
2. Ingresar las facturas históricas en el formulario múltiple.
3. Confirmar la operación (es **todo-o-nada**: si una falla, no se guarda ninguna).

### Editar o eliminar una lectura
1. En el historial del servicio, hacer clic sobre la lectura.
2. Elegir **Editar** o **Eliminar**.
3. Las alertas asociadas se **recalculan automáticamente**.

---

## 1.5. Historial y Gráficos

Dentro de cada servicio se muestra:
- **Gráfico de líneas** (Chart.js) con los consumos diarios históricos.
- **Franja sombreada** que representa la zona de consumo habitual (entre el límite inferior y superior calculado por el motor).
- **Tooltips interactivos** al pasar el mouse sobre cada punto.

### Estado "Aprendiendo"
Si hay menos de **6 lecturas** cargadas para un servicio, el sistema muestra:
- Un indicador de estado **"Aprendiendo"** con barra de progreso.
- Cuántas lecturas adicionales faltan para activar el detector.

---

## 1.6. Panel de Alertas

El panel de alertas centraliza todas las anomalías detectadas.

### Acceder al panel
- Hacer clic en **"Alertas"** en el menú de navegación superior.

### Tipos de alertas
| Tipo | Significado |
| :--- | :--- |
| 🔴 **ALTA** | El consumo superó el límite superior habitual. Posible pérdida o uso excesivo. |
| 🔵 **BAJA** | El consumo cayó por debajo del límite inferior. Lectura inusualmente baja. |

### Estados de una alerta
| Estado | Significado |
| :--- | :--- |
| **PENDIENTE** | La alerta fue detectada y está esperando revisión. |
| **CONFIRMADA** | El usuario confirmó que fue una anomalía real (fuga, pérdida, etc.). |
| **NORMAL** | El usuario indicó que el consumo atípico tuvo causa justificada (pileta, invitados, etc.). La lectura se excluye de los cálculos futuros. |

### Acciones sobre alertas
- **Filtrar:** Por servicio (Luz / Gas / Agua) y por estado.
- **Marcar como normal:** Indica que el consumo fue excepcional pero justificado.
- **Confirmar:** Valida que la anomalía representó un problema real.

---

## 1.7. Ajuste de Sensibilidad

Permite personalizar qué tan estricto es el detector para cada servicio e inmueble.

1. Ir a **"Configuración"** dentro del inmueble.
2. Ajustar el valor de **k (desvíos estándar)** para cada servicio:
   - **1.0** → Muy sensible (detecta variaciones pequeñas).
   - **2.0** → Sensibilidad estándar (valor por defecto).
   - **3.0** → Poco sensible (sólo detecta variaciones muy grandes).

---

---

# PARTE 2 · Documentación de Instalación Local

## 2.1. Requisitos Previos

| Herramienta | Versión mínima | Verificar con |
| :--- | :--- | :--- |
| **Python** | 3.11+ | `python --version` |
| **Node.js** | 18+ | `node --version` |
| **npm** | 9+ | `npm --version` |
| **Git** | Cualquier versión reciente | `git --version` |

---

## 2.2. Clonar el Repositorio

```bash
git clone https://github.com/CuyoDevs/EcoDet.git
cd EcoDet
```

---

## 2.3. Configuración del Backend (FastAPI + Python)

### Instalación de dependencias

```bash
cd backend
python -m venv .venv

# Windows (PowerShell)
.venv\Scripts\Activate.ps1

# Linux / macOS
source .venv/bin/activate

pip install -r requirements.txt
```

### Iniciar el servidor de desarrollo

```bash
# (desde la carpeta backend/, con el entorno virtual activo)
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

El backend queda disponible en: `http://127.0.0.1:8000`  
Documentación Swagger local: `http://127.0.0.1:8000/docs`

### Atajo rápido (Windows)
Desde la raíz del proyecto:
```powershell
.\run-backend.bat
```

---

## 2.4. Configuración del Frontend (React + Vite)

### Instalación de dependencias

```bash
cd frontend
npm install
```

### Iniciar el servidor de desarrollo

```bash
npm run dev
```

El frontend queda disponible en: `http://127.0.0.1:5173`

### Atajo rápido (Windows)
Desde la raíz del proyecto:
```powershell
.\run-frontend.bat
```

---

## 2.5. Cargar Datos de Demo (Opcional)

Para poblar la base de datos local con datos de demostración:

```bash
# (desde la carpeta backend/, con el servidor corriendo)
python seed.py
```

Esto crea el usuario `demo@ecodet.com` / `Password123` con 3 inmuebles y lecturas históricas que activan el motor estadístico.

---

## 2.6. Ejecutar Tests Automáticos

### Backend (pytest)

```bash
cd backend
python -m pytest -v
# Resultado esperado: 294 passed
```

### Frontend (vitest)

```bash
cd frontend
npm run test
# Resultado esperado: 230 passed en 22 test files
```

### Build de producción (verificación)

```bash
cd frontend
npm run build
# Resultado esperado: Build exitoso con archivos en dist/
```

---

---

# PARTE 3 · Documentación de Despliegue en Producción (Render)

## 3.1. Infraestructura Desplegada

| Componente | Plataforma | URL | Estado |
| :--- | :--- | :--- | :--- |
| **Backend API** | Render (Web Service) | https://ecodet.onrender.com | ✅ Activo |
| **Frontend SPA** | Render (Static Site) | https://ecodet-1.onrender.com | ✅ Activo |
| **Base de Datos** | SQLite (incluida en el contenedor) | — | ✅ Conectada |

---

## 3.2. Blueprint de Render (render.yaml)

El archivo `render.yaml` en la raíz del repositorio define toda la infraestructura como código (IaC). Permite reproducir el despliegue completo con un solo clic desde el panel de Render.

```yaml
# render.yaml — Blueprint EcoDet
services:
  - type: web
    name: ecodet-backend
    env: python
    buildCommand: "pip install -r backend/requirements.txt"
    startCommand: "cd backend && python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT"
    envVars:
      - key: PYTHON_VERSION
        value: "3.11.0"

  - type: static
    name: ecodet-frontend
    buildCommand: "cd frontend && npm install && npm run build"
    staticPublishPath: "./frontend/dist"
    routes:
      - type: rewrite
        source: /*
        destination: /index.html
```

---

## 3.3. Configuraciones Clave de Producción

### CORS (Backend)
El backend permite conexiones desde cualquier subdominio de Render para habilitar la comunicación entre frontend y backend desplegados en servicios separados:

```python
# backend/app/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^https:\/\/.*\.onrender\.com$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Auto-detección de entorno (Frontend)
El frontend detecta automáticamente si está en producción o desarrollo y conecta al backend correspondiente:

```javascript
// frontend/src/api/client.js
const isProduction = window.location.hostname !== 'localhost'
  && window.location.hostname !== '127.0.0.1';

const BASE_URL = isProduction
  ? 'https://ecodet.onrender.com'
  : 'http://127.0.0.1:8000';
```

---

## 3.4. Proceso de Despliegue

### Primer despliegue
1. Hacer fork o tener acceso al repositorio `CuyoDevs/EcoDet` en GitHub.
2. Ir a [render.com](https://render.com) → **New Blueprint**.
3. Conectar el repositorio de GitHub.
4. Render detecta el archivo `render.yaml` automáticamente y crea ambos servicios.
5. Esperar la finalización del build (aprox. 3-5 minutos).

### Actualizaciones continuas
Cada push a la rama `main` del repositorio dispara automáticamente el re-despliegue de ambos servicios en Render (CI/CD integrado).

### Inicialización de datos en producción
El script `seed.py` se ejecuta vía API tras el despliegue inicial para crear los datos demo:

```bash
# Ejecutar seed remotamente (requiere que el servidor esté activo)
curl -X POST https://ecodet.onrender.com/api/seed
```

---

## 3.5. Verificación del Despliegue

| Verificación | Comando / URL | Resultado esperado |
| :--- | :--- | :--- |
| Health check del backend | `GET https://ecodet.onrender.com/api/health` | `{"status": "ok", "db": "connected"}` |
| Acceso al frontend | `https://ecodet-1.onrender.com` | Pantalla de bienvenida de EcoDet |
| Login con demo | Credenciales demo → Panel principal | 3 inmuebles con historial cargado |
| Swagger UI | `https://ecodet.onrender.com/docs` | Documentación interactiva de la API |

---

## 3.6. Stack Tecnológico

| Capa | Tecnología | Versión |
| :--- | :--- | :--- |
| **Backend** | Python + FastAPI | Python 3.11 / FastAPI 0.100+ |
| **ORM** | SQLAlchemy | 2.0 |
| **Base de datos** | SQLite | 3.x |
| **Validación** | Pydantic | V2 |
| **Autenticación** | JWT + bcrypt | python-jose / bcrypt 4.x |
| **Frontend** | React | 18 |
| **Build tool** | Vite | 5.x |
| **Estilos** | Tailwind CSS | 3.x |
| **Gráficos** | Chart.js | 4.x |
| **Testing Backend** | pytest | 7.x |
| **Testing Frontend** | Vitest | 1.x |
| **Despliegue** | Render (IaC Blueprint) | — |
