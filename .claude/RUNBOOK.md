# RUNBOOK — AXIS Dashboard Finanzas

Esta es la bitácora completa de cómo se construyó y evolucionó este dashboard de finanzas personales con Claude Code, más una guía para que otra persona (usando Claude Code en cualquier proyecto parecido) reutilice el mismo enfoque, los mismos agentes y las mismas skills.

Si solo quieres **usar las herramientas** sin leer la historia completa, ve directo a [El kit de agentes y skills](#el-kit-de-agentes-y-skills-claude).

---

## Contexto del proyecto

**Qué es:** un dashboard de finanzas personales en React + Vite, conectado como fuente de datos a un Google Sheet propio (hojas `COSTS`, `SNAPSHOTS`/`SAVINGS`, `MOVIMIENTOS`, `INGRESOS`, `PRESUPUESTO`). Un solo usuario, sin backend propio — toda la persistencia vive en Google Sheets, leída y (más adelante) escrita directamente desde el navegador vía la API REST de Sheets con un token OAuth implícito.

**Stack:** React 18, Vite, Recharts para gráficos, `@react-oauth/google` para auth, `axios` para las llamadas REST a Sheets. Sin librería de UI, sin Tailwind, sin backend, sin test suite. Todo el estilo es CSS plano con variables (`--custom-properties`) por archivo `.css` junto a cada componente.

**Estructura clave:**
```
src/
  App.jsx                    — shell desktop (login, header, tabs, KPIs)
  components/
    KPICards.jsx              — tarjetas de KPI (compartidas por todas las tabs)
    MobileDashboard.jsx        — shell móvil independiente (su propio estado de tab)
    MobileBottomNav.jsx        — nav inferior móvil
    IPhoneFrame.jsx            — preview de "Vista móvil" para desktop
    AddExpenseModal.jsx        — el único flujo de escritura hoy (agregar gasto)
    tabs/
      Overview.jsx, Budget.jsx, CashFlow.jsx, Accounts.jsx, Trends.jsx
      MonthComparison.jsx, AccountsEvolution.jsx (sub-features de Overview/Accounts)
  context/
    AuthContext.jsx            — OAuth (scope, token, login/logout)
    DataContext.jsx            — fetch/refresh/fallback a datos locales
  hooks/
    useDashboardData.js        — TODA la lógica derivada (KPIs, gráficos, etc.)
    useAutoTheme.js             — tema claro/oscuro automático por hora
  services/
    googleSheets.js            — único punto de contacto con la API de Sheets
  styles/
    globals.css                 — sistema de tokens de color (claro + oscuro)
  utils/
    formatters.js                — moneda, fecha, mes, indicadores de tendencia
```

**Principio central de este código:** los componentes de tab **nunca** hacen fetch ni derivan datos por su cuenta — todo pasa por `useDashboardData()`, que le entrega a cada componente props ya procesadas. Esto es lo que permite que el mismo componente (ej. `MobileDashboard`) se renderice en dos lugares distintos (móvil real y el preview `IPhoneFrame` en desktop) y se mantengan sincronizados sin esfuerzo.

---

## Línea de tiempo — qué se hizo y en qué orden

### Fase 1 — Bug: KPIs no aparecían en móvil
El componente `MobileDashboard.jsx` se había creado sin incluir `<KPICards>`, aunque el CSS ya tenía estilos preparados para eso (`.mobile-content .kpi-grid`). Se agregó el render faltante. **Lección:** cuando el CSS ya anticipa algo que el JSX no usa, es señal de una integración a medio terminar, no de CSS muerto — vale la pena investigar antes de borrar.

### Fase 2 — Exploración de rediseño visual (mockup, no implementado)
Se pidió una propuesta de mejoras de diseño. Se usó la skill `dataviz` para una paleta categórica validada contra daltonismo, y se construyó un **Artifact interactivo** (HTML autocontenido) con las 5 pestañas simuladas, toggle de tema y jerarquía de KPIs "hero + secundarios". El usuario dijo *"no me gustó tanto tu propuesta, luego volveremos a eso"*.

**Lección clave:** cuando el usuario pausa/rechaza una propuesta de diseño grande, eso es una decisión que se debe respetar en **todo trabajo futuro** — no reintroducir piezas de esa propuesta (paleta categórica, jerarquía de KPIs, etc.) como efecto secundario de tareas no relacionadas. Esto quedó documentado explícitamente en `design-system-agent.md` y varios `*-page-agent.md` para que no se repita.

### Fase 3 — PWA: ícono real en pantalla de inicio + tema claro/oscuro automático
Dos pedidos concretos (no visuales-grandes, sí funcionales):
1. **Ícono de app real:** se generaron PNGs (180/192/512/512-maskable) renderizando el logo SVG existente sobre un canvas blanco vía Chrome headless + `playwright-core` (no hay librería de imágenes en el proyecto). Se agregó `manifest.webmanifest` + los `<link>`/`<meta>` correspondientes en `index.html`.
2. **Tema automático:** se creó un sistema completo de tokens de color en `globals.css` (antes casi no existía — colores hardcodeados en ~18 archivos CSS y varios componentes JSX/Recharts) y `useAutoTheme.js`, que aplica oscuro de 19:00 a 07:00. Se migraron ~190 colores literales a tokens.

**Lección clave:** un pedido de "modo oscuro" en un proyecto sin sistema de diseño previo no es un cambio pequeño — implica auditar **todo** el código en busca de colores hardcodeados, incluyendo props de Recharts (`fill=`, `stroke=`) y `style={{}}` inline, que no aparecen en un grep de solo `.css`. Este proceso quedó empaquetado en la skill `theme-audit`.

### Fase 4 — Cambio trivial: renombrar un KPI
"Ahorros Disponibles" → "CDT". Un solo `label:` en `KPICards.jsx`. Ejemplo de que no todo pedido necesita exploración — cuando el alcance es obvio y de una línea, se ejecuta directo.

### Fase 5 — El módulo grande: Agregar Gasto (primera escritura a Sheets)
Este fue el cambio más grande de la sesión, y el único que requirió **modo plan** formal:

1. **Exploración en paralelo** (2 agentes Explore): uno investigó la capa de integración con Sheets (scopes OAuth, estructura real de la hoja `COSTS`), otro investigó los patrones de UI existentes (no había ningún `<form>` ni modal en todo el código).
2. **Diseño del plan** (1 agente Plan) con todo el contexto de la exploración, produciendo un plan detallado archivo-por-archivo.
3. **Preguntas de aclaración** al usuario sobre 3 decisiones que no eran mías: dónde poner el botón en móvil, si la Clasificación debía empezar vacía o pre-seleccionada, y contra qué hoja probar (el usuario eligió probar directo contra la hoja real).
4. **Implementación:**
   - Se amplió el scope OAuth de `spreadsheets.readonly` a `spreadsheets` (`AuthContext.jsx`) — esto invalida los tokens ya cacheados para escritura, así que el manejo de reconexión se hizo **perezoso**: el primer intento de guardar con un token viejo devuelve 403, y ahí se muestra "Reconecta tu cuenta" en vez de forzar un logout global al cargar la app.
   - Nueva función `appendCostRow()` en `googleSheets.js` usando el endpoint `values:append` de Sheets API v4.
   - Nuevo componente `AddExpenseModal.jsx`: selector de Clasificación con opciones ya vistas + "Otra...", Categoría con sugerencias filtradas por Clasificación + "Otra...", fecha con mes calculado automáticamente.
   - Botón disparador **solo en desktop siempre visible** (después de KPICards) y **en móvil solo dentro de la pestaña Visión** (decisión explícita del usuario).

### Fase 6 — El crash del año-mes (bug real en producción, con lección importante)
El usuario probó el guardado real y reportó: *"la página se pone oscura después de 20 segundos"*. La primera hipótesis (¿el tema automático tiene un bug?) resultó **incorrecta** — se descartó con una pregunta de aclaración bien dirigida en vez de adivinar y parchear a ciegas. La causa real, revelada por la consola del navegador del usuario:

```
Uncaught RangeError: Invalid time value
    at formatMonth (formatters.js:88:6)
```

**Qué pasó:** `appendCostRow()` escribía la columna B (año-mes) como el string literal `"2026-07"` con `valueInputOption=USER_ENTERED`. Ese modo le dice a Sheets "interpreta esto como lo haría un humano tecleándolo" — y Sheets **reinterpretó el string como una fecha y lo reformateó solo**, rompiendo el formato `'YYYY-MM'` exacto que `parseCostsSheet` esperaba. Al releer esa fila, `formatMonth()` recibía basura y lanzaba una excepción sin capturar dentro del render de `<Overview>`, lo que — al no haber ningún error boundary en la app — **tumbaba todo el árbol de React**, dejando la pantalla vacía (con el fondo oscuro porque coincidía con horario nocturno real, de ahí la confusión inicial).

**La corrección tuvo dos partes, y las dos importan:**
1. **Causa raíz:** en vez de escribir el año-mes como texto plano, se descubrió (preguntándole al usuario) que la hoja ya calculaba esa columna con una fórmula: `=TEXTO(A{fila};"yyyy-mm")`. La solución correcta fue replicar exactamente esa fórmula — el `append` deja la columna B vacía, se extrae el número de fila real de la respuesta de la API (`updates.updatedRange`), y un segundo `PUT` escribe la fórmula en esa celda específica.
2. **Defensa en profundidad:** se le agregó `try/catch` a `formatMonth()` y `formatDateFull()` (que no lo tenían, a diferencia de `formatDateShort()` que sí) para que un solo dato mal formado — de esta fuente de bug o de cualquier otra futura — nunca vuelva a tumbar toda la aplicación.

**Lección clave, la más importante de todo este proyecto:** cuando escribas datos hacia una fuente externa que un humano también edita manualmente (un Google Sheet), **nunca asumas que un `valueInputOption` "inteligente" es gratis** — revisa si la columna destino ya tiene una convención (¿es texto plano? ¿es una fórmula?) antes de escribir, y agrega manejo de errores en las funciones de formato que consumen esos datos, porque tarde o temprano un dato no vendrá exactamente como se espera.

### Fase 7 — Pulido de UX: boxes con íconos
Se reemplazó el `<select>` de Clasificación por una grilla de tarjetas con emoji + etiqueta (🏠 Hogar, 🛒 Mercado, etc.), con una tarjeta final "➕ Otra" para el flujo de texto libre. Categoría se dejó como `<select>` por ser más variable.

### Fase 8 — Botón de actualizar en móvil
La vista de escritorio ya tenía un botón "Actualizar datos" en el footer; móvil no tenía equivalente. Se agregó un ícono circular de refrescar en el header móvil (visible en las 5 pestañas, no solo Visión — a diferencia del botón de Agregar Gasto), con animación de giro mientras carga.

### Fase 9 — Safe-area / notch
El usuario reportó que la barra de estado del celular (hora, batería) tapaba el header al usar la app instalada desde la pantalla de inicio. Se agregó `padding: max(10px, env(safe-area-inset-top))` al header móvil y el equivalente `env(safe-area-inset-bottom)` a la barra inferior. **Esto no se puede verificar visualmente desde Chrome headless/Playwright** — un navegador de escritorio, incluso con emulación de dispositivo, reporta `env(safe-area-inset-*)` como `0` porque no hay un notch físico. Se le comunicó esa limitación al usuario explícitamente en vez de afirmar falsamente que quedó "confirmado".

---

## El kit de agentes y skills (`.claude/`)

Todo lo aprendido arriba quedó empaquetado como **agentes** (`.claude/agents/*.md`) y **skills** (`.claude/skills/*/SKILL.md`) — ambos son mecanismos nativos de Claude Code: cualquier persona que abra este repo (o copie la carpeta `.claude/` a otro proyecto) los tiene disponibles automáticamente.

### Agentes — uno por página + transversales

| Agente | Dueño de |
|---|---|
| `overview-page-agent` | Tab Visión General: KPIs, pie chart, comparación mensual, top gastos |
| `budget-page-agent` | Tab Presupuesto |
| `cashflow-page-agent` | Tab Flujo |
| `accounts-page-agent` | Tab Cuentas + evolución de cuentas |
| `trends-page-agent` | Tab Tendencias: proyección + composición |
| `mobile-pwa-agent` | Shell móvil, PWA, safe-area — todo lo que es específico de "es un celular", no de una pestaña |
| `sheets-integration-agent` | Capa de datos: lectura/escritura de Sheets, OAuth |
| `design-system-agent` | Tokens de color, tema automático, consistencia visual |
| `expense-entry-agent` | El flujo de escritura Agregar Gasto (y referencia para futuros flujos similares) |

Cada agente tiene su propio `description` (para que Claude Code lo invoque automáticamente cuando el pedido calza) y documenta: qué archivos toca, el contrato de datos que consume, las convenciones específicas de esa página, y **la deuda de diseño conocida y deliberadamente pospuesta** que no debe "corregirse" sin que el usuario lo pida.

### Skills — procesos reutilizables

| Skill | Para qué |
|---|---|
| `add-dashboard-tab` | Scaffolding de una pestaña nueva completa (componente + registro en 4 lugares) |
| `sheets-column-mapper` | Agregar soporte de lectura para una hoja nueva de Sheets |
| `theme-audit` | Encontrar y convertir colores hardcodeados a tokens |
| `pwa-icon-refresh` | Regenerar los íconos PNG cuando cambie el logo |
| `sheets-write-flow` | Construir un nuevo formulario que escriba a Sheets (usando `AddExpenseModal` como referencia) |

### Cómo reusar esto en otro proyecto

1. Copia la carpeta `.claude/` completa (agentes + skills) a la raíz del otro proyecto.
2. Los nombres de archivo/componentes específicos de este proyecto (`googleSheets.js`, `AddExpenseModal.jsx`, etc.) no existirán ahí — trátalos como referencia del **patrón**, no como rutas literales. Pide a Claude Code que adapte cada agente a la estructura real del nuevo proyecto la primera vez que lo invoques.
3. Si el otro proyecto no usa Google Sheets como fuente de datos, `sheets-integration-agent`, `sheets-column-mapper` y `sheets-write-flow` no aplican tal cual — pero el patrón general (capa de datos aislada, nunca fetchear desde componentes de UI, funciones de escritura que verifican convenciones existentes antes de escribir) sigue siendo válido para cualquier fuente de datos externa editable por humanos (Airtable, Notion, un backend con validaciones laxas, etc.).

---

## Lecciones consolidadas (para releer antes de tocar este código)

1. **Nunca fetchees datos dentro de un componente de tab.** Todo pasa por `useDashboardData()`. Si algo se ve mal, el bug casi siempre está en el hook o en el parser de `googleSheets.js`, no en el JSX.
2. **Un rechazo de diseño es una decisión persistente, no un evento aislado.** No reintroduzcas piezas de una propuesta que el usuario pausó, como efecto secundario de otra tarea.
3. **Nunca escribas a una fuente de datos externa editable por humanos sin revisar su convención existente primero.** Un `valueInputOption` "inteligente" puede reinterpretar tus datos silenciosamente. Si hay una fórmula, replica la fórmula.
4. **Todo dato externo (Sheets, APIs, input de usuario) debe pasar por funciones de formato con manejo de errores.** Un solo valor mal formado no debería poder tumbar toda la aplicación — no hay error boundaries en esta app, así que cada función de formato es la única línea de defensa.
5. **Los cambios de scope OAuth invalidan tokens cacheados.** Maneja el 403 en el punto de falla (perezoso), no fuerces un logout global.
6. **Ciertas cosas no se pueden verificar desde este entorno** (safe-area/notch en un navegador de escritorio, el flujo de éxito de una escritura real que requiere login real del usuario). Dilo explícitamente en vez de afirmar que quedó "confirmado".
7. **Cuando el alcance de un pedido es incierto, usa modo plan con exploración paralela real** (agentes Explore + Plan) — no adivines la estructura de datos ni las convenciones de UI existentes.
8. **Cuando algo falla de forma rara y contraintuitiva** (ej. "la página se pone oscura"), pregunta antes de asumir cuál sistema es el culpable — la causa real puede estar en una capa completamente distinta a la que el síntoma sugiere.

---

## Cómo arrancar un proyecto parecido desde cero con este kit

1. `npm create vite@latest` (React), instala `axios`, `@react-oauth/google` (o el SDK de auth que corresponda), `recharts` (o la librería de gráficos que corresponda).
2. Copia `.claude/agents/` y `.claude/skills/` de este repo.
3. Crea `src/styles/globals.css` con un sistema de tokens desde el día 1 (no esperes a que te pidan modo oscuro para tener una capa de theming — ver `design-system-agent`).
4. Crea un único hook `useXxxData()` que sea la única fuente de datos derivados para toda la UI — nunca dejes que un componente de página haga su propio fetch.
5. Antes de escribir la primera función que escriba datos hacia afuera (a un Sheet, a una API), lee la sección "El crash del año-mes" de este documento otra vez.
