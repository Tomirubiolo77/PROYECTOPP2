-- ==============================================================================
-- PROYECTO: NutriScan - Sistema de Inspección y Registro de Calidad 4.0
-- BASE DE DATOS: nutriscan_db (PostgreSQL en Neon Cloud)
-- ==============================================================================

-- 1. ELIMINACIÓN DE TABLAS PREVIAS (Para reinicialización limpia)
DROP TABLE IF EXISTS alertas CASCADE;
DROP TABLE IF EXISTS inspecciones CASCADE;
DROP TABLE IF EXISTS tipos_defecto CASCADE;
DROP TABLE IF EXISTS lotes CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;

-- ==============================================================================
-- 2. CREACIÓN DE TABLAS
-- ==============================================================================

-- TABLA: USUARIOS (Control de Acceso y Roles)
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL CHECK (rol IN ('OPERARIO', 'SUPERVISOR', 'ADMIN')),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- TABLA: LOTES (Lotes de producción en línea)
CREATE TABLE lotes (
    id SERIAL PRIMARY KEY,
    codigo_lote VARCHAR(50) UNIQUE NOT NULL,
    producto VARCHAR(100) NOT NULL,
    tipo_envase VARCHAR(20) NOT NULL CHECK (tipo_envase IN ('FRASCO', 'LATA')),
    fecha_inicio TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    fecha_fin TIMESTAMPTZ NULL,
    estado VARCHAR(20) DEFAULT 'EN_PROCESO' CHECK (estado IN ('EN_PROCESO', 'FINALIZADO', 'DETENIDO')),
    usuario_creador_id INT NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT
);

-- TABLA: TIPOS_DEFECTO (Catálogo de fallas tipificadas por envase)
CREATE TABLE tipos_defecto (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(30) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    tipo_envase VARCHAR(20) NOT NULL CHECK (tipo_envase IN ('FRASCO', 'LATA', 'GENERAL')),
    severidad VARCHAR(20) NOT NULL CHECK (severidad IN ('BAJA', 'MEDIA', 'CRITICA', 'ALTA')),
    descripcion VARCHAR(255) NULL
);

-- TABLA: INSPECCIONES (Registro de cada evento de visión/simulación)
CREATE TABLE inspecciones (
    id SERIAL PRIMARY KEY,
    lote_id INT NOT NULL REFERENCES lotes(id) ON DELETE CASCADE,
    tipo_defecto_id INT NULL REFERENCES tipos_defecto(id) ON DELETE SET NULL,
    usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    estado VARCHAR(20) NOT NULL CHECK (estado IN ('APROBADO', 'RECHAZADO')),
    imagen_url VARCHAR(255) NULL,
    observacion VARCHAR(255) NULL,
    fecha_hora TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- TABLA: ALERTAS (Notificaciones operativas automáticas ante fallas)
CREATE TABLE alertas (
    id SERIAL PRIMARY KEY,
    inspeccion_id INT NOT NULL REFERENCES inspecciones(id) ON DELETE CASCADE,
    nivel VARCHAR(20) DEFAULT 'WARN' CHECK (nivel IN ('INFO', 'WARN', 'CRITICA')),
    mensaje VARCHAR(255) NOT NULL,
    atendida BOOLEAN DEFAULT FALSE,
    fecha_hora TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 3. ÍNDICES DE RENDIMIENTO (Optimización de consultas para Dashboard)
-- ==============================================================================
CREATE INDEX idx_inspecciones_lote ON inspecciones(lote_id);
CREATE INDEX idx_inspecciones_fecha ON inspecciones(fecha_hora);
CREATE INDEX idx_inspecciones_estado ON inspecciones(estado);
CREATE INDEX idx_alertas_inspeccion ON alertas(inspeccion_id);
CREATE INDEX idx_lotes_estado ON lotes(estado);

-- ==============================================================================
-- 4. CARGA DE DATOS INICIALES (SEMILLAS / SEEDS)
-- ==============================================================================

-- A. Usuarios iniciales (Password de prueba: '123456')
INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES
('Operario Línea 01', 'operario@nutriscan.com', '$2b$10$9QKeVJMGjFUFMP3bjJaY1eyjPDq.yeyAPqg2n3IFsxdrcrHFtQaCe', 'OPERARIO'),
('Supervisor de Calidad', 'supervisor@nutriscan.com', '$2b$10$9QKeVJMGjFUFMP3bjJaY1eyjPDq.yeyAPqg2n3IFsxdrcrHFtQaCe', 'SUPERVISOR'),
('Administrador del Sistema', 'admin@nutriscan.com', '$2b$10$9QKeVJMGjFUFMP3bjJaY1eyjPDq.yeyAPqg2n3IFsxdrcrHFtQaCe', 'ADMIN');

-- B. Catálogo Maestro de Defectos (Frascos y Latas)
INSERT INTO tipos_defecto (codigo, nombre, tipo_envase, severidad, descripcion) VALUES
-- Defectos para Frascos
('SIN_TAPA', 'Frasco sin tapa hermética', 'FRASCO', 'CRITICA', 'Falta de cierre, riesgo de derrame e inocuidad.'),
('LLENADO_BAJO', 'Nivel de salsa insuficiente', 'FRASCO', 'MEDIA', 'Volumen inferior al declarado comercialmente.'),
('SIN_ETIQUETA', 'Ausencia de etiqueta frontal', 'FRASCO', 'MEDIA', 'Falta de identificación de marca y lote.'),

-- Defectos para Latas
('ABOLLADURA', 'Lata con deformación o abolladura', 'LATA', 'MEDIA', 'Daño físico estructural en el cuerpo de la lata.'),
('OXIDO', 'Presencia de corrosión / óxido', 'LATA', 'CRITICA', 'Contaminación exterior o interior por óxido.'),
('ABOMBAMIENTO', 'Lata hinchada / abombada', 'LATA', 'CRITICA', 'Posible contaminación microbiológica por generación de gases.'),
('ANILLA_ROTA', 'Anilla de apertura ausente o rota', 'LATA', 'BAJA', 'Falla en el dispositivo de apertura fácil.');

-- C. Lotes de prueba iniciales
INSERT INTO lotes (codigo_lote, producto, tipo_envase, estado, usuario_creador_id) VALUES
('LOTE-FRASCO-2026-01', 'Salsa de Tomate Tradicional 500g', 'FRASCO', 'EN_PROCESO', 2),
('LOTE-LATA-2026-01', 'Arvejas en Conserva 350g', 'LATA', 'EN_PROCESO', 2);

-- D. Inspecciones de ejemplo para el Lote 1 (Frascos)
INSERT INTO inspecciones (lote_id, tipo_defecto_id, usuario_id, estado, observacion) VALUES
(1, NULL, 1, 'APROBADO', 'Frasco correctamente sellado y lleno'),
(1, NULL, 1, 'APROBADO', 'Frasco conforme'),
(1, 1, 1, 'RECHAZADO', 'Frasco detectado sin tapa en cabezal 2'),
(1, 2, 1, 'RECHAZADO', 'Nivel 15mm por debajo del estándar');

-- E. Alertas generadas por las fallas de ejemplo
INSERT INTO alertas (inspeccion_id, nivel, mensaje) VALUES
(3, 'CRITICA', 'Alerta en Línea: Frasco sin tapa detectado en LOTE-FRASCO-2026-01'),
(4, 'WARN', 'Desvío de llenado detectado en LOTE-FRASCO-2026-01');
