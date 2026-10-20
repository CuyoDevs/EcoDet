# Detector de anomalías en consumo de servicios del hogar
## Definición del producto: objetivo, alcance y MVP
**Materia:** Taller de Tecnología Aplicada · **Proyecto:** Implementación de Scrum con Jira  
**Product Owner:** Mateo · **Versión:** 1.0 (20/10/2026)

---

## 1. Objetivo del producto

### Descripción general
El producto es una aplicación web donde el usuario registra el consumo de luz, gas y agua de su hogar, expresado en las unidades físicas de cada factura o medidor (kWh o m³) y no en dinero. A partir de ese historial, el sistema se adapta al patrón habitual de cada inmueble y avisa cuando una lectura se aleja de lo normal, indicando el servicio, el período y cuánto se desvió.

Luz y gas son los servicios base del producto. El agua es un servicio opcional: se carga cuando el usuario cuenta con consumo medido (ver "Problema que resuelve").

### Problema que resuelve
Las fugas, los aparatos defectuosos o los malos hábitos de consumo suelen detectarse recién cuando llega una factura muy alta, es decir, cuando el recurso ya se gastó y el costo ya se generó. Además, quien mira solo el monto no distingue si el aumento se debe a un cambio de tarifa, a un impuesto o a un consumo real más alto.

En Mendoza el cuidado del agua es un tema central, pero hay una limitación real: solo una minoría de los hogares tiene medidor de agua, y la mayoría paga una tarifa fija en la que la factura no informa consumo. Por eso el producto permite cargar agua cuando existe una lectura (de la factura de consumo medido o del medidor propio del usuario), y no depende de ella para funcionar: la detección con luz y gas ya aporta valor por sí sola.

### Objetivo general
Permitir que las personas detecten a tiempo consumos inusuales de luz, gas y agua en su hogar, para que puedan actuar antes de que se conviertan en un gasto elevado o en un desperdicio de recursos.

### Objetivos específicos
- Centralizar en un solo lugar el historial de consumo de luz, gas y agua de uno o varios inmuebles.
- Visualizar la evolución del consumo por servicio mediante gráficos claros.
- Identificar automáticamente los consumos que se apartan del comportamiento habitual del hogar, tanto por exceso como por defecto, considerando la estación del año cuando hay datos suficientes.
- Comunicar la anomalía de forma comprensible, indicando servicio, período y magnitud del desvío.
- **Efecto esperado:** que la visibilidad del consumo favorezca un uso más responsable de los recursos, en particular del agua. En el MVP este efecto es una consecuencia buscada, no una funcionalidad; las causas posibles y los consejos de ahorro se incorporan en el Release 2.

### Usuarios destinatarios
Personas y familias que quieren controlar el consumo de su hogar, sin conocimientos técnicos ni estadísticos. Un mismo usuario puede gestionar más de un inmueble (por ejemplo, su casa y la de un familiar).

### Valor diferencial
1. Trabaja con **consumo físico** y no con dinero, por lo que no depende de tarifas ni impuestos.
2. Se **adapta al historial** de cada hogar en lugar de usar valores fijos iguales para todos.
3. Considera la **estacionalidad** (invierno y verano cambian el consumo) cuando hay datos suficientes.
4. No exige instalar medidores ni dispositivos: alcanza con los datos de las facturas.
5. Permite **cargar las últimas facturas de una sola vez**, así el detector funciona desde el primer día.

---

## 2. Alcance del proyecto

### Estructura general
El producto se plantea como un proyecto de 6 sprints, organizado en 3 releases de 2 sprints cada uno. Cada release entrega valor por sí mismo y se apoya en el anterior. Por razones de tiempo, el trabajo práctico de la materia se concentra exclusivamente en el **Release 1 (MVP)**, que se desarrolla en los 2 sprints de la cursada. Los Releases 2 y 3 definen la visión y los límites del producto.

### Release 1 (Sprints 1 y 2): MVP, alcance de la materia
*Objetivo:* que un usuario pueda cargar sus consumos, verlos en el tiempo y recibir una alerta cuando algo se aleja de lo normal.
- Registro e inicio de sesión de usuarios.
- Gestión de uno o varios inmuebles por usuario.
- Carga manual de lecturas por servicio (luz, gas y agua opcional) y por período, incluida la carga histórica de facturas anteriores.
- Historial de consumo con gráficos por servicio.
- Detección de anomalías con un método estadístico simple (desvío respecto del promedio histórico y de la estación del año).
- Alertas dentro de la aplicación ante consumos inusuales, altos o bajos.
- Posibilidad de marcar una alerta como "normal" y ajustar el umbral de sensibilidad.
- Datos de ejemplo para demostrar el funcionamiento del detector.

