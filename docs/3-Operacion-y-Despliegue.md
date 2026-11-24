# EcoDet · Documentación de Operación y Despliegue
## Taller de Tecnología Aplicada (EGI) · Manual de Usuario e Instalación

**Cátedra:** Taller de Tecnología Aplicada (EGI)  
**Proyecto:** EcoDet — Detector de anomalías en consumo del hogar (Luz, Gas y Agua)  
**Equipo:** CuyoDevs  
**Fecha de Presentación:** Miércoles 25/11/2026  
**Repositorio GitHub:** [https://github.com/CuyoDevs/EcoDet](https://github.com/CuyoDevs/EcoDet)  
**Versión del documento:** 1.1 (corregida contra la interfaz, el código y `render.yaml` del repositorio)

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

La cuenta demo trae 3 inmuebles:

| Inmueble | Contenido |
| :--- | :--- |
| **Casa Principal** | 8 lecturas de luz (con una alerta de consumo alto), 7 de gas con variación estacional y 3 de agua (el detector todavía está aprendiendo). |
| **Departamento Centro** | 5 lecturas de luz y 5 de gas. |
| **Cabaña de Verano** | Sin lecturas, para mostrar el estado vacío. |

> **Importante:** estos datos se vuelven a crear cada vez que arranca el servicio (ver sección 3.4). Cualquier cambio que se haga con la cuenta demo en producción se pierde en el próximo arranque.

---

## 1.2. Registro y Acceso

La pantalla de acceso tiene dos pestañas: **Iniciar sesión** y **Registrarse**.

### Crear una cuenta nueva
1. Ingresar a `https://ecodet-1.onrender.com`.
2. Abrir la pestaña **"Registrarse"**.
3. Completar **Nombre**, **Correo** y **Contraseña**. La contraseña debe tener al menos 8 caracteres, con letras y números.
4. Hacer clic en **"Crear cuenta"**. La sesión se inicia automáticamente y se muestra el panel vacío con la invitación a crear el primer inmueble.

### Iniciar sesión
1. En la pestaña **"Iniciar sesión"**, completar correo y contraseña.
2. Hacer clic en **"Entrar"**.
3. Se abre el **Panel de inmuebles**. Si las credenciales son incorrectas, el mensaje de error es genérico y no indica cuál dato falló.

### Cerrar sesión
- Hacer clic en el botón **"Cerrar sesión"** del panel. Se vuelve a la pantalla de acceso.

---

## 1.3. Gestión de Inmuebles

Los inmuebles son las propiedades donde se registran los consumos (casa, departamento, local comercial). Cada usuario puede tener varios y solo ve los suyos.

### Agregar un inmueble
1. En el panel, hacer clic en **"Nuevo inmueble"**.
2. Completar el nombre (obligatorio y distinto del de otros inmuebles propios) y, si se quiere, la dirección.
3. Confirmar el formulario.

### Editar un inmueble
1. En la tarjeta del inmueble, hacer clic en el ícono de lápiz.
2. Modificar nombre y/o dirección.
3. Guardar los cambios. Las lecturas y alertas del inmueble no se modifican.

### Eliminar un inmueble
1. En la tarjeta del inmueble, hacer clic en el ícono de papelera.
2. Confirmar la eliminación en el diálogo de confirmación.
> **Atención:** Eliminar un inmueble borra permanentemente todas sus lecturas, alertas y umbrales.

### Cargar datos de ejemplo
- El botón **"Cargar datos de ejemplo"** del panel crea un inmueble de demostración (24 meses de luz y gas y 12 de agua, con 2 anomalías altas y 1 baja por servicio). Solo se puede tener uno por usuario; para volver a cargarlo hay que eliminar el anterior.

---

## 1.4. Carga de Lecturas de Consumo

Las lecturas representan las facturas de servicios (Luz, Gas, Agua). Se registran en unidades físicas: **kWh** para Luz y **m³** para Gas y Agua (nunca en dinero). El agua es opcional: se puede usar la aplicación solo con luz y gas.

### Cargar una lectura individual
1. En la tarjeta del inmueble, hacer clic en **"+ Cargar consumo"**.
2. En la pestaña **"Lectura individual"**, elegir el **Servicio** (Luz, Gas o Agua).
3. Completar **Fecha de inicio**, **Fecha de fin** y **Consumo** (kWh o m³).
4. Hacer clic en **"Registrar consumo"**.

Validaciones: la fecha de fin no puede ser anterior al inicio ni posterior a hoy, el consumo debe ser un número mayor o igual a cero y el período no puede superponerse con otra lectura del mismo servicio.

> El sistema calcula el consumo por día y evalúa la lectura. Si el servicio ya tiene 6 o más lecturas y la nueva se aleja de lo habitual, aparece un aviso de consumo alto o bajo en el momento.

### Carga histórica en lote
Para cargar varias facturas pasadas de una vez:
1. En el formulario de **"+ Cargar consumo"**, abrir la pestaña **"Carga histórica (lote)"**.
2. Completar una fila por factura (servicio, inicio, fin y consumo), agregando o quitando filas.
3. Hacer clic en **"Guardar lote de facturas"**. La operación es **todo o nada**: si alguna fila es inválida o se superpone, se indica cuál y por qué, y no se guarda ninguna.
4. Si todo es válido, se muestra un resumen con las lecturas cargadas y las alertas generadas.

### Editar o eliminar una lectura
1. En la tarjeta del inmueble, hacer clic en **"Ver historial"**.
2. En el servicio correspondiente, usar **Editar** o **Eliminar** sobre la lectura.
3. Al editar, esa lectura se vuelve a evaluar y su alerta anterior se reemplaza por el nuevo resultado. Las alertas de otras lecturas no se recalculan.

---

## 1.5. Historial y Gráficos

En **"Ver historial"** se muestra, para cada servicio:
- **Gráfico de consumo** ordenado por período, con las lecturas que tienen alerta resaltadas.
- **Detalle al seleccionar un punto**: período, consumo y consumo por día.
- **Franja habitual** (promedio ± umbral), que se puede mostrar u ocultar con la casilla **"Mostrar franja habitual"**. Solo aparece cuando el detector ya está activo.
- Si el inmueble no tiene lecturas, un acceso directo **"+ Cargar la primera lectura"**.

### Estado "Aprendiendo"
Si hay menos de **6 lecturas** cargadas para un servicio, el sistema muestra:
- El mensaje "aún estamos aprendiendo tu patrón" y no genera alertas.
- Una barra de progreso con cuántas lecturas faltan para activar el detector.

---

## 1.6. Panel de Alertas

El panel de alertas reúne las anomalías detectadas de un inmueble.

### Acceder al panel
- En la tarjeta del inmueble, hacer clic en **"Alertas"** (muestra además la cantidad de alertas pendientes).

### Tipos de alertas
| Tipo | Significado |
| :--- | :--- |
| 🔴 **ALTA** | El consumo superó el límite superior habitual. Posible pérdida o uso excesivo. |
| 🔵 **BAJA** | El consumo cayó por debajo del límite inferior. Lectura inusualmente baja. |

Cada alerta indica servicio, período, tipo y cuánto se aleja de lo habitual (porcentaje sobre el promedio y consumo por día frente al habitual).

### Estados de una alerta
| Estado | Significado |
| :--- | :--- |
| **PENDIENTE** | La alerta fue detectada y está esperando revisión. |
| **CONFIRMADA** | El usuario la revisó y confirmó que fue un consumo anormal. No cambia el cálculo del detector. |
| **NORMAL** | El usuario indicó que el consumo atípico tuvo causa justificada (pileta, invitados, etc.). La lectura se excluye de las detecciones futuras. |

### Acciones sobre alertas
- **Filtrar:** por servicio (Luz / Gas / Agua) y por estado.
- **Confirmar:** deja registrada la alerta como revisada.
- **Marcar como normal:** pide confirmación y excluye esa lectura del cálculo del promedio y del desvío a partir de ese momento.

---

## 1.7. Ajuste de Sensibilidad

Permite personalizar qué tan estricto es el detector para cada servicio e inmueble.

1. En la tarjeta del inmueble, entrar a **"Alertas"**.
2. En la sección **"Sensibilidad del detector"**, escribir el valor del umbral (cantidad de desvíos estándar) de cada servicio y hacer clic en **"Guardar"**.
3. Se acepta cualquier número **mayor que cero**; valores inválidos se rechazan y se conserva el anterior.

Referencia: el valor inicial es **2** desvíos. Un umbral mayor genera menos alertas (por ejemplo 3: solo variaciones muy grandes) y uno menor genera más (por ejemplo 1: detecta variaciones pequeñas). El cambio se aplica a las lecturas que se carguen o editen desde ese momento; no recalcula las alertas ya generadas.

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

### Variables de entorno (opcional en desarrollo)

El archivo `backend/.env.example` trae la configuración de ejemplo. En desarrollo local alcanza con los valores por defecto. Fuera de `ENVIRONMENT=development` el backend exige una `SECRET_KEY` propia: con la clave de desarrollo no emite ni valida tokens y el login falla.

Los parámetros del detector (mínimo de lecturas = 6, umbral inicial = 2 desvíos, piso del desvío = 10 % del promedio) están en `backend/config.json`.

### Iniciar el servidor de desarrollo

```bash
# (desde la carpeta backend/, con el entorno virtual activo)
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

El backend queda disponible en: `http://127.0.0.1:8000`  
Documentación Swagger local: `http://127.0.0.1:8000/docs`

### Atajo rápido (Windows)
Desde la raíz del proyecto (crea `backend/.env` a partir de `.env.example` si no existe):
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

El frontend queda disponible en: `http://127.0.0.1:5173` (también en `http://localhost:5173`). En desarrollo, Vite reenvía las llamadas a `/api` al backend en `http://127.0.0.1:8000`, por lo que el backend debe estar corriendo.

### Atajo rápido (Windows)
Desde la raíz del proyecto:
```powershell
.\run-frontend.bat
```

---

## 2.5. Cargar Datos de Demo (Opcional)

Hay dos formas de tener datos de demostración:

**a) Script `seed.py`** (usuario demo con 3 inmuebles):

