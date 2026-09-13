# 04 | SEMANA 4 — BACKEND, LÓGICA DE NEGOCIO Y CIBERSEGURIDAD

**Proyecto:** NutriScan — Inspección y Registro de Calidad 4.0  
**Estudiante:** Tomás Agustín Gudiño Rubiolo  
**KIT 4.0:** AVZ-02 — Visión para Control de Calidad  
**Base de Datos & ORM:** PostgreSQL en Neon Cloud + Prisma ORM 5  
**Fecha de Cierre:** Septiembre 2026  

---

## 1. Resumen Ejecutivo de la Semana

Durante la Semana 4 se completó el desarrollo integral de la lógica de negocio, persistencia moderna con **Prisma ORM** y el blindaje perimetral de **Ciberseguridad** para **NutriScan**:

1. **Adopción de Prisma ORM:** Sincronización del esquema de Neon Cloud mediante introspección (`prisma db pull`), mapeando formalmente las 5 tablas del modelo relacional con claves foráneas, restricciones e índices. Implementación del cliente singleton (`src/config/prisma.js`) para consultas 100% preparadas/parametrizadas y transacciones atómicas seguras.
2. **Autenticación Robusta con JWT y Bcrypt:** Endpoint `POST /api/auth/login` con hashing irreversible mediante `bcryptjs` (salt rounds = 10) y emisión de JSON Web Tokens con 8 horas de expiración. Se auditó y corrigió la semilla de usuarios, garantizando acceso con clave `'123456'` para pruebas operativas.
3. **Control de Acceso Basado en Roles (RBAC):** Middleware `role.middleware.js` que hace cumplir el principio de menor privilegio sobre los roles del sistema (**OPERARIO**, **SUPERVISOR**, **ADMIN**), previniendo escalamiento vertical y horizontal con códigos HTTP `403 Forbidden`.
4. **Lógica de Negocio Transaccional:**
   - **Lotes:** Apertura formal, listado con filtros, consulta del lote activo en línea con indicadores y cierre controlado de turno (`PATCH /api/lotes/:id/finalizar`).
   - **Inspecciones & Alertas Automáticas:** Registro de piezas conformes y defectuosas. Si la pieza es rechazada, se ejecuta una transacción atómica (`prisma.$transaction`) que crea la inspección y dispara inmediatamente un registro en la tabla `alertas` con nivel `CRITICA` o `WARN`.
   - **Catálogo de Defectos:** CRUD completo para el Administrador con protección referencial.
5. **Enfoque Profesional de Ciberseguridad (OWASP Top 10):**
   - **No Data Leakage:** Exclusión estricta de `password_hash` en respuestas JSON y supresión de stack traces en errores internos con `error.middleware.js`.
   - **Anti-Fuerza Bruta & Anti-DoS:** Rate limiting en login (10 peticiones / 15 min) y general con `express-rate-limit`.
   - **Cabeceras Seguras:** Integración de `helmet` (`nosniff`, `SAMEORIGIN`, CSP).
   - **Sanitización de Payloads:** Middleware `validator.middleware.js` para validación estricta de enums y tipos.
6. **Verificación Automatizada:** Dos suites de testing (`npm test` y `npm run test:s4`) con 100% de éxito en 8 bloques de prueba.

---

## 2. Checklist Oficial de Entrega — Semana 04

