# Mapeo de datos — spreadsheet FINANZAS JULI

Este documento define cómo las hojas del spreadsheet `FINANZAS JULI` (ejemplo verificado: `FINANZAS JULI.xlsx`, hojas `PRESUPUESTO`, `INGRESOS`, `GASTOS`, `ANALISIS`) deberían mapearse a la capa de datos de `axis-control` cuando se implemente `src/services/googleSheets.js`, siguiendo el patrón descrito en `sheets-integration-agent.md` y la skill `sheets-column-mapper`.

**Estado actual del repo:** no hay código de aplicación todavía (sin `src/`, sin commits) — solo el kit `.claude/` copiado del proyecto original. Este documento es la referencia de diseño para cuando se implemente esa capa; no implementa nada por sí mismo.

**Diferencia clave con el proyecto original:** el original asume hojas `COSTS`, `SNAPSHOTS`/`SAVINGS`, `MOVIMIENTOS`, `INGRESOS`, `PRESUPUESTO`, con dominio de cuentas/patrimonio personal. `FINANZAS JULI` tiene 4 hojas — `PRESUPUESTO`, `INGRESOS`, `GASTOS`, `ANALISIS` — y un dominio distinto: ingresos por consultorio odontológico, sin ningún concepto de cuentas o patrimonio. No fuerces el molde de Cuentas/Tendencias sobre estos datos.

---

## 1. Mapeo columna por columna

### `PRESUPUESTO` (A1:D1000)

| Columna | Header | Tipo | Notas |
|---|---|---|---|
| A | `CATEGORIA` | texto | ej. `DEUDA`, `TRANSPORTE`, `ALIMENTACION`, `AHORRO`, `PLAN CELULAR`, `DEPORTE`, `TRABAJO` |
| B | `SUBCATEGORIA` | texto | ej. `ICETEX`, `FEPASDE`, `MOTO`, `COOMEVA`. Puede venir vacía cuando la categoría no se subdivide (ej. `TRANSPORTE`, `ALIMENTACION`) |
| C | `PRESUPUESTO` | numérico | Puede venir **vacío** = sin presupuesto asignado todavía (ej. `DEUDA/MOTO`, `DEUDA/SEGURO`). No tratar como `0`. |
| D | `TIPO` | texto | `FIJO` \| `VARIABLE` |

Campos propuestos: `{ categoria, subcategoria, presupuesto, tipo }`

### `INGRESOS` (A1:C1000)

| Columna | Header | Tipo | Notas |
|---|---|---|---|
| A | `FECHA` | fecha | |
| B | `CONSULTORIO` | texto | Nombre del consultorio odontológico (ej. `ODONTOSUR`, `DENTAL ELITE`, `ORALIS`) — **no** es una categoría genérica de ingreso |
| C | `INGRESO` | numérico | Puede venir **vacío** = pago pendiente/no cobrado todavía. No tratar como `0`. |

Campos propuestos: `{ fecha, consultorio, ingreso }` (`ingreso` nullable)

### `GASTOS` (A1:E1015)

| Columna | Header | Tipo | Notas |
|---|---|---|---|
| A | `FECHA` | fecha | |
| B | `AÑO-MES` | fórmula | `=TEXT(A{fila},"yyyy-mm")` — **idéntico** al patrón `COSTS` del proyecto original (ver advertencia §3) |
| C | `CLASIFICACION` | texto | ej. `TRANSPORTE`, `ALIMENTACIÓN`, `DEUDA`, `AHORRO`, `DEPORTE`, `PERSONAL` |
| D | `CATEGORIA` | texto | Detalle específico del gasto — ej. `Casa - Niquia`, `Almuerzo`, `FEPASDE`, `ICETEX`, `COOMEVA` |
| E | `COSTO` | numérico | |

Campos propuestos: `{ fecha, anoMes, clasificacion, categoria, costo }` — esta hoja es funcionalmente equivalente a `COSTS` del proyecto original; el parsing existente (`parseCostsSheet`) es reutilizable casi tal cual.

