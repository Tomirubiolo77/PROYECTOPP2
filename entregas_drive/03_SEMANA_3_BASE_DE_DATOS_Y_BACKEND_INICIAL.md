# 03 | SEMANA 3 — BASE DE DATOS Y BACKEND INICIAL

**Proyecto:** NutriScan — Inspección y Registro de Calidad 4.0  
**Estudiante:** Tomás Agustín Gudiño Rubiolo  
**KIT 4.0:** AVZ-02 — Visión para Control de Calidad  
**Base de Datos Oficial:** PostgreSQL (Alojada en Neon Cloud)  
**Fecha de Cierre:** Septiembre 2026  

---

## 1. Resumen Ejecutivo de la Semana

Durante la Semana 3 se implementó la infraestructura de persistencia en la nube y el esqueleto base del servidor backend para **NutriScan**:
1. **Base de Datos Relacional en Neon Cloud:** Creación del script DDL `schema.sql` y ejecución exitosa en PostgreSQL serverless, implementando las 5 tablas del modelo relacional, claves foráneas, restricciones de integridad, 5 índices de rendimiento y datos semilla (seeds).
2. **Capa de Conectividad a Base de Datos:** Configuración del Connection Pool con el driver nativo `pg` (`pg.Pool`) con soporte TLS/SSL para Neon, gestión de timeouts y reconexión automática.
3. **Estructura Modular del Backend en Node.js + Express:** Organización del código en arquitectura en capas (`src/config`, `src/controllers`, `src/routes`, `src/services`), middlewares esenciales (`cors`, `express.json`, `morgan`), manejo centralizado de errores y apagado controlado (*graceful shutdown*).
4. **Verificación y Pruebas Automatizadas:** Creación de scripts de inicialización (`npm run db:init`) y testing (`npm test`), logrando un 100% de éxito en la validación de endpoints de salud y catálogo de defectos.

---

## 2. Script DDL y Modelo de Persistencia (`schema.sql`)

El script DDL fue diseñado bajo Tercera Forma Normal (3FN) para PostgreSQL en Neon Cloud:

### Tablas Creadas e Integridad Referencial:
* **`usuarios`**: Gestión de acceso y perfiles (`id`, `nombre`, `email UNIQUE`, `password_hash`, `rol CHECK ('OPERARIO', 'SUPERVISOR', 'ADMIN')`, `activo`, `created_at`).
* **`lotes`**: Registro de tandas de producción (`id`, `codigo_lote UNIQUE`, `producto`, `tipo_envase CHECK ('FRASCO', 'LATA')`, `fecha_inicio`, `fecha_fin`, `estado CHECK ('EN_PROCESO', 'FINALIZADO', 'DETENIDO')`, `usuario_creador_id FK -> usuarios(id) ON DELETE RESTRICT`).
* **`tipos_defecto`**: Catálogo maestro de defectos tipificados por envase (`id`, `codigo UNIQUE`, `nombre`, `tipo_envase CHECK ('FRASCO', 'LATA', 'GENERAL')`, `severidad CHECK ('BAJA', 'MEDIA', 'CRITICA', 'ALTA')`, `descripcion`).
* **`inspecciones`**: Eventos individuales de control por visión artificial (`id`, `lote_id FK -> lotes(id) ON DELETE CASCADE`, `tipo_defecto_id FK -> tipos_defecto(id) ON DELETE SET NULL`, `usuario_id FK -> usuarios(id) ON DELETE RESTRICT`, `estado CHECK ('APROBADO', 'RECHAZADO')`, `imagen_url`, `observacion`, `fecha_hora`).
* **`alertas`**: Notificaciones operativas generadas ante fallas (`id`, `inspeccion_id FK -> inspecciones(id) ON DELETE CASCADE`, `nivel CHECK ('INFO', 'WARN', 'CRITICA')`, `mensaje`, `atendida`, `fecha_hora`).

### Índices de Optimización para Consultas de Alta Velocidad:
* `idx_inspecciones_lote` en `inspecciones(lote_id)`: Búsqueda rápida de inspecciones por lote activo.
* `idx_inspecciones_fecha` en `inspecciones(fecha_hora)`: Filtrado por rango temporal y turnos.
* `idx_inspecciones_estado` en `inspecciones(estado)`: Agrupación ágil para cálculo de tasa de rechazo (%).
* `idx_alertas_inspeccion` en `alertas(inspeccion_id)`: Trazabilidad directa alerta-inspección.
* `idx_lotes_estado` en `lotes(estado)`: Localización inmediata del lote en proceso.

