# Baldecash Recruitment Platform

Plataforma web premium para la gestion y visualizacion de reportes de reclutamiento de **Baldecash**, integrada con tu base Airtable real (`appGRC5rRH4m1I8g2`).

> Codigo de la aplicacion: [`/app`](./app)

---

## Inicio rapido

```bash
cd app
npm install
npm run dev      # http://localhost:3000
```

> En Windows + PowerShell: si te bloquea la ejecucion de scripts, ejecuta una vez
> `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`
> o usa `npm.cmd run dev`.

**Credenciales de acceso (admin local):**

| Rol            | Email                              | Contrasena       |
| -------------- | ---------------------------------- | ---------------- |
| Administrador  | admin@baldecash.com                | Baldecash2026!   |
| Reclutador 1   | antonella.arellano@baldecash.com   | Reclutador2026!  |
| Reclutador 2   | mayra.pereira@baldecash.com        | Reclutador2026!  |
| Director       | directora@baldecash.com            | Reclutador2026!  |

> Los usuarios de auth viven LOCAL (no en Airtable). Crearlos y editarlos se hace desde el panel de admin.

---

## Modelo de datos (mapeado a tu Airtable real)

La app esta sincronizada con la base **`appGRC5rRH4m1I8g2`** y consume estas 6 tablas:

### Candidatos (tbl9Eb4EIsqY5vhHm)
`ID_Candidato`, `Nombre Completo`, `ID Vacante`, `Fuente`, `Fecha Postulación`, `Reclutador`, `Etapa Actual`, `Estado Final`, `Motivo Caída`, `Contratado`.

**Etapas**: Screening · Entrevista T&C · Entrevista Líder · Prueba Tecnica · Oferta · Ingreso  
**Estado Final**: En proceso · Contratado · Se cayó · No seleccionado  
**Fuentes**: LinkedIn · Referido · Computrabajo · Bumeran  
**Reclutadores**: Antonella Arellano · Mayra Pereira

### Vacantes (tblzOTwm8yualc6an)
`ID_Vacante`, `Puesto`, `Área`, `Seniority`, `Reclutador`, `Hiring Manager`, `Fecha Apertura`, `Fecha Cierre`, `Estado Vacante`, `Prioridad`, `Modalidad`, `Cantidad Posiciones`, `Veces Reabierta`, `Motivo Reapertura`.

**Áreas**: COBRANZAS · CONTABILIDAD Y CONTROLLER · CONVENCIONES Y ALIANZAS · GROWTH · LEGAL · OPERACIONES · TALENTO & CULTURA · TECONOLOGIA Y FINANZAS · VENTAS · PRODUCT OWNER  
**Estado**: Abierta · En Pausa · Cerrada  
**Prioridad**: Alta · Media · Baja  
**Modalidad**: Hibrido · Presencial  
**Hiring Managers**: Antonella Arellano, Jorge Morales, Marco Del Rio, Ruben Montenegro, Meylin Miyashiro, Yadira Yovera, Monica Obando

### Etapas (tblcGtXMah2F9m4a6) — Historial de movimientos
`ID Movimiento`, `ID Candidato`, `ID Vacante`, `Etapa`, `Fecha Inicio`, `Fecha Fin`, `Resultado` (Aprobado · Aceptó Oferta · No se presentó), `Comentarios`.

### Eventos (tblJE0Olt024kQAqJ) — Bitácora
`Fecha`, `ID Vacante`, `ID Candidato`, `Evento` (Vacante creada · Postulación · Oferta enviada · Oferta aceptada · Caída candidato · Vacante reabierta), `Responsable`, `Comentario`.

### Fuentes (tblAEXtXNSdrncanh) — Catálogo
`Fuente`, `Tipo`, `Costo Mensual`, `Responsable`, `Attachments`.

### Ingresos (tblGkRAoMUXEWZk5S) — Onboarding/Retención
`ID Candidato`, `Fecha Ingreso`, `Sigue en Empresa`, `Fecha Salida`, `Pasó Periodo Prueba`, `Performance`, `Comentario Líder`.

Mapeo de campos: [`app/src/lib/data/airtable.ts`](./app/src/lib/data/airtable.ts).

---

## Variables de entorno

Ya configuradas en `app/.env.local`. Si necesitas cambiarlas:

| Variable                      | Valor actual                                  |
| ----------------------------- | --------------------------------------------- |
| `DATA_SOURCE`                 | `airtable`                                    |
| `AIRTABLE_TOKEN`              | (tu PAT)                                      |
| `AIRTABLE_BASE_ID`            | `appGRC5rRH4m1I8g2`                           |
| `AIRTABLE_TABLE_CANDIDATES`   | `Candidatos`                                  |
| `AIRTABLE_TABLE_VACANCIES`    | `Vacantes`                                    |
| `AIRTABLE_TABLE_STAGES`       | `Etapas`                                      |
| `AIRTABLE_TABLE_EVENTS`       | `Eventos`                                     |
| `AIRTABLE_TABLE_SOURCES`      | `Fuentes`                                     |
| `AIRTABLE_TABLE_INGRESOS`     | `Ingresos`                                    |
| `AUTH_SECRET`                 | generado (base64 48 bytes)                    |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | admin bootstrap local                      |

