# 05 | SEMANA 5 — FRONTEND, UI/UX Y CONEXIÓN REAL CON LA API

**Proyecto:** NutriScan — Inspección y Registro de Calidad 4.0  
**Estudiante:** Tomás Agustín Gudiño Rubiolo  
**KIT 4.0:** AVZ-02 — Visión para Control de Calidad  
**Frontend Stack:** React 18 (Vite SPA) + Tailwind CSS + Context API + Lucide Icons  
**Conexión Backend:** Express REST API (`http://localhost:3000/api`) + PostgreSQL en Neon Cloud (Prisma ORM 5)  
**Fecha de Cierre:** Septiembre 2026  

---

## 1. Resumen Ejecutivo de la Semana

Durante la Semana 5 se construyó la aplicación cliente completa (**Single Page Application**) en **React con Vite y Tailwind CSS** para el sistema **NutriScan**, cumpliendo estrictamente con la directiva docente de establecer la conexión HTTP real cliente-servidor desde el primer momento:

1. **Conexión Inicial Activa Frontend $\rightarrow$ API:** Se configuró la variable de entorno `VITE_API_URL` y se implementó un cliente HTTP modular y centralizado (`src/services/api.js`) con inyección automática de cabeceras `Authorization: Bearer <token>`, normalización robusta de URLs y captura global de errores HTTP (`401 Unauthorized` con deslogueo reactivo, `403 Forbidden` y `500`).
2. **Monitor de Conectividad en Tiempo Real:** Se incorporó en el Navbar un badge interactivo que sondea periódicamente `GET /api/health`, indicando con señalética verde pulsante `"API Online (PostgreSQL Neon)"` o `"Desconectado"`.
3. **Autenticación Global y Rutas Protegidas (RBAC):** `AuthContext.jsx` gestiona la sesión con persistencia en `localStorage` y validación criptográfica contra `GET /api/auth/perfil`. El componente `ProtectedRoute.jsx` asegura que cada perfil acceda exclusivamente a las pantallas autorizadas.
4. **Pantalla de Login Industrial con Chips de Demostración:** Interfaz moderna orientada a Industria 4.0 (paleta Slate/Zinc con detalles en Cyan y acentos esmeralda/ámbar), con botones de acceso rápido de 1 clic (**"Chips"**) para autocompletar credenciales de prueba docente (`Operario`, `Supervisor`, `Admin`) y redirección automática al panel correspondiente.
5. **Estación Táctil de Operario de Línea (`/operario/estacion`):**
   - Selector táctil de línea de producción (`FRASCO` o `LATA`) conectado en vivo a `GET /api/lotes/activo?tipo_envase=...`.
   - Visor de visión artificial inteligente (simulador AVZ-02) con retículo de inspección, láser animado de escaneo, contador de FPS y botones táctiles de alto impacto: **Pieza Conforme** (`POST /api/inspecciones` APROBADO) y **Registrar Defecto**.
   - Modal dinámico de descarte con catálogo cargado en vivo (`GET /api/tipos-defecto`), observación de planta y disparo automático de alertas operativas en Neon Cloud.
   - Tarjetas de recuento de descartes reactivas conectadas a `GET /api/inspecciones/lote/:id` (total, conformes, descartadas y % de tasa de descarte con semáforo dinámico).
6. **Dashboard del Supervisor de Calidad (`/supervisor/dashboard`):**
   - Gestión y control de lote activo con finalización controlada de turno (`PATCH /api/lotes/:id/finalizar`) y modal de apertura de nuevos lotes (`POST /api/lotes`).
   - Tarjetas de KPIs consumiendo en vivo `GET /api/alertas/metricas` (totales, pendientes, críticas y resueltas).
   - Bandeja de Alertas Operativas con botón de acción **"Atender Alerta"** (`PATCH /api/alertas/:id/atender`).
   - Tabla de auditoría histórica con filtros reactivos por lote y resultado de inspección.
