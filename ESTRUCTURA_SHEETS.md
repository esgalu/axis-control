# Estructura Recomendada para Google Sheets - v1.1

## Resumen Ejecutivo

La estructura actual de SAVINGS mezcla 3 conceptos diferentes en una sola hoja. Esta propuesta separa los datos en 3 hojas claras, cada una con un propósito específico.

---

## Estado Actual (v1.0)

### SAVINGS (Hoja única)
- **Filas 2-23**: Cuentas activas con snapshots semanales
- **Filas 24-40**: Transacciones individuales (depósitos/retiros)
- **Fila 43**: Totales (suma de todas las cuentas)
- **Columnas E+**: Saldos por fecha
- **Columnas después del gap**: Diferencias diarias (innecesarias)

**Problemas:**
- Datos históricos y transacciones mezclados
- Columnas de diferencias redundantes
- Cuentas cerradas ocupan espacio (0 saldos)
- Difícil de mantener cuando crece el número de transacciones

---

## Propuesta Restructurada (v1.1)

### 1. Hoja **SNAPSHOTS** (antes SAVINGS, limpia)

**Propósito:** Registrar el estado de cada cuenta en fechas específicas (ej: semanalmente)

**Estructura:**

| FECHA | BANCO | ETIQUETA | SALDO |
|-------|-------|----------|-------|
| 2025-12-16 | NU | VIAJES | 2184299 |
| 2025-12-16 | NU | CAJA FUERTE | 24897687 |
| ... | ... | ... | ... |
| 2026-06-22 | NU | VIAJES | 7330720 |
| 2026-06-22 | NU | CAJA FUERTE | 28117105 |

**Reglas:**
- Una fila = una cuenta en una fecha
- Solo cuentas activas (SALDO > 0)
- Fechas consistentes (ej: siempre domingo de cada semana)
- Sin columnas de diferencias
- Sin cuentas cerradas

**Ventajas:**
- Fácil de buscar: "¿Cuál era el saldo de NU-VIAJES el 2026-06-22?"
- Escalable: agregar nuevas fechas es agregar filas
- Sin redundancia: una fecha por línea

---

### 2. Hoja **MOVIMIENTOS** (nueva)

**Propósito:** Registrar cada transacción (depósito, retiro, transferencia entre cuentas)

**Estructura:**

| FECHA | BANCO | ETIQUETA | MONTO | TIPO | DESCRIPCION |
|-------|-------|----------|-------|------|-------------|
| 2026-01-30 | NU | TRIAJE | 784000 | DEPOSITO | Salario enero |
| 2026-02-16 | NU | TRIAJE | 1000000 | DEPOSITO | Bono |
| 2026-05-19 | NU | TRIAJE | -4500000 | RETIRO | Transferencia a inversión |
| 2026-05-12 | TRI | AMDVASCCO | 648000 | COMPRA | Compra de acciones |
| 2026-05-12 | TRI | AMDVASCCO | -48600 | VENTA | Venta parcial |

**Reglas:**
- Una fila = una transacción
- MONTO: positivo (entrada) o negativo (salida)
- TIPO: DEPOSITO, RETIRO, COMPRA, VENTA, TRANSFERENCIA
- FECHA: exacta (no necesita ser semanal)
- DESCRIPCION: opcional pero útil para auditoría

**Ventajas:**
- Historial completo de actividad
- Filtrable por tipo, fecha, cuenta
- Fuente única de verdad para análisis de flujos
- Dashboard puede mostrar últimos movimientos

---

### 3. Hoja **COSTOS** (sin cambios)

Mantener igual:
- Transacciones de gastos diarios
- Estructura: FECHA, AÑO-MES, CLASIFICACION, CATEGORIA, COSTO

---

## Migración de Datos

### Paso 1: Crear SNAPSHOTS
**De:** Filas 2-23 de SAVINGS actual (cuentas activas)
**A:** Nueva hoja SNAPSHOTS con formato vertical

Ejemplo: La fila actual
```
2025-12-16, NU, VIAJES, $2,184,299, ...(fechas en columnas)
```

Se convierte en multiples filas:
```
2025-12-16, NU, VIAJES, 2184299
2026-01-23, NU, VIAJES, 4192402
2026-01-29, NU, VIAJES, 7098093
...
2026-06-22, NU, VIAJES, 7330720
```