> **Importante de seguridad**: el PAT actual fue compartido en chat. Rotarlo en
> https://airtable.com/create/tokens antes de pasar a produccion.

Para cambiar a datos simulados sin tocar Airtable: `DATA_SOURCE="mock"`.

---

## Arquitectura

```
+-------------------+        +--------------------+
|   Next.js (UI)    |  ----> |  API Routes (REST) |
|  React + Tailwind |        |  Zod validation    |
|  Framer Motion    |        |  JWT (jose)        |
+-------------------+        +----------+---------+
                                        |
                              +---------v----------+
                              |  Repository layer  |
                              +----+----------+----+
                                   |          |
                          +--------v--+   +---v-------+
                          |  Mock     |   |  Airtable |
                          | (memoria) |   |  (real)   |
                          +-----------+   +-----------+

Autenticacion + Usuarios + Notificaciones + Actividad => store local
(no contamina tu base de Airtable con datos del sistema).
```

---

## Características

### Pipeline de reclutamiento
- **Dashboard** con 6 KPIs animados, área-chart de tendencias 30d, embudo por etapa, pie de fuentes, bar de etapas.
- **Candidatos** con tabla filtrable (etapa, fuente, vacante, reclutador), búsqueda, cambio de etapa inline, alta/baja, export Excel/PDF.
- **Vacantes** con tarjetas, filtros (estado, área), métricas por vacante (candidatos · contratados), alta.
- **Bitácora** combina Eventos + Etapas en curso de Airtable.
- **Reportes** con rangos temporales (7/30/90/365/todo), filtro por vacante, exportación.
- **Actividad** con feed de cambios del sistema.

### Auth & Admin
- Login JWT, sesión httpOnly, middleware que protege todas las rutas `/dashboard/*`.
- Recuperación de contraseña.
- Panel **Admin** (solo rol admin) para CRUD de usuarios y roles.

### UI premium
- Paleta oficial Baldecash (Blue / Aqua / Gold).
- Glassmorphism, mesh gradients, motion blur, contadores animados.
- Loader de marca.
- Dark mode.
- Sonner toasts y centro de notificaciones con badge animado.

### Roles y permisos

| Capacidad                  | Admin | Reclutador | Viewer |
| -------------------------- | :---: | :--------: | :----: |
| Ver dashboard y reportes   |   ✓   |     ✓      |   ✓    |
| Ver candidatos / vacantes  |   ✓   |     ✓      |   ✓    |
| Crear/editar candidatos    |   ✓   |     ✓      |        |
| Eliminar candidatos        |   ✓   |            |        |
| Crear/editar vacantes      |   ✓   |     ✓      |        |
| Eliminar vacantes          |   ✓   |            |        |
| Panel de administración    |   ✓   |            |        |

---

## Estructura del proyecto

```
app/
  src/
    app/
      (auth)/                # login, forgot-password
      api/                   # endpoints REST con Zod + JWT
        auth/                # login, logout, me, forgot
        candidates/          # GET/POST + [id] PATCH/DELETE
        vacancies/           # GET/POST + [id] PATCH/DELETE
        admin/users/         # solo admin
        dashboard/           # KPIs agregados
        notifications/
        activity/
        sync/                # ping a Airtable
        health/
      dashboard/             # rutas protegidas
        candidatos/ vacantes/ entrevistas/ (bitácora)
        actividad/ reportes/ admin/ ajustes/
        _components/         # sidebar, topbar, notif center
    components/
      ui/                    # primitives
      brand/                 # logo + loader
      dashboard/             # kpi-card, charts (Recharts)
      providers.tsx
    lib/
      data/                  # mock + airtable + repository
      auth/                  # sesion jose
      types.ts               # dominio Baldecash
      env.ts utils.ts export.ts
    middleware.ts
  public/favicon.svg
  .env.local                 # secrets (no se sube a git)
  tailwind.config.ts
  next.config.mjs
  tsconfig.json
```

---

## Stack

- **Next.js 14** (App Router) · **React 18** · **TypeScript 5**
- **Tailwind 3** + tailwindcss-animate · **Framer Motion** · Radix UI primitives
- **Recharts** para visualizaciones
- **Airtable SDK** oficial + capa de mapeo de dominio
- **jose** JWT + **bcryptjs** + **zod**
- **xlsx** / **jspdf** para exportar
- **Sonner** + **next-themes**

---

## Deploy a producción

### Vercel
1. Importa el repo en Vercel apuntando a la carpeta `app/`.
2. Configura las variables de entorno (las mismas que en `.env.local`).
3. Deploy. Cookies `secure` automáticas en producción.

### Hardening
- **Rotar** `AIRTABLE_TOKEN` (el actual estuvo en chat).
- Rotar `AUTH_SECRET` con `openssl rand -base64 48` o equivalente.
- HTTPS real en `NEXT_PUBLIC_APP_URL`.
- Rate limit en `/api/auth/*` desde el balanceador.
- Revisar permisos del PAT — la app solo necesita `data.records:read`, `data.records:write`, `schema.bases:read`.