### `ANALISIS` (A1:E14)

| Columna | Header | Tipo | Notas |
|---|---|---|---|
| A | `LUGAR` | texto | Zona/barrio (ej. `CENTRO`, `ENVIGADO`, `ITAGUI`, `NIQUIA`) |
| B | `CONSULTORIO` | texto | Debe calzar con `INGRESOS.CONSULTORIO` |
| C | `MINIMO` | numérico | |
| D | `PROMEDIO` | numérico | |
| E | `MAXIMO` | numérico | |

Campos propuestos: `{ lugar, consultorio, minimo, promedio, maximo }`

Sin equivalente en el proyecto original. Parece mantenida a mano en la hoja (rango histórico de ingreso esperado por consultorio), no derivada por fórmula de `GASTOS`/`INGRESOS`.

---

## 2. Relaciones entre hojas (inferidas de los datos reales)

- **`PRESUPUESTO.CATEGORIA` ↔ `GASTOS.CLASIFICACION`** — join de nivel 1, mismo patrón que `budget-page-agent.md` documenta para el original (`b.categoria === clasificacion`). Confirmado con datos reales: `DEUDA`, `TRANSPORTE`, `ALIMENTACION`, `AHORRO`, `DEPORTE` aparecen idénticos en ambas columnas.
- **`PRESUPUESTO.SUBCATEGORIA` ↔ `GASTOS.CATEGORIA`** — join de nivel 2, **nuevo respecto al original** (que tenía presupuesto de un solo nivel). Confirmado con datos reales: `ICETEX`, `FEPASDE`, `COOMEVA`, `ECOMARES` aparecen idénticos en ambas columnas. Debe tratarse como decisión de diseño propia de este caso, no asumir que el `parseBudgetSheet` original alcanza.
- **`ANALISIS.CONSULTORIO` ↔ `INGRESOS.CONSULTORIO`** — permite comparar el ingreso real del mes contra el rango histórico (mínimo/promedio/máximo) por consultorio.

---

## 3. Advertencias operativas para cuando se implemente escritura

- **Columna fórmula `AÑO-MES`:** si se agrega un flujo de escritura a `GASTOS` (equivalente a `AddExpenseModal`), replicar la lección de la Fase 6 del `RUNBOOK.md` ("El crash del año-mes"): nunca escribir esa columna como texto plano con `valueInputOption=USER_ENTERED` — Sheets la reinterpreta y rompe el formato `yyyy-mm` esperado. Dejarla vacía en el `append` inicial, extraer la fila real de `updates.updatedRange`, y hacer un segundo `PUT` con la fórmula `=TEXT(A{fila},"yyyy-mm")`.
- **Nulos con significado:** `INGRESOS.INGRESO` vacío = pago pendiente; `PRESUPUESTO.PRESUPUESTO` vacío = sin presupuesto asignado. Ninguno de los dos es equivalente a `0` — cualquier función de formato/derivación debe distinguir explícitamente `null`/vacío de `0` (siguiendo también la lección de manejo de errores de la Fase 6: nunca dejar que un dato mal formado tumbe el render).

---

## 4. Propuesta de tabs futuros (no implementados en este documento)

Dado que el dominio no tiene cuentas/patrimonio, se proponen tabs propios en vez de forzar el molde de Cuentas/Tendencias:

- **Ingresos por Consultorio** (reemplaza el rol de "Cuentas"): ingreso real por consultorio/mes desde `INGRESOS`, mostrando explícitamente un estado "pendiente" para filas sin `INGRESO`.
- **Análisis** (reemplaza el rol de "Tendencias"): compara el ingreso real (`INGRESOS`) contra el rango histórico (`ANALISIS`) por consultorio — ej. una barra con marcadores de mínimo/promedio/máximo y un punto para el valor actual del mes.
- **Presupuesto** y **Flujo** sí heredan directamente el patrón de `budget-page-agent.md` / `cashflow-page-agent.md` del proyecto original, con el ajuste del join de dos niveles (categoría + subcategoría) señalado en §2.
