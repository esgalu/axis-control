# Dashboard Finanzas Personal

Una aplicación React moderna para visualizar y gestionar tus finanzas personales con gráficos interactivos.

![React](https://img.shields.io/badge/React-18.2.0-blue)
![Vite](https://img.shields.io/badge/Vite-5.0.8-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

## 🚀 Características

- 📊 **Dashboard integral** - Visualiza tu patrimonio total, ahorros e inversiones
- 📈 **Gráficos interactivos** - Análisis de gastos, tendencias y distribución de cuentas
- 📱 **Responsive** - Funciona perfectamente en móvil, tablet y desktop
- ⚡ **Rápido** - Construido con Vite para máxima velocidad
- 🎨 **Diseño corporativo** - Tema azul/gris profesional
- 🔄 **Datos en vivo** - Listo para conectar Google Sheets (próxima fase)

## 📋 Requisitos previos

- Node.js 16.0.0 o superior
- npm o yarn

## 🛠️ Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/esgalu/dashboard-finance.git
cd dashboard-finance
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Ejecutar en desarrollo

```bash
npm run dev
```

El proyecto se abrirá automáticamente en `http://localhost:5173`

## 📁 Estructura del proyecto

```
dashboard-finance/
├── src/
│   ├── components/
│   │   ├── KPICards.jsx          # Tarjetas KPI
│   │   ├── NavTabs.jsx            # Navegación de tabs
│   │   └── tabs/
│   │       ├── Overview.jsx       # Tab visión general
│   │       ├── Trends.jsx         # Tab tendencias
│   │       └── Accounts.jsx       # Tab cuentas
│   ├── data/
│   │   └── financialData.js       # Datos financieros
│   ├── hooks/
│   │   └── useDashboardData.js    # Hook personalizado
│   ├── styles/
│   │   ├── globals.css            # Estilos globales
│   │   └── App.css                # Estilos de App
│   ├── App.jsx                    # Componente principal
│   └── main.jsx                   # Punto de entrada
├── index.html
├── vite.config.js
├── package.json
└── README.md
```

## 🎯 Cómo usar

1. **Abre la app** - Accede a `http://localhost:5173`
2. **Explora los tabs**:
   - **Visión General**: Gráficos de gastos y tendencia mensual
   - **Tendencias**: Evolución de tu patrimonio en el tiempo
   - **Cuentas**: Distribución detallada de tus ahorros
3. **Actualiza los datos**: Edita `src/data/financialData.js` con tus datos

## 📊 Datos de ejemplo

Los datos están en `src/data/financialData.js`:

```javascript
export const DATA = {
  savings: { /* tus cuentas */ },
  expenses: [ /* tus gastos */ ],
  monthlyExpense: [ /* gasto mensual */ ],
  trend: [ /* evolución del patrimonio */ ]
}
```

## 🔧 Scripts disponibles

```bash
# Desarrollo
npm run dev

# Build para producción
npm run build

# Preview de la build
npm run preview

# Lint (si configuras ESLint)
npm run lint
```

## 🚀 Deploy en Vercel

```bash
# 1. Push a GitHub
git push origin main

# 2. Ve a vercel.com
# 3. Conecta tu repositorio
# 4. Deploy automático ✅
```

## 📱 Próximas características

- [ ] Conectar Google Sheets API para datos en vivo
- [ ] Agregar funcionalidad de gastos rápidos
- [ ] Exportar reportes a PDF
- [ ] Tema oscuro (dark mode)
- [ ] Alertas de presupuesto
- [ ] Análisis predictivo de gastos

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la licencia MIT. Ver `LICENSE` para más detalles.

## 💡 Tips

- Para actualizar datos, solo necesitas editar `src/data/financialData.js`
- Los estilos usan CSS puro para máxima compatibilidad
- Los gráficos usan Recharts, muy configurable y responsive

## 📞 Soporte

Si tienes preguntas o problemas, abre un issue en GitHub.

---

**Hecho con ❤️ para tus finanzas personales**
