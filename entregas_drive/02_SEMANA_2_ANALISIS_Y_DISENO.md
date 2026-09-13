# 02 | SEMANA 2 — ANÁLISIS Y DISEÑO DEL SISTEMA

**Proyecto:** NutriScan — Inspección y Registro de Calidad 4.0  
**Estudiante:** Tomás Agustín Gudiño Rubiolo  
**KIT 4.0:** AVZ-02 — Visión para Control de Calidad  
**Base de Datos Oficial:** PostgreSQL (Alojada en Neon Cloud)  

---

## 1. Casos de Uso del Sistema (CU)

### CU01: Simular Inspección de Envase (Frasco / Lata)
* **Actor Principal:** Operario / Simulador de Cámara (KIT AVZ-02).
* **Precondiciones:** Existe un lote de producción abierto en estado `EN_PROCESO`.
* **Flujo Principal:**
  1. El operario o el simulador dispara una inspección con una imagen del dataset.
  2. El sistema clasifica el resultado (*APROBADO* o *RECHAZADO*) y detecta el tipo de defecto.
  3. Se envía el payload JSON a la API REST (`POST /api/inspecciones`).
  4. La API valida la compatibilidad con el lote y persiste el registro en PostgreSQL (Neon).
  5. Si el resultado es *RECHAZADO*, **desencadena inmediatamente el CU02**.
* **Postcondiciones:** La inspección queda registrada y se actualizan los contadores en pantalla.

### CU02: Emitir Alerta Visual en Puesto de Línea
* **Actor Principal:** Operario de Línea.
* **Flujo Principal:**
  1. Ante una inspección con estado *RECHAZADO*, la pantalla activa una alarma visual en color rojo.
  2. Muestra un mensaje explícito con el motivo del defecto (ej. *"LATA ABOMBADA"* o *"FRASCO SIN TAPA"*).
  3. El operario retira manualmente la pieza de la cinta transportadora.
  4. Si se detectan 3 rechazos consecutivos, se despliega una advertencia crítica para llamar al supervisor.

### CU03: Consultar Dashboard de Calidad en Tiempo Real
* **Actor Principal:** Supervisor de Calidad / Jefe de Planta.
* **Flujo Principal:**
  1. El supervisor accede al panel de control.
  2. El sistema consulta las inspecciones asociadas al lote activo.
  3. Muestra tarjetas de KPI: Total procesado, Aprobados, Rechazos y Tasa de falla (%).
  4. Presenta gráfico de barras con la distribución de fallas por tipo de defecto.

### CU04: Auditar Historial de Inspecciones
* **Actor Principal:** Supervisor de Calidad.
* **Flujo Principal:**
  1. El supervisor ingresa a la vista de auditoría.
  2. Aplica filtros por lote, tipo de envase (*Frascos* o *Latas*) o tipo de defecto.
  3. El sistema lista los registros detallados con hora exacta, operario responsable y ruta de la imagen inspeccionada.

### CU05: Gestión y Trazabilidad de Lotes de Producción
* **Actor Principal:** Supervisor de Calidad.
* **Flujo Principal:**
  1. El supervisor crea un nuevo lote indicando código, producto y tipo de envase (`FRASCO` o `LATA`).
  2. El lote pasa a estado `EN_PROCESO`.
  3. Al terminar la tirada de producción, el supervisor cambia el estado a `FINALIZADO`.

### CU06: Autenticación y Control de Acceso por Roles
* **Actor Principal:** Todos los usuarios (Operario, Supervisor, Administrador).
* **Flujo Principal:**
  1. El usuario ingresa email y contraseña.
  2. La API valida credenciales contra PostgreSQL y genera un token JWT.
  3. El frontend redirige a la vista correspondiente según el rol asignado.

---

## 2. Regla de Negocio del Dominio (RN-01)

### RN-01: Validación Cruzada de Compatibilidad Envase - Defecto
Para asegurar la coherencia de datos sin tablas intermedias innecesarias en el MVP, se documenta e implementa la siguiente regla de lógica de negocio:
* Cada `LOTE` define estrictamente el `tipo_envase` en producción (`FRASCO` o `LATA`).
* Cada `TIPO_DEFECTO` pertenece a un `tipo_envase`.
* **Validación en Backend:** Al registrar una inspección en `POST /api/inspecciones`, el backend valida que el defecto pertenezca al tipo de envase del lote activo. Si hay discrepancia (ej. asignar `SIN_TAPA` a una lata, o `OXIDO` a un frasco), la API rechaza la petición con código `HTTP 400 Bad Request`.

#### Matriz de Compatibilidad:
| Tipo de Envase | Defectos Permitidos | Defectos Prohibidos |
| :--- | :--- | :--- |
| **FRASCO** | `SIN_TAPA`, `LLENADO_BAJO`, `SIN_ETIQUETA` | `ABOLLADURA`, `OXIDO`, `ABOMBAMIENTO`, `ANILLA_ROTA` |
| **LATA** | `ABOLLADURA`, `OXIDO`, `ABOMBAMIENTO`, `ANILLA_ROTA` | `SIN_TAPA`, `LLENADO_BAJO`, `SIN_ETIQUETA` |

---

## 3. Modelo de Datos Relacional (PostgreSQL en Neon)