### Datos Semilla Cargados y Verificados (Seeds):
* **3 Usuarios de Prueba:**
  * Operario Línea 01 (`operario@nutriscan.com`, Rol: `OPERARIO`)
  * Supervisor de Calidad (`supervisor@nutriscan.com`, Rol: `SUPERVISOR`)
  * Administrador del Sistema (`admin@nutriscan.com`, Rol: `ADMIN`)
  * *Contraseña general de desarrollo:* `123456` (hash bcrypt almacenado).
* **7 Tipos de Defecto:**
  * Frascos: `SIN_TAPA` (Crítica), `LLENADO_BAJO` (Media), `SIN_ETIQUETA` (Media).
  * Latas: `ABOLLADURA` (Media), `OXIDO` (Crítica), `ABOMBAMIENTO` (Crítica), `ANILLA_ROTA` (Baja).
* **2 Lotes Iniciales:** `LOTE-FRASCO-2026-01` (Salsa Tradicional 500g) y `LOTE-LATA-2026-01` (Arvejas 350g).
* **4 Inspecciones de Muestra:** 2 aprobadas y 2 rechazadas.
* **2 Alertas Operativas:** 1 Crítica y 1 Advertencia (*WARN*).

---

## 3. Trazabilidad del Modelo ER con `schema.sql`

```text
       ┌──────────┐
       │ usuarios │
       └────┬─────┘
            │
            ├─── (1:N) ────> [lotes] (usuario_creador_id -> usuarios.id) [ON DELETE RESTRICT]
            │                   │
            │                   └─── (1:N) ────┐
            │                                  ▼
            └─── (1:N) ─────────────────> [inspecciones] (usuario_id -> usuarios.id) [ON DELETE RESTRICT]
                                               ▲  │      (lote_id -> lotes.id) [ON DELETE CASCADE]
                                               │  │
   [tipos_defecto] ─── (1:N opcional) ─────────┘  └─── (1:N) ───> [alertas] (inspeccion_id -> inspecciones.id) [ON DELETE CASCADE]
   (tipo_defecto_id -> tipos_defecto.id)
   [ON DELETE SET NULL]
```

---

## 4. Estructura del Proyecto Backend

Se adoptó una arquitectura modular limpia y desacoplada en Node.js con Express:

```text
FinalCaon/
├── docs/
│   └── s3-documentacion.md       # Documentación técnica de endpoints y DER
├── entregas_drive/               # Bitácora y entregables semanales
│   ├── 00_REGISTRO_GENERAL.md
│   ├── 01_SEMANA_1_PROBLEMA_Y_REQUISITOS.md
│   ├── 02_SEMANA_2_ANALISIS_Y_DISENO.md
│   └── 03_SEMANA_3_BASE_DE_DATOS_Y_BACKEND_INICIAL.md
├── scripts/
│   ├── init-db.js                # Inicializador de DDL y verificación en Neon
│   └── test-endpoints.js         # Batería automatizada de pruebas HTTP
├── src/
│   ├── config/
│   │   └── db.js                 # Pool de conexiones pg hacia Neon Cloud
│   ├── controllers/
│   │   ├── health.controller.js  # Lógica de diagnóstico y salud del sistema
│   │   └── tiposDefecto.controller.js # Controlador para catálogo de defectos
│   ├── routes/
│   │   ├── health.routes.js      # Rutas /api/health
│   │   ├── tiposDefecto.routes.js# Rutas /api/tipos-defecto
│   │   └── index.routes.js       # Router centralizado de la API
│   ├── services/
│   │   └── tiposDefecto.service.js # Consultas SQL parametrizadas a tipos_defecto
│   ├── app.js                    # Configuración de Express, middlewares y errores
│   └── server.js                 # Arranque, verificación de BD y graceful shutdown
├── .env                          # Variables de entorno activas (ignorado en Git)
├── .env.example                  # Plantilla de variables de entorno
├── .gitignore                    # Protección de credenciales y dependencias
├── package.json                  # Dependencias y scripts npm
└── schema.sql                    # Script DDL oficial para PostgreSQL
```

---

## 5. Diccionario de Endpoints Implementados (API S3)

Todos los endpoints responden con formato JSON consistente: `{ success: true, ... }` o `{ success: false, error: ... }`.

