# 🎯 Baldecash Talento & Cultura - Arquitectura de Módulos

Plataforma integrada de gestión de talento que cubre todo el ciclo de vida del empleado.

## 📦 Módulos del Sistema

### 🎯 RECLUTAMIENTO (Activo)
- **Candidatos** - Pipeline y aplicaciones
- **Vacantes** - Gestión de posiciones abiertas
- **Pipeline** - Kanban visual de etapas
- **Fuentes** - Canales de adquisición de talento
- **Reportes** - Análisis del proceso de reclutamiento

### 👋 ONBOARDING (Próximamente)
- Integración de nuevos empleados
- Checklist de bienvenida
- Asignación de mentor/buddy
- Acceso a sistemas y beneficios
- Evaluación 30-60-90 días

### 📚 DESARROLLO & CAPACITACIÓN (Próximamente)
- Catálogo de cursos y entrenamientos
- Planes de desarrollo personalizados
- Certificaciones y habilidades
- Biblioteca de recursos
- Evaluación de competencias

### ⭐ EVALUACIÓN DE DESEMPEÑO (Próximamente)
- Evaluaciones 360°
- KPIs y objetivos (OKRs)
- Histórico de performance
- Feedback continuo
- Revisiones periódicas

### 🚀 PLANES DE CARRERA (Próximamente)
- Mapeo de roles y jerarquía
- Planes de sucesión
- Trayectorias profesionales
- Movilidad interna
- Promociones

### 💰 COMPENSACIÓN & BENEFICIOS (Próximamente)
- Bandas salariales
- Estructuras de compensación
- Beneficios y perks
- Simulador de salarios
- Análisis de equidad salarial

### 🤝 ENGAGEMENT & CULTURA (Próximamente)
- Encuestas de clima
- Iniciativas de equipo
- Eventos y actividades
- Reconocimiento
- Comunicación interna

### ✅ CUMPLIMIENTO (Próximamente)
- Políticas y procedimientos
- Documentos legales
- Auditoría y logs
- Cumplimiento normativo
- GDPR & compliance

---

## 🏗️ Estructura Técnica

```
Baldecash Talento & Cultura
├── Reclutamiento
│   └── Candidatos, Vacantes, Pipeline, Fuentes, Reportes
├── Onboarding
│   └── Integración, Checklist, Evaluaciones
├── Desarrollo
│   └── Cursos, Planes, Certificaciones
├── Evaluación
│   └── Reviews, 360°, KPIs, Feedback
├── Carrera
│   └── Sucesión, Movilidad, Promociones
├── Compensación
│   └── Salarios, Beneficios, Equidad
├── Engagement
│   └── Encuestas, Eventos, Comunicación
└── Cumplimiento
    └── Políticas, Auditoría, Legal

Dashboard Integrado
└── KPIs unificados, Reportería cruzada, Analítica
```

---

## 📊 KPIs Integrados por Módulo

### Reclutamiento
- Time-to-hire
- Costo por contratación
- Conversión por etapa
- Calidad de candidatos

### Onboarding
- % completado a 30/60/90 días
- Retención de primeros 6 meses
- Tiempo en ramp-up

### Desarrollo
- % participación en capacitación
- Promociones internas
- Cursos completados

### Evaluación
- Distribución de ratings
- Cumplimiento de reviews
- Mejora de performance

### Carrera
- % en planes de desarrollo
- Tasa de promoción interna
- Movilidad lateral

### Engagement
- NPS de clima laboral
- Participación en encuestas
- Retención voluntaria

---

## 🔄 Roadmap

### Q2 2026 (Ahora)
- ✅ Reclutamiento (MVP)
- 🎯 Onboarding básico
- 📋 Gestión de empleados

### Q3 2026
- 📚 Desarrollo & Capacitación
- 🎯 Evaluación de Desempeño
- 📊 Dashboard integrado

### Q4 2026
- 🚀 Planes de Carrera
- 💰 Compensación & Beneficios
- 🤝 Engagement & Cultura

### Q1 2027
- ✅ Cumplimiento normativo
- 🔐 Auditoría avanzada
- 📈 Analytics & BI

---

## 🛠️ Tecnologías Utilizadas

- **Frontend**: Next.js 14 + React 18 + TypeScript
- **UI/UX**: Tailwind CSS + Radix UI + Framer Motion
- **Backend**: Next.js Route Handlers + Node.js
- **Data**: Airtable (fuente operativa) + Upstash Redis (usuarios/auth)
- **Charts**: Recharts
- **Export**: XLSX, PDF
- **Auth**: JWT (HS256)
- **State**: React Query + Zustand

---

## 👥 Roles y Permisos

- **Admin**: Acceso total, gestión de usuarios, configuración
- **Recruiter**: Gestión de candidatos, vacantes, reportes
- **Manager**: Evaluación de reportes, feedback a equipos
- **Viewer**: Acceso solo-lectura a dashboards
- **Employee**: (Futuro) Auto-servicio de desarrollo y evaluación

---

Generated: 2026-06-04