| Elemento Requerido | Estado | Evidencia y Justificación Técnica |
| :--- | :---: | :--- |
| **CRUD de las entidades principales** | 🟩 Cumplido | Implementado para `lotes`, `inspecciones`, `tipos_defecto`, `alertas` y `auth` con Prisma ORM. |
| **Validaciones de datos** | 🟩 Cumplido | Middleware `validator.middleware.js`: validación de enums (`FRASCO`/`LATA`, `APROBADO`/`RECHAZADO`), regex email y tipos. |
| **Reglas de negocio** | 🟩 Cumplido | Verificación de lote activo, transacción atómica de alerta ante rechazo, compatibilidad de envase y recuentos de descarte en tiempo real. |
| **Manejo de errores** | 🟩 Cumplido | Middleware `error.middleware.js`: respuestas semánticas (200, 201, 400, 401, 403, 404, 409, 429, 500) sin exponer detalles SQL. |
| **Login/autenticación** | 🟩 Cumplido | `POST /api/auth/login` con bcrypt (10 rounds), token JWT firmado y ocultamiento estricto de contraseñas. |
| **Roles y autorización** | 🟩 Cumplido | Middleware `role.middleware.js` aplicando la matriz RBAC para `OPERARIO`, `SUPERVISOR` y `ADMIN`. |
| **Protección de endpoints** | 🟩 Cumplido | Middleware `auth.middleware.js` validando firmas Bearer JWT, `helmet` activo y `rate-limit` anti-fuerza bruta. |
| **Pruebas de API** | 🟩 Cumplido | Suite de regresión (`npm test`) y suite integral de Semana 4 (`npm run test:s4`) pasando al 100%. |
| **Evidencias de funcionamiento** | 🟩 Cumplido | Logs reales de ejecución de tests incorporados en la sección 7 de este documento. |

---

## 3. Arquitectura del Backend y Flujo de Procesamiento

El flujo implementado cumple con la cadena esperada:
$$\text{Frontend / Postman} \longrightarrow \text{Middlewares de Seguridad} \longrightarrow \text{Controlador} \longrightarrow \text{Servicio} \longrightarrow \text{Prisma ORM} \longrightarrow \text{Neon PostgreSQL} \longrightarrow \text{Respuesta JSON}$$

```text
FinalCaon/
├── prisma/
│   └── schema.prisma             # Modelo formal de Prisma sincronizado con Neon
├── src/
│   ├── config/
│   │   ├── db.js                 # Pool 'pg' para health check y retrocompatibilidad
│   │   └── prisma.js             # Cliente singleton de Prisma ORM
│   ├── controllers/
│   │   ├── alertas.controller.js
│   │   ├── auth.controller.js
│   │   ├── health.controller.js
│   │   ├── inspecciones.controller.js
│   │   ├── lotes.controller.js
│   │   └── tiposDefecto.controller.js
│   ├── middlewares/
│   │   ├── auth.middleware.js    # Verificación criptográfica Bearer JWT
│   │   ├── error.middleware.js   # Manejo de errores y prevención de fugas
│   │   ├── rateLimiter.middleware.js # Anti-fuerza bruta y anti-DoS
│   │   ├── role.middleware.js    # Control de acceso RBAC por roles
│   │   └── validator.middleware.js # Sanitización y validación de esquemas
│   ├── routes/
│   │   ├── alertas.routes.js
│   │   ├── auth.routes.js
│   │   ├── health.routes.js
│   │   ├── index.routes.js       # Router maestro que agrupa subrutas
│   │   ├── inspecciones.routes.js
│   │   ├── lotes.routes.js
│   │   └── tiposDefecto.routes.js
│   ├── services/
│   │   ├── alertas.service.js
│   │   ├── auth.service.js
│   │   ├── inspecciones.service.js
│   │   ├── lotes.service.js
│   │   └── tiposDefecto.service.js
│   ├── app.js                    # Express, Helmet, CORS, RateLimiter y Middlewares
│   └── server.js                 # Inicialización y apagado controlado (Graceful Shutdown)
├── scripts/
│   ├── seed-users.js             # Semilla segura con hashes bcrypt válidos
│   ├── test-endpoints.js         # Pruebas base de endpoints S3
│   └── test-week4.js             # Suite completa de integración de Semana 4
├── docs/
│   ├── s3-documentacion.md
│   └── s4-documentacion.md       # Especificación técnica formal de la API S4
└── schema.sql                    # Script DDL oficial actualizado
```

---

## 4. Matriz de Control de Acceso por Roles (RBAC)