### 1. `GET /api/health`
* **Propósito:** Comprueba la disponibilidad de la API y ejecuta un ping activo contra Neon PostgreSQL consultando hora del servidor y nombre de base de datos.
* **Respuesta (`200 OK`):**
```json
{
  "success": true,
  "status": "HEALTHY",
  "service": "NutriScan Backend API",
  "version": "1.0.0",
  "timestamp": "2026-09-02T01:17:44.265Z",
  "uptimeSeconds": 1,
  "environment": "development",
  "database": {
    "engine": "PostgreSQL (Neon Cloud)",
    "connected": true,
    "databaseName": "neondb",
    "serverTime": "2026-09-02T01:17:44.272Z"
  }
}
```

### 2. `GET /api/tipos-defecto`
* **Propósito:** Retorna el catálogo completo de defectos tipificados (7 fallas registradas).
* **Respuesta (`200 OK`):**
```json
{
  "success": true,
  "count": 7,
  "filtro": "TODOS",
  "data": [
    { "id": 1, "codigo": "SIN_TAPA", "nombre": "Frasco sin tapa hermética", "tipo_envase": "FRASCO", "severidad": "CRITICA", "descripcion": "Falta de cierre, riesgo de derrame e inocuidad." },
    { "id": 4, "codigo": "ABOLLADURA", "nombre": "Lata con deformación o abolladura", "tipo_envase": "LATA", "severidad": "MEDIA", "descripcion": "Daño físico estructural en el cuerpo de la lata." }
  ]
}
```

### 3. `GET /api/tipos-defecto?tipo_envase=FRASCO`
* **Propósito:** Filtra y devuelve exclusivamente los 3 defectos correspondientes a líneas de frascos (`SIN_TAPA`, `LLENADO_BAJO`, `SIN_ETIQUETA`).
* **Respuesta (`200 OK`):** `count: 3`.

### 4. `GET /api/tipos-defecto?tipo_envase=LATA`
* **Propósito:** Filtra y devuelve exclusivamente los 4 defectos correspondientes a líneas de latas (`ABOLLADURA`, `OXIDO`, `ABOMBAMIENTO`, `ANILLA_ROTA`).
* **Respuesta (`200 OK`):** `count: 4`.

### 5. `GET /api/tipos-defecto/:id`
* **Propósito:** Recupera la ficha técnica de un defecto por su ID (`200 OK`), validando formato numérico (`400 Bad Request`) o recurso no encontrado (`404 Not Found`).

---

## 6. Resultados de las Pruebas de Verificación

Se ejecutó la batería automatizada de pruebas con el comando `npm test`:

| # | Prueba Ejecutada | Endpoint | Status Obtenido | Resultado |
| :-: | :--- | :--- | :-: | :---: |
| 1 | Metadatos y Raíz | `GET /` | `200 OK` | 🟢 Pasa |
| 2 | Diagnóstico y Conexión BD Neon | `GET /api/health` | `200 OK` | 🟢 Pasa |
| 3 | Catálogo Completo (7 ítems) | `GET /api/tipos-defecto` | `200 OK` | 🟢 Pasa |
| 4 | Filtro por Envase Frasco (3 ítems) | `GET /api/tipos-defecto?tipo_envase=FRASCO` | `200 OK` | 🟢 Pasa |
| 5 | Filtro por Envase Lata (4 ítems) | `GET /api/tipos-defecto?tipo_envase=LATA` | `200 OK` | 🟢 Pasa |
| 6 | Búsqueda Individual por ID | `GET /api/tipos-defecto/1` | `200 OK` | 🟢 Pasa |
| 7 | Manejo de Recurso Inexistente | `GET /api/tipos-defecto/999` | `404 Not Found` | 🟢 Pasa |
| 8 | Manejo de Ruta No Mapeada | `GET /api/ruta-desconocida` | `404 Not Found` | 🟢 Pasa |

---

## 7. Dictamen de Calidad y Estado Académico

* **Dictamen del Auditor de Calidad (PP2):** 🟢 **APROBADO PARA AVANZAR**
* **Puntaje de la Semana 3:** **8 / 8 puntos**
* **Puntaje Acumulado Provisorio:** **33 / 100 puntos** (S1: 10 pts + S2: 15 pts + S3: 8 pts)
* **Conclusión:** La infraestructura de datos en Neon Cloud y la base del servidor Express se encuentran operativas, verificadas y sin deuda técnica, listas para la implementación de Autenticación JWT y lógica de negocio en la Semana 4.
