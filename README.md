<div align="center">

# 🎯 Baldecash Recruitment Platform

**Plataforma web premium para gestión y visualización de reportes de reclutamiento**

Integración nativa con Airtable · Auth JWT con roles · Dashboard SaaS moderno

</div>

---

## 📑 Tabla de contenidos

1. [Visión general](#-visión-general)
2. [Características](#-características)
3. [Stack tecnológico](#-stack-tecnológico)
4. [Arquitectura](#-arquitectura)
5. [Modelo de datos Airtable](#-modelo-de-datos-airtable)
6. [Estructura del proyecto](#-estructura-del-proyecto)
7. [Inicio rápido](#-inicio-rápido)
8. [Variables de entorno](#-variables-de-entorno)
9. [Roles y permisos](#-roles-y-permisos)
10. [Páginas del dashboard](#-páginas-del-dashboard)
11. [KPIs y métricas](#-kpis-y-métricas-fórmulas)
12. [APIs REST](#-apis-rest)
13. [Auth y middleware](#-auth-y-middleware)
14. [Componentes UI](#-componentes-ui)
15. [Sistema de diseño](#-sistema-de-diseño)
16. [Exportación de reportes](#-exportación-de-reportes)
17. [Deploy en Vercel](#-deploy-en-vercel)
18. [Desarrollo local](#-desarrollo-local)
19. [Troubleshooting](#-troubleshooting)
20. [Decisiones técnicas](#-decisiones-técnicas-no-obvias)
21. [Roadmap](#-roadmap-y-mejoras-pendientes)

---

## 🎬 Visión general

Plataforma interna de Baldecash diseñada para que el equipo de **Talento & Cultura** gestione todo su pipeline de reclutamiento desde una sola interfaz, con datos sincronizados en tiempo real con Airtable como fuente de verdad.

**Casos de uso clave:**

- 👥 **Reclutadores** trackean candidatos en cada etapa, registran motivos de caída, exportan reportes para hiring managers.
- 🎯 **Hiring Managers** consultan el estado de sus vacantes sin tener que pedir actualizaciones.
- 📊 **Dirección** ve KPIs en tiempo real: tasa de conversión, time-to-hire, distribución por etapa, ROI por fuente.
- 🔐 **Admins** gestionan usuarios, roles y la integración con Airtable.

**Por qué no usar Airtable directamente:**
- Airtable es excelente para data entry pero terrible para visualización ejecutiva.
- No tiene control de acceso por rol granular.
- No permite componer KPIs derivados sin Pro features.
- La interfaz puede saturar a usuarios no técnicos.

Esta plataforma resuelve esos 4 puntos manteniendo Airtable como la única fuente de datos operativos.

---

## ✨ Características

### Visualización
- **Dashboard ejecutivo** con 6 KPIs animados, tendencias de 30 días, embudo de etapas, fuentes, motivos de caída y análisis de descartes.
- **Gráficos interactivos** (Recharts): line/area, pie, bar horizontal con gradientes.
- **Contadores animados** (Framer Motion springs) en todos los KPIs.
- **Glow brand sutil** permanente en cards premium (paleta azul/aqua/gold).

### Pipeline
- **Tabla de candidatos** con filtros (etapa, fuente, vacante, reclutador), búsqueda, edición de etapa inline, alta/baja, edit modal completo.
- **Cards de vacantes** con filtros (estado, área), métricas por vacante (candidatos · contratados), CRUD completo con dropdown menu.
- **Bitácora** que muestra etapas en curso + etapas cerradas (historial real).
- **Reportes** con rangos temporales (7 / 30 / 90 / 365 días o todo el periodo) y exportación.

### Auth y administración
- Login JWT con sesión httpOnly, recuperación de contraseña.
- Middleware que protege todas las rutas `/dashboard/*` y enforces roles.
- Panel **Admin** (solo rol admin) para CRUD de usuarios y asignación de roles.
- Panel **Ajustes** para perfil, apariencia, integraciones, info de la app.

### Sistema operativo
- **Centro de notificaciones** con polling, badge animado, marcar como leído.
- **Búsqueda global** desde la topbar (Cmd/Ctrl+K).
- **Modo claro y oscuro** con next-themes y persistencia.
- **Exportación** a Excel (xlsx) y PDF (jspdf) con la paleta corporativa.
- **Logs de actividad** locales para auditoría.

### UX premium
- Paleta oficial Baldecash en 3 familias (azul, aqua, gold) × 7 tonos.
- Tipografía display + sans con `font-feature-settings` activados.
- Sombras multi-capa estilo Stripe/Linear (tinte brand, no negro).
- Border radius 20px (más suave que default).
- Microinteracciones consistentes: hover lift + shadow elevated.
- Transiciones entre páginas con `ShellTransition`.

---

## 🛠 Stack tecnológico

### Frontend
| Tecnología | Versión | Por qué |
|---|---|---|
| **Next.js** | 14.2.5 | App Router, RSC, middleware nativo, deploy fácil en Vercel |
| **React** | 18.3.1 | Server Components + Client interactivity |
| **TypeScript** | 5.5+ | Type safety end-to-end |
| **Tailwind CSS** | 3.4 | Utility-first + theming via CSS variables |
| **Framer Motion** | 11.3 | Animaciones premium con springs |
| **Radix UI** | múltiples | Primitives accesibles (Dialog, Select, Dropdown, etc.) |
| **Recharts** | 2.12 | Visualizaciones declarativas |
| **Lucide Icons** | 0.408 | Iconografía consistente |
| **Sonner** | 1.5 | Toasts modernos |
| **next-themes** | 0.3 | Dark mode con persistencia |

### Backend
| Tecnología | Uso |
|---|---|
| **Next.js Route Handlers** | API REST en `/api/*` |
| **jose** | JWT signing/verification (HS256) |
| **bcryptjs** | Hashing de contraseñas |
| **zod** | Validación de payloads en endpoints |
| **airtable SDK** | Cliente oficial para la API de Airtable |

### Exportación
- **xlsx** — generación de Excel
- **jspdf** + **jspdf-autotable** — generación de PDF

### Estado del cliente
- **@tanstack/react-query** — fetching y caché client-side
- **zustand** — estado UI ligero (provisionado, uso mínimo actual)

---

## 🏗 Arquitectura

```
┌───────────────────────────────────────────────────────────┐
│                       NAVEGADOR                            │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  React + Tailwind + Framer Motion (Client Components)│ │
│  │  + Recharts + Radix UI + Sonner                      │ │
│  └─────────────────────┬────────────────────────────────┘ │
└────────────────────────┼───────────────────────────────────┘
                         │ HTTP (cookies, fetch)
                         ▼
┌───────────────────────────────────────────────────────────┐
│                    NEXT.JS (Vercel)                        │
│                                                            │
│  ┌──────────────────┐    ┌──────────────────────────────┐ │
│  │  Server Components│    │  Route Handlers (API REST)   │ │
│  │  (SSR + RSC)     │    │  /api/auth /api/candidates   │ │
│  │                   │    │  /api/vacancies /api/admin   │ │
│  └────────┬─────────┘    └────────┬─────────────────────┘ │
│           │                       │                        │
│           └──────────┬────────────┘                        │
│                      ▼                                     │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  Middleware: JWT verify + role enforcement           │ │
│  │  (matcher: /dashboard/*, /api/admin/*)               │ │
│  └──────────────────────────────────────────────────────┘ │
│                      │                                     │
│                      ▼                                     │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  Repository Layer (interface única)                  │ │
│  │  src/lib/data/repository.ts                          │ │
│  └────────┬─────────────────────────────────┬───────────┘ │
│           │                                 │              │
│           ▼                                 ▼              │
│  ┌─────────────────┐              ┌────────────────────┐  │
│  │ MockRepository  │              │ AirtableRepository │  │
│  │ (in-memory)     │              │ (Airtable SDK)     │  │
│  │ DATA_SOURCE=mock│              │ DATA_SOURCE=airtable│ │
│  └─────────────────┘              └──────────┬─────────┘  │
└────────────────────────────────────────────────┼──────────┘
                                                 │
                                                 ▼
                                  ┌──────────────────────────┐
                                  │   AIRTABLE (fuente real) │
                                  │   Base appGRC5rRH4m1I8g2 │
                                  │   - Candidatos           │
                                  │   - Vacantes             │
                                  │   - Etapas               │
                                  │   - Ingresos             │
                                  │   - Fuentes              │
                                  │   - Rango salarial       │
                                  │   - Tiempo de revisión   │
                                  └──────────────────────────┘
```

### Principios de diseño

**1. Capa de repositorio única**

Toda la app consume `getRepo()` desde [`src/lib/data/repository.ts`](app/src/lib/data/repository.ts). La interfaz es la misma se use Airtable o mock. Cambiar de uno a otro es flipar la variable `DATA_SOURCE`.

**2. Server Components por default**

Las páginas son Server Components (RSC) que fetchean data en el server, mantienen el JS del cliente al mínimo. Los Client Components (con `'use client'`) son sólo los interactivos (forms, gráficos, modals).

**3. Auth y usuarios LOCALES, data operativa en Airtable**

Los usuarios del sistema (auth) viven en memoria/store local. Los datos del pipeline (candidatos, vacantes, etc.) viven en Airtable. Esto evita contaminar la base operativa con datos de la plataforma.

**4. Sin librería de UI pesada**

Componentes basados en Radix UI primitives + Tailwind. Es esencialmente Shadcn/UI pero hecho a mano con la paleta Baldecash. Cero `@/components/ui` chunky.

---

## 📊 Modelo de datos Airtable

**Base ID**: `appGRC5rRH4m1I8g2`

### 1. Candidatos (`tbl9Eb4EIsqY5vhHm`)

Pipeline de candidatos activos e históricos.

| Campo | Tipo | Ejemplo | Mapeo TS |
|---|---|---|---|
| `ID_Candidato` | singleLineText (PK) | `C0007` | `id` |
| `Nombre Completo` | multilineText | `Jose Pantoja` | `name` |
| `Email` | email | `jose@email.com` | `email` |
| `Teléfono` | phoneNumber | `+51 999...` | `phone` |
| `LinkedIn URL` | url | `linkedin.com/in/...` | `linkedinUrl` |
| `ID Vacante` | singleLineText | `VC0001` | `vacancyId` |
| `Fuente` | singleSelect | LinkedIn / Bumeran / Referido / Computrabajo / **Facebook** | `source` |
| `Fecha Postulación` | date | `2026-04-29` | `appliedAt` |
| `Reclutador` | singleSelect | Antonella Arellano / Mayra Pereira | `recruiter` |
| `Etapa Actual` | singleSelect | Screening / Entrevista T&C / Entrevista Líder / Prueba Tecnica / Oferta / Ingreso | `stage` |
| `Estado Final` | singleSelect | En proceso / Contratado / Se cayó / No seleccionado | `finalStatus` |
| `Motivo Caída` | singleSelect | No asistió / Desistió / Fue contratado en otra empresa | `dropReason` |
| `Contratado` | singleSelect | Sí / No | `hired` |

### 2. Vacantes (`tblzOTwm8yualc6an`)

Puestos a llenar.

| Campo | Tipo | Mapeo TS |
|---|---|---|
| `ID_Vacante` (PK) | singleLineText | `id` |
| `Puesto` | multilineText | `title` |
| `Área` | singleSelect | `area` |
| `Seniority` | singleSelect | `seniority` |
| `Reclutador` | singleSelect | `recruiter` |
| `Hiring Manager` | singleSelect | `hiringManager` |
| `Fecha Apertura` | date | `openedAt` |
| `Fecha Cierre` | date | `closedAt` |
| `Estado Vacante` | singleSelect (Abierta / En Pausa / Cerrada) | `status` |
| `Prioridad` | singleSelect (Alta / Media / Baja) | `priority` |
| `Modalidad` | singleSelect (Hibrido / Presencial) | `modalidad` |
| `Cantidad Posiciones` | number | `positions` |
| `Veces Reabierta` | number | `reopens` |
| `Motivo Reapertura` | multilineText | `reopenReason` |

**Áreas reales**: COBRANZAS, CONTABILIDAD Y CONTROLLER, CONVENCIONES Y ALIANZAS, GROWTH, LEGAL, OPERACIONES, TALENTO & CULTURA, TECONOLOGIA Y FINANZAS, VENTAS, PRODUCT OWNER, LOCADOR.

**Hiring Managers reales**: Antonella Arellano, Jorge Morales, Marco Del Rio, Ruben Montenegro, Meylin Miyashiro, Yadira Yovera, Monica Obando, Vania Hagel.

### 3. Etapas (`tblcGtXMah2F9m4a6`)

Historial de movimientos del candidato por etapa (1:N con Candidatos).

| Campo | Tipo | Mapeo TS |
|---|---|---|
| `ID Movimiento` (PK) | singleLineText | `id` |
| `ID Candidato` | singleLineText | `candidateId` |
| `ID Vacante` | singleLineText | `vacancyId` |
| `Etapa` | singleSelect | `stage` |
| `Fecha Inicio` | date | `startedAt` |
| `Fecha Fin` | date | `endedAt` |
| `Resultado` | singleSelect (Aprobado / Aceptó Oferta / No se presentó) | `result` |
| `Comentarios` | multilineText | `comments` |

### 4. Ingresos (`tblGkRAoMUXEWZk5S`)

Tracking post-contratación (retención y performance).

| Campo | Tipo | Mapeo TS |
|---|---|---|
| `ID Candidato` (PK) | singleLineText | `candidateId` |
| `Salario final` | number | `finalSalary` |
| `Fecha Ingreso` | date | `startDate` |
| `Sigue en Empresa` | singleSelect (Sí / No) | `stillEmployed` |
| `Fecha Salida` | date | `endDate` |
| `Pasó Periodo Prueba` | singleSelect (Sí / No) | `passedProbation` |
| `Performance` | multilineText | `performance` |
| `Comentario Líder` | multilineText | `leaderComment` |

### 5. Fuentes (`tblAEXtXNSdrncanh`)

Costo y tracking de canales de adquisición por vacante.

| Campo | Tipo | Mapeo TS |
|---|---|---|
| `ID Fuentes` (PK) | singleLineText | `sourceId` |
| `ID VACANTE` | multilineText | `vacancyId` |
| `Fuente` | singleSelect | `name` |
| `Costo Mensual` | currency | `monthlyCost` |
| `Responsable` | multilineText | `owner` |

### 6. Rango salarial (`tblWgZQjsrG9XYhKF`)

Bandas salariales por vacante.

| Campo | Tipo | Mapeo TS |
|---|---|---|
| `ID VACANTE` (PK) | singleLineText | `vacancyId` |
| `SALARIO MINIMO` | number | `min` |
| `SALARIO MAXIMO` | number | `max` |
| `Status` | singleSelect | `status` |

### 7. Tiempo de revisión (head) (`tblRKGm0Nw6WckiGP`)

Tracking del tiempo que toma al hiring manager revisar el CV.

| Campo | Tipo | Mapeo TS |
|---|---|---|
| `ID Revision` (PK) | singleLineText | `reviewId` |
| `ID Candidato` | singleLineText | `candidateId` |
| `Fecha de envio de cv` | singleCollaborator ⚠️ | `cvSentAt` |
| `Status` | singleSelect | `status` |

> ⚠️ `Fecha de envio de cv` está como `singleCollaborator`, debería ser `date`. Pendiente corregir manualmente en Airtable.

### Relaciones (lógicas, hoy via IDs texto)

```
Vacantes (1) ──────< Candidatos (N)        [via ID Vacante]
Candidatos (1) ───< Etapas (N)             [via ID Candidato]
Candidatos (1) ───< Ingresos (1)           [via ID Candidato]
Vacantes (1) ────< Fuentes (N)             [via ID VACANTE]
Vacantes (1) ────< Rango salarial (1)      [via ID VACANTE]
Candidatos (1) ──< Tiempo revisión (N)     [via ID Candidato]
```

**Nota**: Las relaciones son lógicas vía IDs texto, no `Link to another record` reales. Esto facilita la edición manual pero pierde integridad referencial. Para producción se recomienda migrar a links reales.

---

## 📁 Estructura del proyecto

```
Dashboard Reclutamiento/
├── .gitignore                 # excluye .env.local, node_modules, .next, etc.
├── README.md                  # este archivo
├── paleta de colores.jpeg     # referencia visual oficial
├── Paleta_de_colores/         # asset folder
└── app/                       # ← Next.js app (Vercel Root Directory = "app")
    ├── .env.example           # template de variables
    ├── .env.local             # secrets reales (no en git)
    ├── .gitignore             # gitignore local del app
    ├── next.config.mjs        # config Next.js
    ├── next-env.d.ts          # types Next.js
    ├── package.json           # deps + scripts
    ├── package-lock.json
    ├── postcss.config.mjs     # PostCSS para Tailwind
    ├── tailwind.config.ts     # tema, colores brand, sombras
    ├── tsconfig.json          # TS strict mode + path aliases (@/*)
    ├── public/
    │   └── favicon.svg        # favicon con gradient Baldecash
    └── src/
        ├── middleware.ts      # JWT verify + role enforcement
        ├── app/               # App Router de Next.js
        │   ├── layout.tsx     # root layout (theme provider, fonts)
        │   ├── page.tsx       # redirect a /login o /dashboard
        │   ├── globals.css    # Tailwind base + CSS vars + clases brand
        │   ├── not-found.tsx  # 404 page
        │   ├── error.tsx      # error boundary root
        │   ├── global-error.tsx # error boundary global (escapa root layout)
        │   ├── (auth)/        # rutas sin layout dashboard
        │   │   ├── auth-shell.tsx       # shell con branding lado izq
        │   │   ├── layout.tsx
        │   │   ├── login/
        │   │   │   ├── page.tsx
        │   │   │   └── login-form.tsx
        │   │   └── forgot-password/
        │   │       ├── page.tsx
        │   │       └── forgot-form.tsx
        │   ├── api/                     # API routes (Node runtime)
        │   │   ├── auth/
        │   │   │   ├── login/route.ts   # POST: valida + setea cookie JWT
        │   │   │   ├── logout/route.ts  # POST: limpia cookie
        │   │   │   ├── me/route.ts      # GET: usuario actual
        │   │   │   └── forgot/route.ts  # POST: simula envío de enlace
        │   │   ├── candidates/
        │   │   │   ├── route.ts         # GET/POST candidatos
        │   │   │   └── [id]/route.ts    # GET/PATCH/DELETE candidato
        │   │   ├── vacancies/
        │   │   │   ├── route.ts         # GET/POST vacantes
        │   │   │   └── [id]/route.ts    # PATCH/DELETE vacante
        │   │   ├── admin/users/
        │   │   │   ├── route.ts         # GET/POST usuarios (solo admin)
        │   │   │   └── [id]/route.ts    # PATCH/DELETE usuario
        │   │   ├── dashboard/route.ts   # GET agregados (KPIs)
        │   │   ├── activity/route.ts    # GET log de actividad
        │   │   ├── notifications/route.ts # GET/PATCH notificaciones
        │   │   ├── sync/route.ts        # POST ping a Airtable
        │   │   └── health/route.ts      # GET health check
        │   └── dashboard/               # rutas autenticadas
        │       ├── layout.tsx           # layout con sidebar + topbar
        │       ├── error.tsx            # error boundary del dashboard
        │       ├── page.tsx             # /dashboard (Resumen)
        │       ├── candidatos/
        │       │   ├── page.tsx         # SSR de candidatos
        │       │   └── candidates-page.tsx # client component
        │       ├── vacantes/
        │       │   ├── page.tsx
        │       │   └── vacancies-page.tsx
        │       ├── entrevistas/
        │       │   └── page.tsx         # Bitácora
        │       ├── reportes/
        │       │   ├── page.tsx
        │       │   └── reports-page.tsx
        │       ├── actividad/page.tsx   # log de actividad
        │       ├── admin/
        │       │   ├── page.tsx
        │       │   └── admin-page.tsx
        │       ├── ajustes/
        │       │   ├── page.tsx
        │       │   └── settings-page.tsx
        │       └── _components/
        │           ├── sidebar.tsx              # nav lateral con indicador activo
        │           ├── topbar.tsx               # bar superior con búsqueda + user
        │           ├── notification-center.tsx  # popover de notificaciones
        │           ├── global-search.tsx        # búsqueda global Cmd+K
        │           └── shell-transition.tsx     # animación entre páginas
        ├── components/
        │   ├── providers.tsx            # ThemeProvider + Sonner + QueryClient
        │   ├── brand/
        │   │   ├── logo.tsx             # logo Baldecash (mark / full)
        │   │   └── brand-loader.tsx     # spinner de marca
        │   ├── ui/                      # primitives (Shadcn-style)
        │   │   ├── avatar.tsx
        │   │   ├── badge.tsx
        │   │   ├── button.tsx           # con variants gradient, outline, ghost
        │   │   ├── card.tsx             # shadow-card + hover-elevated
        │   │   ├── dialog.tsx
        │   │   ├── dropdown.tsx
        │   │   ├── input.tsx
        │   │   ├── label.tsx
        │   │   ├── select.tsx
        │   │   ├── skeleton.tsx
        │   │   ├── switch.tsx
        │   │   ├── tabs.tsx
        │   │   └── tooltip.tsx
        │   └── dashboard/
        │       ├── kpi-card.tsx         # tarjeta KPI con animación + glow
        │       └── charts.tsx           # Trend, Funnel, Source, StageBar,
        │                                # NotSelectedByStage, DropReasons
        └── lib/
            ├── env.ts                   # lectura de process.env tipada
            ├── types.ts                 # dominio (Candidate, Vacancy, etc.)
            ├── utils.ts                 # cn, formatDate, relativeTime, etc.
            ├── export.ts                # exportToExcel + exportToPdf
            ├── auth/
            │   └── session.ts           # JWT helpers con jose
            └── data/
                ├── repository.ts        # interface única
                ├── airtable.ts          # impl. AirtableRepository
                ├── mock.ts              # impl. MockRepository
                ├── store.ts             # store en memoria (singleton)
                └── seed.ts              # data de demo para modo mock
```

---

## 🚀 Inicio rápido

### Prerequisitos
- Node.js 18+
- npm (o pnpm/yarn)
- En Windows con PowerShell: habilitar scripts con `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`

### Pasos

```bash
# 1. Clonar
git clone https://github.com/marianagomez-crypto/Dashboard-reclutamiento.git
cd Dashboard-reclutamiento/app

# 2. Configurar variables
cp .env.example .env.local
# editar .env.local y poner tu AIRTABLE_TOKEN

# 3. Instalar y arrancar
npm install
npm run dev

# 4. Abrir http://localhost:3000
```

### Credenciales demo (modo dev)

| Rol | Email | Contraseña |
|---|---|---|
| Admin | `admin@baldecash.com` | `Baldecash2026!` |
| Reclutador | `antonella.arellano@baldecash.com` | `Reclutador2026!` |

> Los usuarios del sistema viven en memoria local, no en Airtable. Se crean al arrancar el proceso desde `src/lib/data/seed.ts`.

---

## 🔑 Variables de entorno

Todas en [`app/.env.example`](./app/.env.example).

### Esenciales

| Variable | Default | Descripción |
|---|---|---|
| `DATA_SOURCE` | `mock` | `mock` (in-memory) o `airtable` (real) |
| `AIRTABLE_TOKEN` | _vacío_ | Personal Access Token de Airtable |
| `AIRTABLE_BASE_ID` | _vacío_ | `appGRC5rRH4m1I8g2` (tu base) |
| `AUTH_SECRET` | dev-only | **Cambia en prod** — `openssl rand -base64 48` |
| `AUTH_SESSION_TTL` | `28800` | Duración de sesión en segundos (8h) |

### Nombres de tablas (override opcional)

| Variable | Default |
|---|---|
| `AIRTABLE_TABLE_CANDIDATES` | `Candidatos` |
| `AIRTABLE_TABLE_VACANCIES` | `Vacantes` |
| `AIRTABLE_TABLE_STAGES` | `Etapas` |
| `AIRTABLE_TABLE_SOURCES` | `Fuentes` |
| `AIRTABLE_TABLE_INGRESOS` | `Ingresos` |
| `AIRTABLE_TABLE_SALARY_RANGE` | `Rango salarial` |
| `AIRTABLE_TABLE_REVIEW_TIME` | `Tiempo de revision (head)` |

### Admin bootstrap

| Variable | Default |
|---|---|
| `ADMIN_EMAIL` | `admin@baldecash.com` |
| `ADMIN_PASSWORD` | `Baldecash2026!` |

> En producción, **cambia ambos** y rota el AUTH_SECRET.

### App

| Variable | Default |
|---|---|
| `NEXT_PUBLIC_APP_NAME` | `Baldecash Recruitment` |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` |

### Scopes del Personal Access Token de Airtable

El token debe tener:
- `data.records:read`
- `data.records:write`
- `schema.bases:read`
- `schema.bases:write` *(opcional, solo si la app va a crear/modificar columnas)*

Y debes agregar tu base al token explícitamente en la sección "Access" al crearlo.

---

## 🔐 Roles y permisos

3 roles definidos en `src/lib/types.ts`:

```ts
type Role = 'admin' | 'recruiter' | 'viewer';
```

| Capacidad | Admin | Recruiter | Viewer |
|---|:---:|:---:|:---:|
| Ver dashboard y reportes | ✅ | ✅ | ✅ |
| Ver candidatos y vacantes | ✅ | ✅ | ✅ |
| Crear/editar candidatos | ✅ | ✅ | ❌ |
| Eliminar candidatos | ✅ | ❌ | ❌ |
| Crear/editar vacantes | ✅ | ✅ | ❌ |
| Eliminar vacantes | ✅ | ❌ | ❌ |
| Panel de administración | ✅ | ❌ | ❌ |
| Gestionar usuarios y roles | ✅ | ❌ | ❌ |

Enforcement:
- **Middleware** ([src/middleware.ts](app/src/middleware.ts)) bloquea acceso a `/dashboard/admin` si rol != admin.
- **Cada endpoint server-side** verifica `session.role` antes de mutaciones.

---

## 📄 Páginas del dashboard

### `/dashboard` — Resumen (página principal)

Vista ejecutiva del estado del pipeline.

**Secciones**:
1. **Hero**: saludo + indicador "Conectado · airtable" con ping animado.
2. **6 KPIs**: Candidatos, Nuevos/semana, Vacantes activas, Contrataciones/mes, Conversión/mes, Time-to-hire.
3. **Tendencia de actividad** (área-chart 30d): aplicaciones vs contrataciones por día.
4. **Fuentes de candidatos** (pie): distribución por canal.
5. **No seleccionados por etapa** (bar horizontal): dónde descartas talento.
6. **Motivos de caída** (bar horizontal): por qué abandonan candidatos + insight principal.
7. **Distribución por etapa** (bar horizontal): solo candidatos con `Estado Final = "En proceso"`.

**Server Component** que fetchea todo en paralelo y pasa a componentes cliente para animación.

### `/dashboard/candidatos` — Pipeline de candidatos

Tabla completa de candidatos con CRUD.

**Funcionalidades**:
- Búsqueda por nombre / ID / reclutador
- Filtros: etapa, fuente, vacante, reclutador
- Cambio de etapa inline (Select que llama a PATCH)
- Crear candidato (modal con campos requeridos según Airtable)
- Editar candidato (modal con Motivo Caída como Select condicional)
- Eliminar candidato (solo admin)
- Export Excel y PDF de la vista filtrada
- Badge de color por Estado Final
- Avatar con iniciales

### `/dashboard/vacantes` — Vacantes

Cards en grid con filtros y CRUD.

**Funcionalidades**:
- Filtros por estado (Abierta / En Pausa / Cerrada) y área
- Dropdown menu por vacante: Ver detalle / Editar / Eliminar
- Modal de detalle con todos los campos
- Modal de edición completo
- Crear vacante con form que matchea el schema real
- Métricas por card: candidatos totales · contratados
- Badge de Estado, Prioridad, Modalidad, Veces reabierta

### `/dashboard/entrevistas` — Bitácora

> **Nota**: la URL dice "entrevistas" pero el label es "Bitácora" porque originalmente era una sección de entrevistas y se reorientó.

Muestra **etapas en curso** (sin Fecha Fin) y **etapas cerradas** (con Fecha Fin) desde la tabla `Etapas`.

### `/dashboard/reportes` — Reportes

Mismas visualizaciones que el resumen pero con **filtros temporales** (7/30/90/365 días o todo) y filtro por vacante. Incluye **resumen ejecutivo** y **tabla detalle** con export.

### `/dashboard/actividad` — Logs

Feed de actividad del sistema (creaciones, ediciones, sincronizaciones, exports, logins). Almacenado en memoria local.

### `/dashboard/admin` — Panel de administración (solo admin)

CRUD de usuarios del sistema. No toca Airtable — los usuarios viven en `store.ts`.

**Acciones**:
- Crear usuario (email, nombre, rol)
- Editar usuario (cambiar rol, activar/desactivar)
- Eliminar usuario
- Reset de contraseña

### `/dashboard/ajustes` — Settings

4 tabs:
1. **Perfil**: ver email, nombre, rol del usuario actual
2. **Apariencia**: theme switcher (claro / oscuro / sistema)
3. **Integraciones**: estado de conexión a Airtable + botón "Sincronizar ahora"
4. **About**: info de la app

---

## 📐 KPIs y métricas (fórmulas)

### Candidatos
```ts
totalCandidates = candidates.length
```

### Nuevos / semana
```ts
weekAgo = now - 7 * 86_400_000
newThisWeek = candidates.filter(c =>
  c.appliedAt && new Date(c.appliedAt).getTime() >= weekAgo
).length
```

> Si `Fecha Postulación` está vacía, el candidato **no cuenta** (antes lo asumía como hoy — bug corregido).

### Vacantes activas
```ts
activeVacancies = vacancies.filter(v => v.status === 'Abierta').length
```

### Contrataciones / mes
```ts
monthAgo = now - 30 * 86_400_000
hired = candidates.filter(c => c.finalStatus === 'Contratado')
hiresThisMonth = hired.filter(c =>
  c.appliedAt && new Date(c.appliedAt).getTime() >= monthAgo
).length
```

### Conversión / mes ⭐
Cambió a **MENSUAL** y **sin "No seleccionado"**:
```ts
inLastMonth = (c) =>
  c.appliedAt && new Date(c.appliedAt).getTime() >= monthAgo

hiredThisMonthSet = candidates.filter(c =>
  c.finalStatus === 'Contratado' && inLastMonth(c)
)
droppedThisMonth = candidates.filter(c =>
  c.finalStatus === 'Se cayó' && inLastMonth(c)
)
resolvedThisMonth = hiredThisMonthSet.length + droppedThisMonth.length

conversionRate = resolvedThisMonth > 0
  ? (hiredThisMonthSet.length / resolvedThisMonth) * 100
  : 0
```

**Por qué**:
- Mensual → refleja el momento actual del proceso, no la historia completa.
- Excluye "No seleccionado" → esos son decisiones internas de filtrado, no fallas de retención.
- Mide: *"del talento que aprobé, qué % terminó firmando"*.

### Time-to-hire
```ts
hiredWithDate = hired.filter(c => !!c.appliedAt)
avgTimeToHireDays = hiredWithDate.reduce((acc, c) =>
  acc + (Date.now() - new Date(c.appliedAt).getTime()) / 86_400_000, 0
) / hiredWithDate.length
```

### Tendencia diaria (30 días)
```ts
// Agrupación por YYYY-MM-DD para evitar problemas de timezone
const key = c.appliedAt.slice(0, 10);  // 'YYYY-MM-DD'
apCount[key] += 1;
hireCount[key] += 1;
```

> ⚠️ **Decisión técnica importante**: agrupar por **string** (`"2026-04-29"`) en vez de `getTime()` evita que las fechas sin hora se shifteen 1 día por timezone (un bug que tuvimos al inicio).

### Distribución por etapa
Solo cuenta candidatos con `Estado Final = "En proceso"`:
```ts
const inProcess = candidates.filter(c => c.finalStatus === 'En proceso')
inProcess.forEach(c => stageCounts[c.stage] += 1)
```

### No seleccionados por etapa
```ts
notSelectedByStage = STAGES.map(s => ({
  stage: s,
  value: candidates.filter(c =>
    c.finalStatus === 'No seleccionado' && c.stage === s
  ).length
})).filter(d => d.value > 0)
```

### Motivos de caída
```ts
dropped = candidates.filter(c => c.finalStatus === 'Se cayó')
dropReasons = DROP_REASONS.map(reason => ({
  reason,
  value: dropped.filter(c => c.dropReason === reason).length
}))
```

---

## 🔌 APIs REST

Todas en `app/src/app/api/` con runtime Node.js y validación Zod.

### Auth

| Method | Endpoint | Body | Returns |
|---|---|---|---|
| `POST` | `/api/auth/login` | `{ email, password }` | `{ user }` + cookie JWT |
| `POST` | `/api/auth/logout` | — | `{ ok: true }` |
| `GET` | `/api/auth/me` | — | `{ user }` (de la sesión) |
| `POST` | `/api/auth/forgot` | `{ email }` | `{ ok: true }` |

### Candidatos

| Method | Endpoint | Query / Body | Returns |
|---|---|---|---|
| `GET` | `/api/candidates` | `?search&stage&source&vacancyId&recruiter&finalStatus` | `{ data: Candidate[] }` |
| `POST` | `/api/candidates` | `{ name, vacancyId, source, recruiter, stage, finalStatus, dropReason }` | `{ data: Candidate }` |
| `GET` | `/api/candidates/[id]` | — | `{ data: Candidate }` |
| `PATCH` | `/api/candidates/[id]` | Partial fields | `{ data: Candidate }` |
| `DELETE` | `/api/candidates/[id]` | — | `{ ok: true }` |

### Vacantes

| Method | Endpoint | Query / Body | Returns |
|---|---|---|---|
| `GET` | `/api/vacancies` | `?search&status&area&priority` | `{ data: Vacancy[] }` |
| `POST` | `/api/vacancies` | `{ title, area, seniority, recruiter, hiringManager, positions, status, priority, modalidad }` | `{ data: Vacancy }` |
| `PATCH` | `/api/vacancies/[id]` | Partial fields | `{ data: Vacancy }` |
| `DELETE` | `/api/vacancies/[id]` | — | `{ ok: true }` |

### Admin (solo rol admin)

| Method | Endpoint | Body | Returns |
|---|---|---|---|
| `GET` | `/api/admin/users` | — | `{ data: User[] }` |
| `POST` | `/api/admin/users` | `{ email, name, role, password }` | `{ data: User }` |
| `PATCH` | `/api/admin/users/[id]` | Partial + `password?` | `{ data: User }` |
| `DELETE` | `/api/admin/users/[id]` | — | `{ ok: true }` |

### Otros

| Method | Endpoint | Returns |
|---|---|---|
| `GET` | `/api/dashboard` | KPIs agregados |
| `GET` | `/api/activity?limit=N` | Logs de actividad |
| `GET` | `/api/notifications` | Lista de notificaciones |
| `PATCH` | `/api/notifications` | Mark as read |
| `POST` | `/api/sync` | Trigger sync con Airtable |
| `GET` | `/api/health` | `{ ok, source }` |

---

## 🔒 Auth y middleware

### Flow de autenticación

```
1. Usuario POST /api/auth/login
   ↓
2. Server valida email/password contra store
   ↓
3. Server firma JWT (jose, HS256) con payload {sub, email, name, role, exp}
   ↓
4. Server set-cookie httpOnly Secure SameSite=Lax
   ↓
5. Cliente redirige a /dashboard
   ↓
6. Middleware intercepta cada request a /dashboard/*
   ↓
7. Middleware lee cookie → jwtVerify(token)
   ├─ inválido → redirect /login?from=...
   └─ válido → continúa
   ↓
8. Si la ruta es /dashboard/admin y session.role !== 'admin'
   → redirect /dashboard
```

### Helpers en `src/lib/auth/session.ts`

```ts
sign({ sub, email, name, role }, ttlSeconds): Promise<string>
verify(token): Promise<SessionPayload | null>
getSession(): Promise<SessionPayload | null>  // server-side, lee cookie
clearSession(): void
```

### Middleware en `src/middleware.ts`

```ts
matcher: ['/dashboard/:path*', '/api/admin/:path*']

export async function middleware(req) {
  const session = await getSession()
  if (!session) return NextResponse.redirect(new URL('/login', req.url))
  if (req.nextUrl.pathname.startsWith('/dashboard/admin')
      && session.role !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }
  return NextResponse.next()
}
```

---

## 🧩 Componentes UI

### Primitives (`src/components/ui/`)

Basados en Radix UI + Tailwind. Estilo Shadcn pero implementados a mano con paleta Baldecash.

- **Avatar** — con fallback de iniciales
- **Badge** — variants: default, outline, success, warning, destructive, blue, aqua, gold
- **Button** — variants: default, gradient, outline, ghost, destructive; loading state
- **Card** — shadow multi-capa, hover lift, rounded 2xl
- **Dialog** — modal con backdrop blur
- **Dropdown** — menu con items
- **Input** — text input estándar
- **Label** — para forms
- **Select** — dropdown de selección
- **Skeleton** — loader animado
- **Switch** — toggle
- **Tabs** — tab navigation
- **Tooltip** — popover de hover

### Dashboard components (`src/components/dashboard/`)

- **KpiCard** — tarjeta KPI con icon, label, value animado (Framer Motion), trend %, hint, top accent bar, glow brand permanente.
- **TrendChart** — área chart (Recharts) con 2 series, gradientes, tooltip, labels condicionales.
- **FunnelChart** — barras verticales con gradiente por etapa, animadas con stagger.
- **SourceChart** — pie/donut con labels externos.
- **StageBarChart** — barras horizontales con gradiente, labels permanentes a la derecha, configurable título/descripción.
- **NotSelectedByStageChart** — barras horizontales con tinte azul brand + insight automático ("La mayoría de descartes ocurre en X").
- **DropReasonsChart** — barras horizontales con paleta semántica por motivo + 2 stat cards (total + motivo principal).

### Brand (`src/components/brand/`)

- **Logo** — `variant`: `'mark'` (solo símbolo) o `'full'` (símbolo + wordmark)
- **BrandLoader** — spinner animado con gradient brand

### Providers (`src/components/providers.tsx`)

Wrappers para toda la app:
- `ThemeProvider` (next-themes)
- `QueryClientProvider` (TanStack Query)
- `Toaster` (Sonner)

---

## 🎨 Sistema de diseño

### Paleta Baldecash

Tres familias × 7 tonos:

```
Blue:  100 #D6DCED · 200 #98A9DF · 300 #6873D7 · 400 #4453A0 · 500 #31359C · 600 #212469 · 700 #151744
Aqua:  100 #E0F1F3 · 200 #BEF7F3 · 300 #A9DAE6 · 400 #5CBFBE · 500 #36B7B3 · 600 #00A29B · 700 #007974
Gold:  100 #FFF7E6 · 200 #FFEABB · 300 #FEDD90 · 400 #FDCA56 · 500 #D1A646 · 600 #987933 · 700 #4D3D1C
```

### Tokens (CSS variables en `globals.css`)

Modo claro:
```css
--background: 220 33% 97%;  /* gris azulado #F5F7FB */
--foreground: 232 52% 12%;  /* casi negro azulado */
--card: 0 0% 100%;          /* blanco puro */
--border: 225 18% 91%;      /* borde sutil */
--primary: 236 50% 41%;     /* Blue 500 */
--secondary: 178 100% 32%;  /* Aqua 600 */
--accent: 42 98% 67%;       /* Gold 400 */
--radius: 1.25rem;          /* 20px */
```

Modo oscuro: análogo con `.dark` y valores invertidos.

### Sombras premium (Stripe/Linear-style)

```css
shadow-card:
  0 0 0 1px rgba(31,41,82,0.05),     /* hairline borde */
  0 1px 2px rgba(31,41,82,0.04),     /* sombra cercana */
  0 6px 16px -4px rgba(31,41,82,0.06), /* sombra media */
  0 16px 32px -12px rgba(31,41,82,0.05) /* sombra ambiente */

shadow-card-hover: versión intensificada con tinte azul brand
shadow-card-elevated: para hero / cards destacadas
shadow-tint-blue/aqua/gold: glow permanente sutil
shadow-glow / glow-aqua / glow-gold: glow intenso para hover
```

Todas usan `rgba(31,41,82,...)` (foreground brand) en vez de negro puro → da el look premium.

### Animaciones (Tailwind + Framer Motion)

Keyframes custom:
- `shimmer` — skeleton loader
- `pulse-soft` — indicador "vivo"
- `float` — flotación sutil
- `gradient-x` — gradient animado

Springs de Framer:
- `transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}` — entrada estándar
- `animate(motionValue, target, { duration: 1.2 })` — contadores animados

### Tipografía

- **Display**: `font-display` (titles) — system-ui con feature settings `ss01`
- **Sans**: `font-sans` (body) — system-ui

---

## 📤 Exportación de reportes

`src/lib/export.ts` ofrece dos funciones:

### Excel
```ts
exportToExcel(rows: Record<string, any>[], filename: string)
```
Usa `xlsx`. Crea hoja "Reporte" con headers automáticos.

### PDF
```ts
exportToPdf({ title, subtitle?, columns, rows }: {
  title: string
  subtitle?: string
  columns: string[]
  rows: (string | number)[][]
})
```
Usa `jspdf` + `jspdf-autotable`. Header con colores Baldecash, tabla zebrada, fecha de generación.

Usadas en:
- `/dashboard/candidatos` — botones Excel / PDF
- `/dashboard/reportes` — exporta vista filtrada

---

## ☁️ Deploy en Vercel

### Setup inicial

1. Import del repo en Vercel
2. **Framework Preset**: Next.js (debería detectarse solo)
3. **Root Directory**: `app` ← crítico, no dejar en `./`
4. Build & Output: defaults
5. **Environment Variables**: importar `.env.local` o pegar variables manualmente
6. Deploy

### Variables necesarias en Vercel

Mismas que en `.env.local`. **Importante**:
- `AUTH_SECRET`: generar uno nuevo solo para prod (`openssl rand -base64 48`)
- `AIRTABLE_TOKEN`: rotar del que tengas en local
- `NEXT_PUBLIC_APP_URL`: actualizar después del primer deploy a la URL real de Vercel
- `ADMIN_PASSWORD`: cambiar a algo único

### Auto-deploy con GitHub

Vercel detecta los pushes al branch `main` y redespliega automáticamente. Configurable en Vercel → Settings → Git.

### Verificación post-deploy

```bash
curl https://tu-app.vercel.app/api/health
# Debe devolver: {"ok":true,"detail":"airtable connected","source":"airtable"}
```

---

## 💻 Desarrollo local

### Scripts

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "type-check": "tsc --noEmit"
}
```

### Workflow recomendado

```bash
# Antes de empezar a trabajar:
cd app
git pull
npm install  # solo si package.json cambió

# Durante desarrollo:
npm run dev  # http://localhost:3000

# Antes de commitear:
npm run type-check  # debe pasar verde
```

### Hot reload caveats

- Cambios en `.tsx`, `.ts`, `.css` → HMR automático.
- Cambios en `tailwind.config.ts` o `globals.css` → reiniciar dev server.
- Cambios en `.env.local` → reiniciar dev server.
- Cambios estructurales grandes → borrar `.next/` y rebuild.

```powershell
# Windows PowerShell:
Remove-Item -Recurse -Force .next
npm.cmd run dev
```

---

## 🐛 Troubleshooting

### "ChunkLoadError: Loading chunk failed"
Cache del browser apunta a chunks viejos. Solución:
1. `Ctrl+C` dev server
2. `Remove-Item -Recurse -Force .next`
3. `npm run dev`
4. Hard refresh en navegador (`Ctrl+Shift+R`)

### "Missing required error components, refreshing..."
Falta `error.tsx` o `global-error.tsx`. Ya están creados — si lo ves, hay un error real subyacente. Mira la consola del browser para detalle.

### "ENOTFOUND api.airtable.com"
Problema de red/DNS. Verifica:
```powershell
node -e "require('dns').promises.lookup('api.airtable.com').then(console.log).catch(console.log)"
```
Si falla:
- Desconecta VPN
- Cambia DNS a `8.8.8.8` / `1.1.1.1`
- `ipconfig /flushdns`

### "Invalid baseId, tableId..."  al crear/editar campos
El token de Airtable no tiene scope `schema.bases:write`. Re-conecta la integración con ese permiso o haz los cambios manualmente en Airtable.

### Login funciona pero el dashboard tira 500
Probablemente Airtable está caído o el token expiró. Cambia temporalmente:
```env
DATA_SOURCE="mock"
```
Reinicia dev server. Investiga el problema con Airtable.

### "Value need to be finite number for Intl.RelativeTimeFormat"
Fecha vacía/inválida pasada a `relativeTime()`. Ya está blindado, pero si vuelve a aparecer significa que algún campo nuevo de Airtable no se está limpiando. Revisa que el `appliedAt` tenga valor.

### 404 NOT_FOUND en Vercel
**Root Directory** mal configurado. Settings → General → Root Directory = `app`. Redeploy.

---

## 🧠 Decisiones técnicas no obvias

### 1. Por qué `'use client'` solo en interactivos
Server Components son default. Solo se marcan client cuando necesitan estado/effects/event handlers. Esto mantiene el JS del cliente al mínimo (~88kB shared).

### 2. Por qué agrupar fechas por string `YYYY-MM-DD`
Para gráficos diarios. `new Date("2026-04-29")` se interpreta como UTC midnight, que en UTC-5 (Lima) es 19:00 del 28 de abril → bucketing por timestamp corre 1 día. Usar `appliedAt.slice(0, 10)` como key evita el problema.

### 3. Por qué Auth está separada de Airtable
Los usuarios del sistema cambian raramente y necesitan password hashing. Mezclarlos con la data operativa (candidatos, vacantes) ensucia la base de Airtable. Decidí mantener auth en memoria/store local con seed inicial. Para producción real con persistencia, mover a un DB (Postgres, SQLite, etc.).

### 4. Por qué la conversión es mensual y excluye "No seleccionado"
- **Mensual**: refleja la salud del proceso actual, no histórica.
- **Sin "No seleccionado"**: esas son decisiones tuyas de descartar, no fallas de retención. Incluirlas castiga al equipo por filtrar bien.
- Fórmula: `Contratado / (Contratado + Se cayó)` del último mes.

### 5. Por qué `border-border/80` en vez de `border-border`
La paleta tiene border al 18% sat — al 80% opacity se ve más sutil, estilo Linear.

### 6. Por qué `shadow-card` usa rgba con tinte azul
`rgba(31,41,82,...)` es el `--foreground` brand. Las sombras "negras" puras se ven baratas en SaaS modernos. Con tinte brand se sienten premium.

### 7. Por qué la primary key de Candidatos es texto y no link
Las relaciones son lógicas: `ID Vacante` (texto) → `VC0001`. Si fuera un link real de Airtable, el cliente JS recibe IDs internos (`recXXX`) en vez de IDs legibles. Para mantener legibilidad y facilitar la edición manual de columnas usé texto. Costo: sin integridad referencial.

### 8. Por qué pasar `icon={<Users />}` y no `icon={Users}` a KpiCard
Server Components no pueden pasar funciones-componente a Client Components (no son serializables). `<Users />` ya está renderizado.

---

## 🗺️ Roadmap y mejoras pendientes

### Pendientes en Airtable
- [ ] Eliminar 1 record vacío en Vacantes (`recENPKvu3Eigfsk0`)
- [ ] C0021 Haru Caballero: agregar Fecha Postulación
- [ ] C0011 Erick Sanchez: asignar Motivo Caída (está "Se cayó" sin razón)
- [ ] Cambiar tipo de `Fecha de envio de cv` en Tiempo de revisión: `singleCollaborator` → `date`
- [ ] Migrar campos `ID Vacante`, `ID Candidato` a Links reales

### Mejoras de código
- [ ] Tests E2E con Playwright
- [ ] Migrar usuarios a una DB (SQLite con Prisma, o Vercel KV)
- [ ] Implementar rate limiting en `/api/auth/*`
- [ ] Caché de Airtable con TTL (evitar pegarle a cada request)
- [ ] Webhooks de Airtable para actualizaciones en tiempo real
- [ ] Soporte para attachments en candidatos (CVs)

### Nuevas vistas posibles
- [ ] **Quality of hire** desde tabla Ingresos (retención, performance, tasa de éxito en período de prueba)
- [ ] **ROI por fuente** cruzando Fuentes (costo) + Candidatos (resultado)
- [ ] **Bottleneck analysis** usando Etapas (tiempo promedio por etapa)
- [ ] **Timeline del candidato** con movimientos cronológicos
- [ ] **Hiring Manager scorecard**: hires + tiempo por HM
- [ ] **Análisis salarial**: Rango salarial vs Salario final ofrecido
- [ ] **Tiempo de revisión por HM**: usando la tabla nueva

### Mejoras UX
- [ ] Multi-select de filtros (varias etapas, varias fuentes)
- [ ] Vista Kanban de candidatos por etapa
- [ ] Drag & drop para cambiar etapa
- [ ] Búsqueda fuzzy global con resultados por categoría
- [ ] Comandos rápidos (Cmd+K) tipo Linear

---

## 📝 Notas operativas

### Datos sintéticos creados durante el setup

Para que el dashboard tuviera data realista en demo, creé estos registros en Airtable. Si quieres limpiarlos, dime:

| Tabla | Registros | Status |
|---|---|---|
| Etapas | MV0001–MV0008 (fechas actualizadas) + MV0009–MV0016 (creados) | Pueden quedarse si tu equipo registra movimientos reales |
| Ingresos | 2 nuevos (C0009, C0010) | Pueden quedarse |
| Rango salarial | 11 registros con bandas salariales | Estimaciones según seniority — reemplaza con valores reales |

### Cómo extender el dominio

Para agregar un campo nuevo a Candidatos, por ejemplo `Salario esperado`:

1. **En Airtable**: crear el campo en la tabla Candidatos
2. **En `src/lib/types.ts`**: agregar a la interface `Candidate`
3. **En `src/lib/data/airtable.ts`**:
   - Agregar key al objeto `F.candidate`
   - Mapear en `candidateFromRecord()`
4. **En las APIs** (`route.ts`): si va a aceptarse en create/update, agregar al schema Zod
5. **En la UI**: agregar input en los modales de crear/editar

---

## 👥 Créditos

Construido para **Baldecash** por el equipo de desarrollo interno.

Tecnologías de terceros usadas (todas open source):
- Next.js (Vercel)
- React (Meta)
- Tailwind CSS
- Radix UI
- Framer Motion
- Recharts
- Airtable SDK
- jose / bcryptjs / zod
- Lucide Icons

---

## 📄 Licencia

Privado — Baldecash 2026. Uso interno.

---

<div align="center">

**Repo**: https://github.com/marianagomez-crypto/Dashboard-reclutamiento

</div>
