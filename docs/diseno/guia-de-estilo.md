# EcoDet · Guía de estilo y diseño visual
**Taller de Tecnología Aplicada · Proyecto: Implementación de Scrum con Jira**  
**Versión:** 1.0 · **Fecha:** 20/10/2026 · **Product Owner:** Mateo

---

## 1. Principios de diseño del producto
1. **Comprensible sin conocimientos técnicos:** Carlos y Laura no entienden de "desvío estándar". Siempre se comunica en porcentaje y en consumo por día (ej.: `+48 %, 3,2 kWh/día vs 2,1`).
2. **Unidades físicas visibles:** Siempre indicar `kWh` para luz y `m³` para gas y agua. Nunca pedir ni mostrar dinero.
3. **Claridad de alertas (Accesibilidad WCAG AA):** Una anomalía no se comunica solo con color; va acompañada de ícono (`AlertTriangle`, `TrendingUp`, `TrendingDown`) y texto explicativo.
4. **Retroalimentación no destructiva:** Las acciones críticas (borrar inmueble o lectura) requieren diálogo de confirmación explícito advirtiendo qué datos asociados se eliminan.

---

## 2. Paleta de colores (Tokens de diseño Tailwind)

| Elemento | Código Hex | Clase Tailwind | Uso |
| :--- | :--- | :--- | :--- |
| **Primario** | `#0D9488` | `teal-600` | Botones principales, navegación, identidad EcoDet |
| **Secundario** | `#0F766E` | `teal-700` | Hover primario, acentos destacados |
| **Fondo principal** | `#F8FAFC` | `slate-50` | Fondo general de la aplicación |
| **Superficie / Cards** | `#FFFFFF` | `white` | Tarjetas de inmuebles, formularios, paneles |
| **Texto principal** | `#0F172A` | `slate-900` | Títulos y texto de alto contraste |
| **Texto secundario** | `#64748B` | `slate-500` | Subtítulos, etiquetas y unidades |

### Colores de servicio en gráficos (HU-10)
- 💡 **Luz:** `#F59E0B` (`amber-500`)
- 🔥 **Gas:** `#3B82F6` (`blue-500`)
- 💧 **Agua:** `#06B6D4` (`cyan-500`)

### Estados de alerta y validación
- ⚠️ **Alerta Alta:** `#EF4444` (`red-500` / fondo `red-50`)
- 📉 **Alerta Baja:** `#3B82F6` (`blue-500` / fondo `blue-50`)
- ⏳ **Estado Pendiente:** `#F59E0B` (`amber-500` / badge `amber-100`)
- ✅ **Estado Confirmada / Éxito:** `#10B981` (`emerald-500`)
- ⚪ **Estado Normal (descartada):** `#64748B` (`slate-500`)
- ❌ **Error de formulario:** `#DC2626` (`red-600`), ubicado debajo de cada input correspondiente.

---

## 3. Tipografía y Espaciado
- **Familia tipográfica:** `Inter`, `system-ui`, `-apple-system`, `sans-serif`.
- **Títulos:** `font-semibold` / `font-bold` (H1: `text-2xl`, H2: `text-xl`, H3: `text-lg`).
- **Cuerpo:** `text-sm` y `text-base` con interlineado holgado (`leading-relaxed`).
- **Formatos:**
  - Fechas: `dd/mm/aaaa` (ej.: `20/10/2026`).
  - Decimales: coma `,` para interfaz de usuario en español (ej.: `3,2 kWh/día`).
  - Consumo: número formateado seguido de su unidad fija (`kWh` o `m³`).