### Release 2 (Sprints 3 y 4): mejora de la experiencia
*Objetivo:* que la aplicación sea más cómoda de usar y más útil para decidir qué hacer ante una alerta.
- Notificaciones por correo electrónico.
- Carga de datos a partir de una foto de la factura mediante OCR.
- Sugerencia de posibles causas para cada alerta (fuga, aparato defectuoso, pico estacional).
- Consejos de ahorro según el tipo de anomalía.

### Release 3 (Sprints 5 y 6): inteligencia y comparación
*Objetivo:* pasar de un análisis estadístico simple a uno más avanzado y comparativo.
- Comparación del consumo con el promedio de hogares similares.
- Modelos de detección más sofisticados (por ejemplo, aprendizaje automático o ajuste por clima).
- Reportes y exportación de datos.
- Metas de ahorro y seguimiento de la evolución del consumo.
- Versión móvil o responsive avanzada.

---

## 3. Límites

### Límites del producto (lo que el producto no hace)
- No registra ni calcula dinero, tarifas ni impuestos: trabaja únicamente con consumo físico (kWh, m³).
- No se conecta con medidores inteligentes ni con las empresas proveedoras de los servicios.
- No controla ni apaga dispositivos del hogar.
- No diagnostica con certeza la causa de una anomalía; en el MVP solo detecta y avisa.
- No reemplaza la revisión de un profesional ante una sospecha de pérdida o falla.
- No es un sistema de facturación ni de reclamos ante los proveedores.

### Límites del proyecto (lo que queda fuera de la materia)
- Todo lo correspondiente a los Releases 2 y 3: notificaciones por mail, OCR de facturas, causas y consejos de ahorro, comparación con otros hogares, modelos avanzados, reportes y versión móvil.
- Modelos de inteligencia artificial o aprendizaje automático: el MVP usa solo estadística simple.
- Despliegue en producción para uso masivo.

### Supuestos y restricciones
- Las lecturas las carga el usuario a partir de sus facturas o de su medidor, por lo que el volumen de datos es bajo (típicamente una lectura por período de facturación, mensual o bimestral).
- El servicio de agua depende de que el usuario tenga consumo medido; si no lo tiene, usa el producto con luz y gas.
- El tiempo disponible es de 2 sprints, lo que obliga a priorizar únicamente lo esencial.
- Al inicio hay pocos datos por usuario, por lo que se define un mínimo de lecturas antes de generar alertas, se ofrece la carga histórica y se usan datos de ejemplo para la demostración.

---

## 4. MVP (Minimum Viable Product)

### Objetivo del MVP
Comprobar que un usuario puede cargar sus consumos, verlos a lo largo del tiempo y recibir una alerta útil cuando una lectura se aleja de lo habitual, usando solo estadística simple y carga manual de datos.

### Flujo principal de uso
1. El usuario se registra e inicia sesión.
2. Crea uno o más inmuebles.
3. Carga las lecturas de cada servicio por período, incluyendo sus últimas facturas (carga histórica).
4. Consulta el historial y los gráficos por servicio.
5. Si una lectura se aleja de lo normal, recibe una alerta en la aplicación.
6. Revisa la alerta: la confirma, la marca como "normal" o ajusta el umbral de sensibilidad.

### Reglas del detector de anomalías en el MVP
- **Unidad de comparación:** consumo por día ($Consumo / (\text{Fin} - \text{Inicio} + 1)$).
- **Mínimo de lecturas:** 6 lecturas por servicio e inmueble. Con menos, muestra *"aún estamos aprendiendo tu patrón"*.
- **Estacionalidad:** si hay al menos 3 lecturas de la misma estación del año, se compara contra ellas. Si no, contra el historial general.
- **Umbral:** inicial de 2 desvíos estándar, ajustable por inmueble y servicio.
- **Desvío efectivo:** mayor entre el desvío estándar muestral ($n-1$) y el 10% del promedio.
- **Consumo alto y bajo:** Alerta alta si supera $Promedio + Umbral \times DesvíoEfectivo$; baja si queda por debajo de $Promedio - Umbral \times DesvíoEfectivo$.
- **Alerta "normal":** la lectura marcada como normal se excluye de las detecciones futuras.