### Paso 2: Crear MOVIMIENTOS
**De:** Filas 24-40 de SAVINGS actual (transacciones)
**A:** Nueva hoja MOVIMIENTOS

Muchas de estas ya tienen FECHA + MONTO. Solo agregar TIPO basado en el monto:
- Si MONTO > 0: DEPOSITO
- Si MONTO < 0: RETIRO (o analizar contexto)

### Paso 3: Limpiar SAVINGS antiguo
Archivar o eliminar. El dashboard ya no lo necesitará.

---

## Cambios en el Dashboard

### Lectura de SNAPSHOTS
**Antes:**
- Leía la fila entera de una cuenta con fechas en columnas
- Tomaba la última fecha (último snapshot)

**Después:**
```javascript
// Pseudocode
const snapshots = await readSheet('SNAPSHOTS')
const latestDate = Math.max(...snapshots.map(s => s.FECHA))
const accounts = snapshots.filter(s => s.FECHA === latestDate)
// accounts = [{ banco: 'NU', etiqueta: 'VIAJES', saldo: 7330720 }, ...]
```

### Lectura de MOVIMIENTOS (nuevo)
```javascript
const movements = await readSheet('MOVIMIENTOS')
const recentMovements = movements
  .sort((a, b) => new Date(b.FECHA) - new Date(a.FECHA))
  .slice(0, 10) // Últimos 10
// Mostrar en un nuevo tab "Actividad" o en el header
```

### Lectura de TENDENCIA (desde SNAPSHOTS)
```javascript
const snapshots = await readSheet('SNAPSHOTS')
// Agrupar por FECHA y sumar SALDO
const trend = snapshots
  .reduce((acc, s) => {
    const date = s.FECHA
    if (!acc[date]) acc[date] = 0
    acc[date] += s.SALDO
    return acc
  }, {})
// Convertir a array y ordenar por fecha
```

---

## Timeline de Implementación

### Fase 1: Documentación ✅ (tu estás aquí)
- Definir estructura ideal
- Documentar cambios

### Fase 2: Migración Manual (tú en Google Sheets)
- Crear nueva hoja SNAPSHOTS
- Copiar datos de SAVINGS en formato vertical
- Crear nueva hoja MOVIMIENTOS
- Categorizar transacciones

### Fase 3: Adaptar Dashboard v1.1
- Actualizar `googleSheets.js` para leer SNAPSHOTS + MOVIMIENTOS
- Cambiar cálculo de trend desde SNAPSHOTS
- Agregar tab "Actividad" con últimos movimientos
- Mantener datos locales como fallback

### Fase 4: Verificación
- Comparar totales: SNAPSHOTS vs datos locales
- Probar tendencia histórica
- Validar movimientos

---

## Tabla Comparativa

| Aspecto | v1.0 (Actual) | v1.1 (Propuesta) |
|---------|---------------|-----------------|
| Hojas | SAVINGS, COSTS | SNAPSHOTS, MOVIMIENTOS, COSTS |
| Formato de datos | Horizontal (fechas en columnas) | Vertical (una fila por evento) |
| Cuentas cerradas | Visibles con $0 | No aparecen |
| Transacciones | En SAVINGS (mezclado) | Separadas en MOVIMIENTOS |
| Historial completo | Snapshots + diferencias | Snapshots + movimientos |
| Escalabilidad | Limitada (columnas) | Ilimitada (filas) |
| Mantenimiento | Complejo | Simple |

---

## Preguntas para Confirmar

1. **¿Frecuencia de snapshots?**
   - Semanal (domingo)? Mensual? Cada vez que hay movimiento?
   
2. **¿Datos históricos?**
   - ¿Mantener SNAPSHOTS desde 2025-12-16 al presente?
   - ¿Agregar más movimientos históricos o solo del 2025 en adelante?

3. **¿Nuevas funcionalidades?**
   - ¿Mostrar últimos movimientos en el dashboard?
   - ¿Alertas cuando hay retiro > X monto?
   - ¿Análisis de flujos de efectivo?

4. **¿Timeline?**
   - ¿Cuándo quieres empezar la migración?

---

## Notas Finales

- No es obligatorio migrar todo de una vez. Puedo adaptar el dashboard para leer ambas estructuras.
- La v1.1 es más mantenible a largo plazo (menor complejidad).
- Puedes seguir usando v1.0 mientras trabajas en la migración.