| Endpoint | Método | OPERARIO | SUPERVISOR | ADMIN | Propósito |
| :--- | :---: | :---: | :---: | :---: | :--- |
| `/api/auth/login` | `POST` | 🟢 | 🟢 | 🟢 | Inicio de sesión y emisión de JWT |
| `/api/auth/perfil` | `GET` | 🟢 | 🟢 | 🟢 | Consulta de datos del usuario autenticado |
| `/api/lotes/activo` | `GET` | 🟢 | 🟢 | 🟢 | Consulta del lote en proceso con indicadores |
| `/api/lotes` | `GET` | 🟢 | 🟢 | 🟢 | Listado histórico de lotes |
| `/api/lotes` | `POST` | 🔴 | 🟢 | 🟢 | Apertura de lote de producción |
| `/api/lotes/:id/finalizar` | `PATCH` | 🔴 | 🟢 | 🟢 | Cierre formal de lote |
| `/api/inspecciones` | `POST` | 🟢 | 🟢 | 🟢 | Registro de evento de inspección |
| `/api/inspecciones/lote/:id`| `GET` | 🟢 | 🟢 | 🟢 | Historial y contadores de lote en vivo |
| `/api/inspecciones` | `GET` | 🔴 | 🟢 | 🟢 | Auditoría global paginada |
| `/api/alertas` | `GET` | 🔴 | 🟢 | 🟢 | Monitoreo de alertas operativas |
| `/api/alertas/metricas` | `GET` | 🔴 | 🟢 | 🟢 | KPIs de alertas (pendientes, críticas) |
| `/api/alertas/:id/atender` | `PATCH` | 🔴 | 🟢 | 🟢 | Resolución de alerta en planta |
| `/api/tipos-defecto` | `GET` | 🟢 | 🟢 | 🟢 | Catálogo de defectos de envase |
| `/api/tipos-defecto` | `POST` | 🔴 | 🔴 | 🟢 | Creación de nuevo tipo de defecto |
| `/api/tipos-defecto/:id` | `PUT` | 🔴 | 🔴 | 🟢 | Edición técnica de defecto |
| `/api/tipos-defecto/:id` | `DELETE`| 🔴 | 🔴 | 🟢 | Eliminación de defecto sin historial |

---

## 5. Reglas de Negocio Implementadas

1. **Vigencia Operativa de Lotes:** El sistema valida que el lote se encuentre en estado `EN_PROCESO` antes de aceptar cualquier inspección. Si el lote está `FINALIZADO`, se rechaza la operación con código `400 Bad Request`.
2. **Disparo Transaccional Atómico de Alertas:** Cuando se registra una inspección con estado `RECHAZADO`, la aplicación utiliza `prisma.$transaction` para garantizar que la inserción de la inspección y la generación de la alerta en la tabla `alertas` ocurran en un único commit. Si la severidad del defecto es `CRITICA`, el nivel de alerta se fija en `CRITICA`; de lo contrario, se clasifica como `WARN`.
3. **Validación de Compatibilidad de Envase:** Se valida que el defecto pertenezca a la categoría del envase que se está produciendo (`FRASCO` o `LATA`) o que sea de carácter `GENERAL`.
4. **Protección de Integridad Referencial:** Se impide la eliminación de tipos de defecto que ya posean inspecciones registradas históricamente, preservando la trazabilidad de la planta.
5. **Cálculo de Descartes e Indicadores en Tiempo Real:** El endpoint `GET /api/inspecciones/lote/:loteId` realiza el recuento en vivo de unidades totales, aprobadas, rechazadas y porcentaje de descarte (`tasa_defecto_porcentaje`), satisfaciendo la vista que el operario y supervisor requerirán en la Semana 5.

---

## 6. Diccionario de la API (Ejemplos JSON)

### A. Login Exitoso (`POST /api/auth/login`)
```json
// Request
{
  "email": "operario@nutriscan.com",
  "password": "123456"
}

// Response (200 OK)
{
  "success": true,
  "message": "Inicio de sesión exitoso",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "usuario": {
      "id": 1,
      "nombre": "Operario Línea 01",
      "email": "operario@nutriscan.com",
      "rol": "OPERARIO"
    }
  }
}
```

