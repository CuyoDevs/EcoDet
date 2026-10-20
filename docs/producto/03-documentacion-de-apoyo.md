# Documentación de apoyo del producto
## Detector de anomalías en consumo del hogar · Casos de uso, reglas, decisiones y wireframes
**Taller de Tecnología Aplicada · Proyecto: Implementación de Scrum con Jira**  
**Versión:** 1.0 (20/10/2026) · **Product Owner:** Mateo

---

## 1. Decisiones de diseño tomadas
1. **Magnitud del desvío:** Se muestra como porcentaje sobre el promedio de referencia, junto con el consumo por día frente al habitual (ej.: `+48 %, 3,2 kWh/día vs 2,1`).
2. **Estaciones del año:** Estaciones meteorológicas del hemisferio sur:
   - Verano: dic–feb
   - Otoño: mar–may
   - Invierno: jun–ago
   - Primavera: sep–nov
   Una lectura se asigna a la estación de su punto medio.
3. **Días del período:** Cuenta inclusiva: $\text{Fin} - \text{Inicio} + 1$. Los períodos consecutivos no se superponen.
4. **Referencia del detector:** La lectura evaluada no forma parte de su propia referencia.
5. **Desvío cero o muy chico:** $\text{Desvío efectivo} = \max(\text{desvío estándar muestral } s, 10\% \text{ del promedio } \bar{x})$.
6. **Cambios sobre alertas:** Marcar "normal" y cambiar el umbral se aplican solo a las detecciones siguientes (no recalcula hacia atrás).
7. **Editar y eliminar lecturas:** CU-09 disponible con prioridad Should.
8. **Estados de alerta:** `Pendiente` $\rightarrow$ `Confirmada` o `Normal`.
9. **Carga histórica con errores:** Todo o nada: se muestran los errores y no se guarda ninguna fila si hay fallas o superposiciones.
10. **Cuenta de usuario:** Contraseña de al menos 8 caracteres con letras y números cifrada con bcrypt.
11. **Mínimo de lecturas:** Parámetro del sistema (6 lecturas).
12. **Datos de ejemplo:** Un inmueble demo con 24 meses de luz y gas y 12 de agua, con 2 anomalías altas y 1 baja por servicio.

---

## 2. Catálogo de Reglas de Negocio

| ID | Regla | Detalle | Usada en |
| :--- | :--- | :--- | :--- |
| **RN-01** | Aislamiento de datos | Cada usuario accede únicamente a sus propios inmuebles, lecturas y alertas. | Todos los CU |
| **RN-02** | Consumo físico | Solo se carga consumo físico, nunca dinero. Luz en kWh, gas y agua en m³. | CU-04 |
| **RN-03** | Fechas de lectura | Fecha de fin no anterior a inicio ni posterior a la fecha actual. | CU-04, CU-09 |
| **RN-04** | Agua opcional | La aplicación opera solo con luz y gas sin errores si falta agua. | CU-04, CU-05 |
| **RN-05** | Valor del consumo | Numérico y mayor o igual a cero ($Consumo \ge 0$). | CU-04, CU-09 |
| **RN-06** | Consumo por día | $Consumo / (\text{Fin} - \text{Inicio} + 1)$. | CU-05, CU-06 |
| **RN-07** | Mínimo de lecturas | 6 lecturas por servicio e inmueble. Con menos: *"aún estamos aprendiendo tu patrón"*. Si tras excluir normales quedan menos de 3, tampoco se evalúa. | CU-04, 06, 07 |
| **RN-08** | Referencia y estación | Si hay $\ge 3$ lecturas de la misma estación, se usa esa referencia; si no, historial general. | CU-06 |
| **RN-09** | Umbral | Valor inicial de 2 desvíos, configurable por servicio e inmueble ($>0$). | CU-06, CU-07 |
| **RN-10** | Alertas alta y baja | Alta si supera límite superior; baja si queda bajo límite inferior. | CU-06 |
| **RN-11** | Alerta "normal" | La lectura marcada como normal se excluye de las detecciones futuras. | CU-06, CU-07 |
| **RN-12** | Cálculo estadístico | Promedio simple, desvío muestral ($n-1$), piso del 10% del promedio. Lectura evaluada fuera de la referencia. | CU-06 |
| **RN-13** | Estados de alerta | Nace en `Pendiente`. Puede pasar a `Confirmada` o `Normal`. | CU-06, CU-07 |
| **RN-14** | Sin superposición | Dos lecturas del mismo servicio e inmueble no pueden superponerse en fecha. | CU-04, CU-09 |
| **RN-15** | Contraseña segura | Mínimo 8 caracteres, alfanumérica, guardada con hash seguro (bcrypt). | CU-01 |
| **RN-16** | Datos de ejemplo | Solo 1 inmueble demo por usuario, identificable, eliminable y recargable. | CU-08 |
| **RN-17** | Hacia adelante | Los cambios de configuración y marcado normal aplican solo a detecciones futuras. | CU-07, CU-09 |