7. **Centro de Configuración de Administrador (`/admin/configuracion`):**
   - Módulo ABM / CRUD completo para el Catálogo de Defectos (`GET`, `POST`, `PUT`, `DELETE /api/tipos-defecto`) con modal para crear/editar y confirmación de borrado.
   - Diagnóstico técnico de infraestructura en vivo (`GET /api/health`) mostrando estado del servidor Express, uptime y conexión segura con PostgreSQL Neon Cloud.
8. **Validación Automatizada y Despliegue en la Nube:**
   - Compilación de producción con Vite: **1602 módulos transformados** sin advertencias ni errores en 2.91s (`npm run frontend:build`).
   - Suite de pruebas de integración de Semana 5 (`npm run test:s5`) ejecutada con **100% de éxito**.
   - Archivos de configuración preparados para despliegue: `vercel.json` (reescritura de rutas SPA en Vercel) y `render.yaml` (blueprint para Render).

---

## 2. Checklist Oficial de Entrega — Semana 05

| Elemento Requerido | Estado | Evidencia y Justificación Técnica |
| :--- | :---: | :--- |
| **Conexión real Frontend $\rightarrow$ Backend** | 🟩 Cumplido | Cliente modular `src/services/api.js` consumiendo endpoints reales en `http://localhost:3000/api`. Sin mocks aislados. |
| **Navbar con Monitor de Salud en Vivo** | 🟩 Cumplido | `Navbar.jsx` consultando en vivo `GET /api/health` con badge semafórico verde `"API Online (PostgreSQL Neon)"`. |
| **Autenticación Global y Sesión** | 🟩 Cumplido | `AuthContext.jsx` con funciones `login()` y `logout()`, persistencia en `localStorage` y validación en `/api/auth/perfil`. |
| **Rutas Protegidas y RBAC** | 🟩 Cumplido | `ProtectedRoute.jsx` bloqueando rutas privadas y validando `allowedRoles` con redirección inteligente y alerta visual. |
| **Login Industrial con Chips Rápidos** | 🟩 Cumplido | `LoginPage.jsx` con diseño Industria 4.0 y botones de 1 clic para Operario, Supervisor y Administrador (clave `'123456'`). |
| **Estación Táctil de Operario** | 🟩 Cumplido | `/operario/estacion` con selector de envase (`FRASCO`/`LATA`), visor AVZ-02, botones táctiles y modal dinámico de defectos. |
| **Contador de Descartes en Tiempo Real** | 🟩 Cumplido | `ContadorDescartes.jsx` consumiendo `GET /api/inspecciones/lote/:id` con total, aprobadas, descartadas y % tasa de descarte. |
| **Dashboard de Supervisión** | 🟩 Cumplido | `/supervisor/dashboard` con cierre de lote (`PATCH /api/lotes/:id/finalizar`), KPIs en vivo y bandeja de alertas operativas. |
| **Atención de Alertas en Vivo** | 🟩 Cumplido | Botón **"Atender Alerta"** conectado a `PATCH /api/alertas/:id/atender` con actualización reactiva en pantalla. |
| **Auditoría con Filtros** | 🟩 Cumplido | `TablaAuditoria.jsx` con filtrado dinámico por lote y estado (`TODOS`, `APROBADO`, `RECHAZADO`). |
| **ABM de Catálogo para Administrador** | 🟩 Cumplido | `/admin/configuracion` con CRUD completo (`GET`, `POST`, `PUT`, `DELETE /api/tipos-defecto`) y diagnóstico técnico de salud. |
| **Build de Producción y Tests al 100%** | 🟩 Cumplido | `npm run frontend:build` limpio y suite automatizada `npm run test:s5` pasando al 100% en sus 5 bloques. |

---

## 3. Arquitectura del Frontend y Estructura de Componentes

La aplicación cliente se estructuró bajo el directorio `frontend/` siguiendo una arquitectura desacoplada y orientada a componentes modulares:

```text
frontend/
├── .env                              # VITE_API_URL=http://localhost:3000/api
├── index.html                        # Layout SPA, tipografías Inter & JetBrains Mono
├── package.json                      # React 18, React Router DOM 6, Lucide Icons, Tailwind 3
├── tailwind.config.js                # Paleta industrial personalizada, sombras glow y monospace
├── vercel.json                       # Configuración de reescritura SPA para Vercel
├── vite.config.js                    # Configuración de puerto 5173 y plugins
└── src/
    ├── main.jsx                      # Entrada React con BrowserRouter y AuthProvider
    ├── App.jsx                       # Rutas públicas y protegidas con RBAC
    ├── index.css                     # Directivas Tailwind, sombras táctiles y scanlines
    ├── context/
    │   └── AuthContext.jsx           # Estado global de sesión, login, logout y persistencia
    ├── services/
    │   └── api.js                    # Cliente HTTP modular con interceptor Bearer JWT
    ├── components/
    │   ├── common/
    │   │   ├── Navbar.jsx            # Header con badge de salud en vivo de PostgreSQL Neon
    │   │   ├── ProtectedRoute.jsx    # Guardián de navegación con verificación de roles
    │   │   ├── LoadingSpinner.jsx    # Spinner industrial de estados asíncronos
    │   │   ├── EmptyState.jsx        # Estado vacío para listas sin registros
    │   │   └── StatusBadge.jsx       # Badges semafóricos de estado, severidad y envase
    │   ├── operario/
    │   │   ├── CamaraSimulator.jsx   # Visor de visión artificial AVZ-02 con retículo y disparador
    │   │   ├── DefectoModal.jsx      # Modal de registro de falla con catálogo en vivo
    │   │   └── ContadorDescartes.jsx # Contadores rápidos de lote, descarte e historial reciente
    │   ├── supervisor/
    │   │   ├── LoteControlCard.jsx   # Control de lote activo y botón de cierre de turno
    │   │   ├── NuevoLoteModal.jsx    # Apertura de nuevo lote de producción
    │   │   ├── BandejaAlertas.jsx    # Bandeja operativa con botón "Atender Alerta"
    │   │   └── TablaAuditoria.jsx    # Auditoría histórica con filtros por lote y resultado
    │   └── admin/
    │       ├── DefectoCrudModal.jsx  # Modal de alta y modificación de tipos de defecto
    │       ├── CatalogoDefectos.jsx  # Tabla ABM completa con confirmación de eliminación
    │       └── DiagnosticoHealth.jsx # Monitoreo de diagnóstico técnico del servidor y Neon
    └── pages/
        ├── LoginPage.jsx             # Pantalla de acceso con chips de 1-clic para testing
        ├── operario/OperarioEstacionPage.jsx # Estación táctil de línea
        ├── supervisor/SupervisorDashboardPage.jsx # Panel de supervisión y control
        └── admin/AdminConfiguracionPage.jsx # Configuración maestra y diagnósticos
```

---

## 4. Conexión Real y Modular Frontend $\rightarrow$ API REST

El cliente HTTP modular (`src/services/api.js`) resuelve las necesidades de comunicación segura:

1. **Inyección Automática de Token JWT:**
   ```javascript
   const token = localStorage.getItem('nutriscan_token');
   const headers = {
     'Content-Type': 'application/json',
     ...(token && { Authorization: `Bearer ${token}` }),
     ...options.headers,
   };
   ```
2. **Normalización Inteligente de URL:** Permite tolerar URLs base con o sin `/api` o con barras finales accidentales, asegurando compatibilidad con variables de entorno locales y en la nube (Render/Vercel).
3. **Manejo Centralizado de Códigos de Estado:**
   - `401 Unauthorized`: Remueve automáticamente el token y emite el evento global `nutriscan:unauthorized` para redirigir a `/login`.
   - `403 Forbidden`: Captura el error de permisos insuficientes y muestra un mensaje amigable.
   - `500 / Error de Red`: Gestiona la caída temporal del servidor informando al usuario sin romper el ciclo de React.