```bash
# (desde la carpeta backend/; no requiere que el servidor esté corriendo)
python seed.py
```

Crea el usuario `demo@ecodet.com` / `Password123` con los inmuebles Casa Principal, Departamento Centro y Cabaña de Verano (ver sección 1.1). Si el usuario ya existe, **borra sus inmuebles y los vuelve a crear**.

**b) Botón "Cargar datos de ejemplo"** dentro de la aplicación (HU-19): crea un inmueble de demostración con anomalías conocidas en la cuenta con la sesión iniciada.

---

## 2.6. Ejecutar Tests Automáticos

### Backend (pytest)

Se ejecuta **desde la raíz del repositorio** (los tests importan el paquete como `backend.app`; correrlos desde `backend/` falla con `ModuleNotFoundError`):

```bash
# (desde la raíz del repo, con el entorno virtual activo)
python -m pytest backend/tests -v
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
| **Base de Datos** | SQLite (archivo dentro del contenedor del backend) | — | ✅ Conectada |

> **Persistencia:** la base SQLite vive en el disco del contenedor del plan gratuito, que no es persistente. Los datos creados en producción pueden perderse en un nuevo despliegue o reinicio. Para el alcance de la materia alcanza con los datos demo que se regeneran en cada arranque.

---

## 3.2. Blueprint de Render (render.yaml)

El archivo `render.yaml` en la raíz del repositorio define los dos servicios como código (IaC) y permite reproducir el despliegue desde el panel de Render. Contenido actual:

```yaml
services:
  # Backend API - FastAPI (Python)
  - type: web
    name: ecodet-backend
    runtime: python
    rootDir: backend
    plan: free
    buildCommand: pip install -r requirements.txt
    startCommand: python seed.py && uvicorn app.main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: ENVIRONMENT
        value: production
      - key: SECRET_KEY
        generateValue: true
      - key: ACCESS_TOKEN_EXPIRE_MINUTES
        value: "1440"
      - key: CORS_ORIGINS
        value: "http://localhost:5173,http://127.0.0.1:5173"
      - key: PYTHON_VERSION
        value: 3.11.8

  # Frontend Web - React + Vite SPA
  - type: web
    name: ecodet-frontend
    runtime: static
    rootDir: frontend
    plan: free
    buildCommand: npm install && npm run build
    staticPublishPath: dist
    routes:
      - type: rewrite
        source: /*
        destination: /index.html
    envVars:
      - key: VITE_API_URL
        fromService:
          type: web
          name: ecodet-backend
          property: url
```

---

## 3.3. Configuraciones Clave de Producción

### Secretos
Render genera una `SECRET_KEY` aleatoria (`generateValue: true`). Con `ENVIRONMENT=production` el backend no emite ni valida tokens si la clave es la de desarrollo.

### CORS (Backend)
El backend permite los orígenes de la variable `CORS_ORIGINS` (los de desarrollo local) y, además, cualquier subdominio `*.onrender.com`, para que el frontend y el backend desplegados como servicios separados puedan comunicarse:

```python
# backend/app/main.py
origins = [origin.strip() for origin in settings.CORS_ORIGINS.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_origin_regex=r"^https:\/\/.*\.onrender\.com$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### URL del backend (Frontend)
El frontend toma la URL del backend de `VITE_API_URL` (que el Blueprint enlaza con la URL del servicio `ecodet-backend`). Si la variable no está definida: en local deja la URL vacía y Vite reenvía `/api` al backend local, y fuera de local usa `https://ecodet.onrender.com`:

```javascript
// frontend/src/api/client.js
const isLocal = typeof window !== 'undefined'
  && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
const defaultUrl = isLocal ? '' : 'https://ecodet.onrender.com'
const rawApiUrl = import.meta.env?.VITE_API_URL || defaultUrl
```

---

## 3.4. Proceso de Despliegue

### Primer despliegue
1. Tener acceso al repositorio `CuyoDevs/EcoDet` en GitHub (o un fork).
2. Ir a [render.com](https://render.com) → **New +** → **Blueprint**.
3. Conectar el repositorio de GitHub.
4. Render detecta `render.yaml` y crea ambos servicios; hacer clic en **Apply**.
5. Esperar la finalización del build (aprox. 3-5 minutos).

### Actualizaciones
Render vuelve a desplegar los servicios cuando se actualiza la rama conectada (despliegue continuo). El repositorio no tiene un pipeline de integración continua: los tests automáticos se ejecutan a mano (sección 2.6).

### Datos demo en producción
No hay un endpoint para sembrar datos. El comando de inicio del backend (`python seed.py && uvicorn ...`) ejecuta `seed.py` **en cada arranque del servicio**: crea el usuario demo si no existe y, si existe, borra y recrea sus inmuebles. Por eso la cuenta demo siempre vuelve a su estado inicial.

---

## 3.5. Verificación del Despliegue

| Verificación | Comando / URL | Resultado esperado |
| :--- | :--- | :--- |
| Health check del backend | `GET https://ecodet.onrender.com/api/health` | `{"status": "ok", "database": "Conectado (SQLite)", "detector_parameters": {...}, "environment": "production"}` |
| Acceso al frontend | `https://ecodet-1.onrender.com` | Pantalla de acceso de EcoDet (pestañas Iniciar sesión / Registrarse) |
| Login con demo | Credenciales demo → Panel de inmuebles | 3 inmuebles: Casa Principal, Departamento Centro y Cabaña de Verano |
| Swagger UI | `https://ecodet.onrender.com/docs` | Documentación interactiva de la API |

---

## 3.6. Stack Tecnológico

Versiones según `backend/requirements.txt`, `frontend/package.json` y `render.yaml`.

| Capa | Tecnología | Versión |
| :--- | :--- | :--- |
| **Backend** | Python + FastAPI | Python 3.11 (Render: 3.11.8) / FastAPI ≥ 0.110 |
| **ORM** | SQLAlchemy | ≥ 2.0.28 |
| **Base de datos** | SQLite | 3.x |
| **Validación y configuración** | Pydantic + pydantic-settings | Pydantic V2 (≥ 2.6.4) |
| **Autenticación** | JWT (python-jose) + bcrypt (uso directo) | python-jose ≥ 3.4 / bcrypt ≥ 4.0.1 |
| **Frontend** | React | 18 |
| **Build tool** | Vite | 5.x |
| **Estilos** | Tailwind CSS | 3.x |
| **Gráficos** | Chart.js + react-chartjs-2 | Chart.js 4.x |
| **Testing Backend** | pytest + httpx | pytest ≥ 8.0 |
| **Testing Frontend** | Vitest | 1.x |
| **Despliegue** | Render (Blueprint `render.yaml`) | — |
