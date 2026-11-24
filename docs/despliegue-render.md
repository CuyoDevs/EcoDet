# Guía de Despliegue en Render · EcoDet

Esta guía describe cómo desplegar **EcoDet** en la nube de [Render](https://render.com/) de forma 100% gratuita utilizando el Blueprint automático (`render.yaml`).

---

## 🚀 Método Rápido: Despliegue con Blueprint (Recomendado)

Render lee automáticamente el archivo `render.yaml` de la raíz del repositorio y crea los dos servicios necesarios con sus variables enlazadas:
1. **Backend:** Web Service en Python (FastAPI + SQLite + Uvicorn + Carga automática de datos de prueba `seed.py`).
2. **Frontend:** Static Site en Node.js (React + Vite SPA).

### Pasos:
1. Iniciar sesión en [dashboard.render.com](https://dashboard.render.com/) (puedes ingresar directamente con tu cuenta de GitHub).
2. Hacer clic en el botón **New +** (arriba a la derecha) y seleccionar **Blueprint**.
3. Seleccionar el repositorio de GitHub: `CuyoDevs/EcoDet`.
4. Render detectará el archivo `render.yaml`.
5. Hacer clic en **Apply**.
6. Render comenzará a construir y desplegar ambos servicios:
   - `ecodet-backend`: Instalará dependencias de Python, generará una `SECRET_KEY` aleatoria, poblará los datos demo (`seed.py`) y levantará FastAPI en el puerto asignado.
   - `ecodet-frontend`: Instalará dependencias de npm, compilará el frontend con `vite build` y lo conectará automáticamente a la URL del backend.

---

## 🔑 Credenciales Demo de la Aplicación Desplegada

Una vez desplegada la aplicación, puedes ingresar con el usuario precargado:
- **Correo:** `demo@ecodet.com`
- **Contraseña:** `Password123`

Este usuario cuenta con:
- **Casa Principal:** 8 lecturas de Luz con detector activo y alerta atípica; 7 lecturas de Gas con estacionalidad; 3 lecturas de Agua.
- **Departamento Centro:** Lecturas de Luz y Gas.
- **Cabaña de Verano:** Estado inicial vacío sin lecturas.

---

## ⚙️ Monitoreo y Verificación

- **Salud del Backend:** `https://<tu-backend>.onrender.com/api/health`
- **Documentación Swagger interactiva:** `https://<tu-backend>.onrender.com/docs`
- **Aplicación Web:** `https://<tu-frontend>.onrender.com/`

> **Nota sobre el plan gratuito:** Los servicios web gratuitos de Render entran en suspensión tras 15 minutos de inactividad. La primera petición tras un período de inactividad puede demorar entre 30 y 45 segundos en despertar.