---

## 3. Casos de Uso del Sistema

- **CU-01:** Registrarse (Visitante)
- **CU-02:** Iniciar sesión (Visitante)
- **CU-03:** Gestionar inmuebles: crear, editar, eliminar (Usuario)
- **CU-04:** Cargar lecturas: individual y lote histórico (Usuario)
- **CU-05:** Consultar historial y gráficos de consumo (Usuario)
- **CU-06:** Detectar anomalías en el consumo (Sistema - automático)
- **CU-07:** Gestionar alertas: consultar, confirmar, marcar normal, ajustar umbral (Usuario)
- **CU-08:** Cargar datos de ejemplo (Usuario)
- **CU-09:** Editar o eliminar una lectura (Usuario)
- **CU-10:** Cerrar sesión (Usuario)

---

## 4. Wireframes de referencia

### W1 · Inicio de sesión y registro (CU-01, CU-02, CU-10)
```
+--------------------------------------------------------------------------------------------+
|    DETECTOR DE CONSUMO DEL HOGAR                                                           |
|                                                                                            |
|    [ Iniciar sesión ]  [ Registrarse ]                                                     |
|                                                                                            |
|    Nombre       [______________________]   (solo registro)                                 |
|    Correo       [______________________]                                                   |
|    Contraseña   [______________________]   mín. 8, letras y números                        |
|                                                                                            |
|    [            Entrar / Crear cuenta           ]                                          |
|    Errores debajo de cada campo (mensaje genérico en el login)                             |
+--------------------------------------------------------------------------------------------+
```

### W2 · Panel de inmuebles (CU-03, CU-08)
```
+--------------------------------------------------------------------------------------------+
|  Mis inmuebles                                    [Cerrar sesión]                          |
|                                                                                            |
|  [+ Nuevo inmueble]   [Cargar datos de ejemplo]                                            |
|                                                                                            |
|  Mi casa            Luz  Gas  Agua    2 alertas pendientes  [Editar][Eliminar]             |
|  Casa de mamá       Luz  Gas          sin alertas           [Editar][Eliminar]             |
|  Demo (ejemplo)     Luz  Gas  Agua    9 alertas             [Eliminar]                     |
|                                                                                            |
|  Eliminar: aviso de que se borran lecturas y alertas + confirmación                        |
+--------------------------------------------------------------------------------------------+
```

### W3 · Carga de lecturas (CU-04)
```
+--------------------------------------------------------------------------------------------+
|  Inmueble: Mi casa                                                                         |
|  [ Lectura individual ]  [ Carga histórica ]                                               |
|                                                                                            |
|  Servicio:  (o) Luz kWh   ( ) Gas m3   ( ) Agua m3 (opcional)                              |
|  Desde [dd/mm/aaaa]   Hasta [dd/mm/aaaa]   Consumo [______] kWh                            |
|  [Guardar lectura]                                                                         |
|                                                                                            |
|  Resultado: guardada / alerta generada / "aún estamos aprendiendo tu patrón"               |
|                                                                                            |
|  Histórica:  Desde | Hasta | Consumo   [+ fila]   [Guardar todo]                           |
|              errores marcados por fila; no se guarda hasta corregir                        |
+--------------------------------------------------------------------------------------------+
```

### W4 · Historial y gráficos (CU-05, CU-09)
```
+--------------------------------------------------------------------------------------------+
|  Mi casa      [ Luz ]  [ Gas ]  [ Agua ]                                                   |
|                                                                                            |
|  kWh/día                                                                                   |
|   |                          (!)  <- lectura con alerta destacada                          |
|   |   *      *       *          *                                                          |
|   |  *   *       *    *   *    *                                                           |
|   +------------------------------------------->  períodos                                  |
|                                                                                            |
|  Punto elegido: 01/06 al 30/06 | 3,2 kWh/día | 96 kWh                                      |
|  [Editar lectura]  [Eliminar lectura]                                                      |
+--------------------------------------------------------------------------------------------+
```

### W5 · Alertas y umbral (CU-07)
```
+--------------------------------------------------------------------------------------------+
|  Alertas de Mi casa                 Filtro: [ Pendientes v ]                               |
|                                                                                            |
|  Luz | 01/06-30/06 | ALTO | +48 % sobre lo habitual | Pendiente                            |
|  Gas | 01/05-30/05 | BAJO | -35 % sobre lo habitual | Pendiente                            |
|                                                                                            |
|  Detalle: gráfico del período, consumo por día vs habitual                                 |
|  [Confirmar]   [Marcar como normal]                                                        |
|                                                                                            |
|  Umbral de Luz: [ 2,0 ] desvíos   [Guardar]   más umbral = menos alertas                   |
+--------------------------------------------------------------------------------------------+
```