### B. Registro de Inspección Rechazada con Alerta Automática (`POST /api/inspecciones`)
```json
// Request (Header: Authorization: Bearer <token>)
{
  "lote_id": 1,
  "estado": "RECHAZADO",
  "tipo_defecto_id": 1,
  "observacion": "Frasco detectado sin tapa en la estación de sellado",
  "imagen_url": "https://storage.nutriscan.com/capturas/def-sin-tapa-01.jpg"
}

// Response (201 Created)
{
  "success": true,
  "message": "Inspección rechazada registrada y alerta generada automáticamente",
  "data": {
    "id": 15,
    "lote_id": 1,
    "estado": "RECHAZADO",
    "tipos_defecto": {
      "codigo": "SIN_TAPA",
      "nombre": "Frasco sin tapa hermética",
      "severidad": "CRITICA"
    },
    "alertas": [
      {
        "id": 8,
        "nivel": "CRITICA",
        "mensaje": "Falla detectada [SIN_TAPA] Frasco sin tapa hermética en FRASCO (Lote: LOTE-FRASCO-2026-01)",
        "atendida": false
      }
    ]
  }
}
```

### C. Consulta de Lote Activo e Indicadores (`GET /api/lotes/activo?tipo_envase=FRASCO`)
```json
// Response (200 OK)
{
  "success": true,
  "data": {
    "id": 1,
    "codigo_lote": "LOTE-FRASCO-2026-01",
    "producto": "Salsa de Tomate Tradicional 500g",
    "tipo_envase": "FRASCO",
    "estado": "EN_PROCESO",
    "estadisticas": {
      "total_inspecciones": 12,
      "total_aprobadas": 10,
      "total_rechazadas": 2,
      "tasa_defecto_porcentaje": 16.67
    }
  }
}
```

---

## 7. Evidencias de Pruebas Automatizadas

Al ejecutar el comando oficial de pruebas de la Semana 4 (`npm run test:s4`):