4. **Agrupación de Servicios:**
   - `authService`: `login`, `perfil`
   - `healthService`: `check`
   - `lotesService`: `getActivo`, `listar`, `crear`, `obtenerPorId`, `finalizar`
   - `inspeccionesService`: `registrar`, `historialPorLote`, `listar`
   - `tiposDefectoService`: `listar`, `obtenerPorId`, `crear`, `actualizar`, `eliminar`
   - `alertasService`: `listar`, `metricas`, `atender`

---

## 5. Control de Acceso Basado en Roles (RBAC) y Seguridad

| Rol | Ruta Principal | Permisos de Navegación | Acciones Clave |
| :--- | :--- | :--- | :--- |
| **OPERARIO** | `/operario/estacion` | Acceso a su estación táctil. Bloqueo (403) a paneles de supervisión y configuración. | Selección de línea, disparo de capturas conformes/defectuosas y visualización de descartes del lote. |
| **SUPERVISOR** | `/supervisor/dashboard` | Acceso al dashboard de supervisión y vista de estación. Bloqueo al ABM de catálogo. | Apertura y cierre formal de lotes, atención de alertas operativas y consulta de auditoría histórica. |
| **ADMIN** | `/admin/configuracion` | Acceso total e irrestricto a todas las rutas del sistema. | Alta, baja y modificación de tipos de defecto, diagnóstico de infraestructura y auditoría general. |

---

## 6. Resultados de las Pruebas Automatizadas de Integración (Semana 05)

Se creó y ejecutó la suite de pruebas automatizadas `scripts/test-week5.js` que verifica los contratos de API y flujos consumidos por los componentes de React:

```text
> nutriscan-backend@1.0.0 test:s5
> node scripts/test-week5.js

================================================================
🚀 INICIANDO SUITE DE PRUEBAS DE INTEGRACIÓN — SEMANA 05
   NutriScan: Frontend React SPA Contracts & Endpoints
================================================================

🌐 BLOQUE 1: Health Check (Navbar Badge & Diagnóstico Admin)
✅ [PostgreSQL Neon] Conectado exitosamente a la base: "neondb"
GET /api/health 200 376.178 ms
   ✅ PASS: GET /api/health responde 200 OK
   ✅ PASS: PostgreSQL en Neon Cloud está ONLINE
   ✅ PASS: Estado del sistema es HEALTHY

🔑 BLOQUE 2: Autenticación de Usuarios de Demostración (Chips)
POST /api/auth/login 200 511.366 ms
   ✅ PASS: Login de Operario exitoso
   ✅ PASS: Rol confirmado: OPERARIO
POST /api/auth/login 200 105.259 ms
   ✅ PASS: Login de Supervisor exitoso
   ✅ PASS: Rol confirmado: SUPERVISOR
POST /api/auth/login 200 105.589 ms
   ✅ PASS: Login de Admin exitoso
   ✅ PASS: Rol confirmado: ADMIN
GET /api/auth/perfil 200 188.768 ms
   ✅ PASS: GET /api/auth/perfil valida sesión con token Bearer
   ✅ PASS: Datos de perfil coinciden

🏭 BLOQUE 3: Panel de Operario (Lote Activo, Inspección y Métricas)
POST /api/lotes 201 514.895 ms
   ✅ PASS: Apertura de lote 'LOTE-S5-3842'
GET /api/lotes/activo?tipo_envase=FRASCO 200 471.601 ms
   ✅ PASS: Operario obtiene lote activo para FRASCO
   ✅ PASS: Código de lote activo coincide
GET /api/tipos-defecto?tipo_envase=FRASCO 200 95.879 ms
   ✅ PASS: Operario carga catálogo dinámico de defectos
   ✅ PASS: Catálogo es una lista de defectos
   ✅ PASS: Hay al menos un defecto disponible para FRASCO
POST /api/inspecciones 201 658.406 ms
   ✅ PASS: Inspección conforme registrada exitosamente
POST /api/inspecciones 201 702.516 ms
   ✅ PASS: Inspección rechazada registrada exitosamente
   ✅ PASS: Alerta automática generada para el supervisor
GET /api/inspecciones/lote/7 200 1808.663 ms
   ✅ PASS: GET /api/inspecciones/lote/:id responde 200 OK
   ✅ PASS: Contador total de unidades: 2
   ✅ PASS: Contador de unidades conformes: 1
   ✅ PASS: Contador de descartes: 1
   ✅ PASS: Tasa de descarte: 50%

📊 BLOQUE 4: Dashboard de Supervisión (Alertas y Auditoría)
GET /api/alertas/metricas 200 188.497 ms
   ✅ PASS: Supervisor consulta métricas de alertas
   ✅ PASS: KPI registra alertas pendientes
PATCH /api/alertas/7/atender 200 285.848 ms
   ✅ PASS: Supervisor atiende alerta #7
   ✅ PASS: Estado de la alerta actualizado a atendida: true
GET /api/inspecciones?lote_id=7&estado=RECHAZADO 200 425.150 ms
   ✅ PASS: Supervisor consulta auditoría filtrada
   ✅ PASS: Filtro retorna exactamente 1 rechazo para el lote
PATCH /api/lotes/7/finalizar 200 240.065 ms
   ✅ PASS: Supervisor finaliza lote exitosamente
   ✅ PASS: Estado del lote ahora es FINALIZADO

🛠️ BLOQUE 5: Configuración de Admin (CRUD de Tipos de Defecto)
POST /api/tipos-defecto 201 238.128 ms
   ✅ PASS: Admin crea defecto 'DEF-S5-250'
PUT /api/tipos-defecto/10 200 238.596 ms
   ✅ PASS: Admin actualiza defecto exitosamente
   ✅ PASS: Severidad actualizada confirmada
DELETE /api/tipos-defecto/10 200 242.396 ms
   ✅ PASS: Admin elimina defecto no referenciado

================================================================
🏆 TODAS LAS PRUEBAS DE INTEGRACIÓN DE LA SEMANA 05 PASARON (100%)
   - Health Check & Conectividad Neon: OK
   - AuthContext & Credenciales de Demostración: OK
   - Estación de Operario & Contadores en Vivo: OK
   - Dashboard de Supervisión & Atención de Alertas: OK
   - Configuración Maestra & CRUD de Catálogo: OK
================================================================
```

---

## 7. Preparación para Despliegue en Producción (Vercel + Render)

Para garantizar la disponibilidad en línea durante la presentación docente:

1. **Frontend en Vercel (`frontend/`):**
   - Archivo `vercel.json` con regla de reescritura (`rewrites`) hacia `/index.html` para soporte completo de rutas SPA en recarga.
   - Variable de entorno `VITE_API_URL` apuntando a la URL del backend en Render.
2. **Backend en Render (Raíz):**
   - Archivo `render.yaml` preparado para despliegue automatizado como Web Service Node.js.
   - Script de arranque `npm start` y de compilación `npm install && npx prisma generate`.
   - Variables `DATABASE_URL` (Neon Cloud), `JWT_SECRET` y `NODE_ENV=production`.

---

## 8. Conclusiones y Estado del Proyecto al Cierre de la Semana 05

* **Estado General:** **🟢 AL DÍA / 100% CUMPLIDO**
* **Puntaje Acumulado Provisorio:** **60 / 100 puntos** (S1: 10 + S2: 15 + S3: 8 + S4: 12 + S5: 15)
* **Riesgo del MVP:** **🟢 BAJO** (La conexión real cliente-servidor está establecida, los paneles de los tres perfiles están operativos y probados, y el código está listo para la integración E2E).
* **Próxima Etapa:** **Semana 06 — Integración Fullstack y Flujo E2E Cerrado** (Demostración integral de punta a punta del ciclo operativo).