### Diagrama Entidad-Relación (DER)
```text
+------------------------------------+       +------------------------------------+       +------------------------------------+
|              USUARIOS              |       |               LOTES                |       |           TIPOS_DEFECTO            |
+------------------------------------+       +------------------------------------+       +------------------------------------+
| id (SERIAL, PK)                    |       | id (SERIAL, PK)                    |       | id (SERIAL, PK)                    |
| nombre (VARCHAR(100))              |       | codigo_lote (VARCHAR(50), UNIQUE)  |       | codigo (VARCHAR(30), UNIQUE)       |
| email (VARCHAR(100), UNIQUE)       |       | producto (VARCHAR(100))            |       | nombre (VARCHAR(100))              |
| password_hash (VARCHAR(255))       |       | tipo_envase (VARCHAR(20))          |       | tipo_envase (VARCHAR(20))          |
| rol (VARCHAR(20))                  |       | fecha_inicio (TIMESTAMPTZ)         |       | severidad (VARCHAR(20))            |
| activo (BOOLEAN)                   |       | fecha_fin (TIMESTAMPTZ, NULL)      |       | descripcion (VARCHAR(255))         |
| created_at (TIMESTAMPTZ)           |       | estado (VARCHAR(20))               |       +------------------------------------+
+------------------------------------+       | usuario_creador_id (INT, FK)       |                          |
                   |                         +------------------------------------+                          |
                   |                                            |                                            |
                   | 1:N                                        | 1:N                                        | 1:N
                   v                                            v                                            v
+----------------------------------------------------------------------------------------------------------------------------+
|                                                        INSPECCIONES                                                        |
+----------------------------------------------------------------------------------------------------------------------------+
| id (SERIAL, PK)                                                                                                            |
| lote_id (INT, FK -> LOTES.id) NOT NULL                                                                                     |
| tipo_defecto_id (INT, FK -> TIPOS_DEFECTO.id) NULL  -- (NULL si estado = 'APROBADO')                                       |
| usuario_id (INT, FK -> USUARIOS.id) NOT NULL        -- Operario responsable                                                |
| estado (VARCHAR(20)) NOT NULL                       -- 'APROBADO' o 'RECHAZADO'                                            |
| imagen_url (VARCHAR(255)) NULL                      -- Ruta de la foto de prueba                                           |
| observacion (VARCHAR(255)) NULL                                                                                            |
| fecha_hora (TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP)                                                                         |
+----------------------------------------------------------------------------------------------------------------------------+
                                                               |
                                                               | 1:N
                                                               v
                                             +------------------------------------+
                                             |              ALERTAS               |
                                             +------------------------------------+
                                             | id (SERIAL, PK)                    |
                                             | inspeccion_id (INT, FK) NOT NULL   |
                                             | nivel (VARCHAR(20))                |
                                             | mensaje (VARCHAR(255)) NOT NULL    |
                                             | atendida (BOOLEAN DEFAULT FALSE)   |
                                             | fecha_hora (TIMESTAMPTZ)           |
                                             +------------------------------------+
```

---

## 4. Arquitectura del Sistema

* **Frontend (React + Vite + Tailwind CSS):**
  * Vista Operario: Terminal con semáforo de estado, visor de imagen y botón de simulación.
  * Vista Supervisor: Tablero analítico con métricas en tiempo real y tabla de auditoría.
* **Backend (Node.js + Express):**
  * Arquitectura en capas (`routes` $\rightarrow$ `controllers` $\rightarrow$ `services` $\rightarrow$ `db`).
  * Conexión a Neon mediante Connection Pool con driver nativo `pg`.
  * **Endpoints Core:**
    * `POST /api/auth/login`: Autenticación y token JWT.
    * `POST /api/inspecciones`: Registro de evento con validación RN-01.
    * `GET /api/inspecciones/lote/:id`: Listado filtrado para auditoría.
    * `GET /api/dashboard/resumen`: Indicadores y totales por lote.
    * `POST /api/lotes` y `GET /api/lotes/activo`: Gestión de lote en producción.
    * `GET /api/tipos-defecto`: Catálogo de fallas por envase.
* **Base de Datos (PostgreSQL en Neon Cloud):** Alojamiento cloud serverless, accesible mediante `DATABASE_URL` con SSL requerido.

---

## 5. Wireframes e Interfaz de Usuario

* **Prototipo en Figma:** [NutriScan - Inspection System Wireframe](https://www.figma.com/make/objLiWC15kIhSmWOngRo9P/NutriScan-Inspection-System?t=ySdTJUipZfLWFrTM-0)
* **Pantallas Diseñadas:**
  1. **Terminal de Operario:** Panel táctil minimalista con tarjeta central de resultado (Verde/Rojo), visualizador de la última imagen del frasco o lata inspeccionada, motivo del defecto y botón de simulación rápida.
  2. **Dashboard de Calidad del Supervisor:** Tarjetas numéricas de KPI (Total piezas, Piezas Aprobadas, Rechazos, Tasa de Falla %), gráfico de barras con fallas por defecto y tabla de inspecciones recientes.

---

## 6. Congelamiento del Alcance (MVP)

* **🟢 MVP OBLIGATORIO:** Inspección simulada de frascos y latas $\rightarrow$ 7 defectos tipificados $\rightarrow$ Alerta visual en pantalla $\rightarrow$ Persistencia en PostgreSQL (Neon) $\rightarrow$ Dashboard con KPIs y totales $\rightarrow$ Autenticación básica con roles.
* **🟡 DESEABLES:** Filtros avanzados por rango horario y exportación de reportes a PDF/Excel.
* **🔴 FUERA DE ALCANCE:** Expulsión neumática física y desarrollo de algoritmos de visión artificial desde cero.