```text
> nutriscan-backend@1.0.0 test:s4
> node scripts/test-week4.js

================================================================
🛡️  INICIANDO SUITE DE PRUEBAS AUTOMATIZADAS — SEMANA 04
    NutriScan: Auth JWT, Roles (RBAC), Negocio y Ciberseguridad
================================================================

🔒 BLOQUE 1: Verificación de Cabeceras HTTP Seguras (Helmet)
GET / 200 2.930 ms - 641
   ✅ PASS: Root endpoint responde 200 OK
   ✅ PASS: Cabecera X-Content-Type-Options es nosniff
   ✅ PASS: Cabecera X-Frame-Options es SAMEORIGIN (Anti-Clickjacking)

🔑 BLOQUE 2: Autenticación JWT y Prevención de Fugas de Información
POST /api/auth/login 401 505.337 ms - 365
   ✅ PASS: Rechazo 401 con contraseña incorrecta
   ✅ PASS: Respuesta indica success: false
POST /api/auth/login 401 48.267 ms - 365
   ✅ PASS: Rechazo 401 con correo no registrado (sin enumerar)
POST /api/auth/login 200 106.674 ms - 377
   ✅ PASS: Login exitoso de OPERARIO (200 OK)
   ✅ PASS: Token JWT emitido
   ✅ PASS: Rol confirmado: OPERARIO
   ✅ PASS: Seguridad: password_hash NO expuesto
POST /api/auth/login 200 104.435 ms - 389
   ✅ PASS: Login exitoso de SUPERVISOR (200 OK)
   ✅ PASS: Rol confirmado: SUPERVISOR
POST /api/auth/login 200 103.880 ms - 370
   ✅ PASS: Login exitoso de ADMIN (200 OK)
   ✅ PASS: Rol confirmado: ADMIN
GET /api/auth/perfil 200 186.654 ms - 166
   ✅ PASS: GET /api/auth/perfil devuelve 200 con Bearer Token
   ✅ PASS: Perfil verificado correctamente
GET /api/auth/perfil 401 0.166 ms - 92
   ✅ PASS: Rechazo 401 en ruta privada sin token
GET /api/auth/perfil 401 0.387 ms - 75
   ✅ PASS: Rechazo 401 ante token JWT manipulado

🛡️  BLOQUE 3: Control de Acceso por Roles (RBAC)
POST /api/lotes 403 46.665 ms - 149
   ✅ PASS: Operario bloqueado con 403 al intentar crear lote
POST /api/tipos-defecto 403 47.417 ms - 137
   ✅ PASS: Operario bloqueado con 403 al intentar crear tipo de defecto
GET /api/alertas 403 46.901 ms - 149
   ✅ PASS: Operario bloqueado con 403 al intentar acceder a alertas

📦 BLOQUE 4: Gestión de Lotes de Producción
POST /api/lotes 201 538.311 ms - 374
   ✅ PASS: Supervisor crea lote exitosamente (201 Created)
   ✅ PASS: Código de lote confirmado
GET /api/lotes/activo?tipo_envase=FRASCO 200 496.996 ms - 411
   ✅ PASS: Operario consulta lote activo en línea (200 OK)
   ✅ PASS: Lote activo coincide con el recién abierto

🔬 BLOQUE 5: Lógica de Inspecciones y Alertas Automáticas
POST /api/inspecciones 201 666.827 ms - 472
   ✅ PASS: Inspección APROBADA registrada (201 Created)
   ✅ PASS: Estado APROBADO
   ✅ PASS: No genera alertas si es aprobada
POST /api/inspecciones 201 695.204 ms - 846
   ✅ PASS: Inspección RECHAZADA registrada (201 Created)
   ✅ PASS: Estado RECHAZADO
   ✅ PASS: 🚨 Alerta generada automáticamente en tabla alertas
   ✅ PASS: Nivel de alerta automático es CRITICA
GET /api/inspecciones/lote/3 200 1523.608 ms - 1206
   ✅ PASS: GET /api/inspecciones/lote/:id responde 200
   ✅ PASS: Recuento total de unidades: 2
   ✅ PASS: Recuento de unidades aprobadas: 1
   ✅ PASS: Recuento de unidades rechazadas: 1
   ✅ PASS: Tasa de defecto calculada: 50%

🚨 BLOQUE 6: Gestión y Atención de Alertas
GET /api/alertas/metricas 200 188.226 ms - 155
   ✅ PASS: GET /api/alertas/metricas responde 200
   ✅ PASS: Métricas registran alertas pendientes
PATCH /api/alertas/3/atender 200 284.288 ms - 277
   ✅ PASS: Supervisor atiende alerta (200 OK)
   ✅ PASS: Alerta actualizada a atendida: true

🏷️  BLOQUE 7: CRUD del Catálogo de Defectos (Admin)
POST /api/tipos-defecto 201 247.028 ms - 233
   ✅ PASS: Admin crea tipo de defecto (201 Created)
PUT /api/tipos-defecto/8 200 237.442 ms - 237
   ✅ PASS: Admin actualiza defecto (200 OK)
   ✅ PASS: Severidad actualizada a ALTA
DELETE /api/tipos-defecto/8 200 239.258 ms - 79
   ✅ PASS: Admin elimina defecto no referenciado (200 OK)

🏁 BLOQUE 8: Cierre de Lote y Restricciones Operativas
PATCH /api/lotes/3/finalizar 200 239.316 ms - 311
   ✅ PASS: Supervisor finaliza lote (200 OK)
   ✅ PASS: Estado del lote ahora es FINALIZADO
POST /api/inspecciones 400 95.621 ms - 499
   ✅ PASS: Rechazo 400 al intentar inspeccionar lote finalizado

================================================================
🏆 TODAS LAS PRUEBAS DE LA SEMANA 04 PASARON CON ÉXITO (100%)
================================================================
```

---

## 8. Dictamen de Calidad y Estado Académico

* **Dictamen del Auditor de Calidad (PP2):** 🟢 **APROBADO PARA AVANZAR**
* **Puntaje Obtenido en Semana 4:** **12 / 12 puntos**
* **Puntaje Acumulado Provisorio:** **45 / 100 puntos**  
  *(Semana 1: 10 pts + Semana 2: 15 pts + Semana 3: 8 pts + Semana 4: 12 pts)*
* **Próximo Paso (Semana 5):** Desarrollo del Frontend en React (Vite) + Tailwind CSS, implementando el `AuthContext` para login y rutas protegidas, la terminal del operario con semáforo y simulador, y el panel de supervisión con métricas.
