# 01 | SEMANA 1 — PROBLEMA, REQUISITOS Y ALCANCE

**Proyecto:** NutriScan — Sistema de Inspección y Registro de Calidad 4.0  
**Estudiante:** Tomás Agustín Gudiño Rubiolo  
**KIT 4.0 Asociado:** AVZ-02 — Visión para Control de Calidad  
**Entorno de Aplicación:** Industria Alimenticia (Línea de Envasado de Frascos y Latas)  

---

## 1. Diagnóstico y Problema Concreto

### Contexto de la Planta
En una planta de conservas y alimentos procesados, la línea de envasado opera a una velocidad de **60 unidades por minuto**. La línea procesa dos tipos de productos en presentaciones distintas: **Frascos de vidrio** (salsas) y **Latas metálicas** (vegetales y legumbres).

### Situación Actual (AS-IS)
Actualmente, el control de calidad al final de la línea lo realiza un único operario mediante **inspección visual manual**:
- La velocidad del flujo y la monotonía provocan fatiga visual en períodos breves.
- El operario parpadea, se distrae o no llega a inspeccionar el 100% de los envases a esa cadencia.
- Frascos y latas con defectos críticos terminan siendo embalados y despachados.
- El conteo de defectos se anota a mano en planillas de papel al finalizar el turno, las cuales con frecuencia se extravían, contienen errores de transcripción y no permiten tomar decisiones correctivas en tiempo real.

### Problemática Específica por Tipo de Envase:

1. **Defectos en Frascos de Vidrio:**
   * **Frasco sin tapa:** Provoca derrames inmediatos, pérdida de hermeticidad y contaminación biológica del lote.
   * **Llenado bajo / Nivel insuficiente:** No cumple con el volumen comercial declarado, generando multas y quejas de consumidores.
   * **Frasco sin etiqueta:** Producto sin identificación de marca, lote ni fecha de vencimiento.

2. **Defectos en Latas Metálicas:**
   * **Abolladuras y deformaciones:** Daño mecánico que compromete el barniz interior y las costuras de la lata.
   * **Presencia de óxido:** Corrosión superficial que invalida la comercialización por riesgo higiénico.
   * **Abombamiento / Hinchazón (Crítico):** Indicio grave de generación de gases internos por actividad bacteriana.
   * **Anilla de apertura rota o ausente:** Impide la apertura normal del envase por parte del consumidor.

### Propuesta de Modernización con KIT AVZ-02 (TO-BE)
Implementar una estación de visión inteligente asistida (**NutriScan**) que reciba las señales y clasificaciones de una cámara industrial No-Code (o su simulación en laboratorio), emita alertas visuales inmediatas en la estación de trabajo ante piezas no conformes y registre automáticamente cada evento en una base de datos centralizada.

---

## 2. Usuarios del Sistema

1. **Operario de Línea:**  
   * Persona encargada del puesto de empaque y descarte manual.
   * Necesita una pantalla táctil simple con semáforo Verde/Rojo de gran contraste para separar inmediatamente cualquier envase defectuoso.
2. **Supervisor de Calidad:**  
   * Responsable de auditar el proceso, habilitar lotes y analizar motivos de rechazo.
   * Utiliza el dashboard para monitorear el % de falla y consultar el historial cronológico.
3. **Jefe de Planta / Administrador:**  
   * Toma decisiones estratégicas basadas en el rendimiento de los equipos dosificadores, tapadores y cerradores de latas a lo largo de las semanas.

---

## 3. Objetivo General del Proyecto (MVP de 10 Semanas)
Desarrollar un sistema de software integral (**NutriScan**) que capture y procese eventos de inspección emitidos por el subsistema de visión del KIT AVZ-02, persistiendo los datos en una base de datos relacional PostgreSQL (Neon), alertando en tiempo real en la línea de producción y brindando visualización estadística en un panel de control operativo.

---

## 4. Funcionalidades Principales del MVP (5 Funciones Clave)
1. **Simulador de Inspección de Envases:** Capacidad de cargar y disparar inspecciones simuladas a partir de un banco de imágenes representativo de frascos y latas (piezas conformes y con los 7 defectos tipificados).
2. **Clasificación y Tipificación de Defectos:** Módulo lógico que categoriza el estado (*APROBADO* / *RECHAZADO*) y asigna el código de falla correspondiente.
3. **Panel Operativo con Alarma en Tiempo Real:** Interfaz de alto impacto visual que parpadea en color rojo ante un rechazo y emite advertencia prioritaria ante 3 rechazos consecutivos.
4. **Registro Automático en Base de Datos:** Persistencia instantánea de cada inspección con ID de lote, tipo de defecto, operario, timestamp y estado en PostgreSQL.
5. **Dashboard de Supervisión de Calidad:** Visualización de métricas en vivo (total procesado, piezas OK, piezas rechazadas, porcentaje de merma) y distribución por tipo de falla.

---

## 5. Flujo Principal del Sistema
```text
[ Carga de Imagen / Disparo ] 
              │
              ▼
[ Módulo de Visión / Simulador ]  ---> Determina Estado y Defecto
              │
              ▼
[ Petición POST a API REST ]
              │
    ┌─────────┴─────────┐
    ▼                   ▼
[ Alerta en Pantalla ]  [ Guardado en PostgreSQL ]
(Semáforo Rojo / Verde) (Tabla inspecciones + alertas)
                        │
                        ▼
            [ Actualización en Dashboard ]
            (Totales, % rechazo en tiempo real)
```

---

## 6. Requisitos del Sistema

### Requisitos Funcionales (RF):
* **RF01:** El sistema debe permitir iniciar sesión y restringir vistas según el rol del usuario (*Operario*, *Supervisor*, *Admin*).
* **RF02:** El sistema debe contar con un endpoint REST (`POST /api/inspecciones`) para registrar la inspección de frascos y latas.
* **RF03:** El sistema debe clasificar 7 tipos de defectos: `SIN_TAPA`, `LLENADO_BAJO`, `SIN_ETIQUETA`, `ABOLLADURA`, `OXIDO`, `ABOMBAMIENTO`, `ANILLA_ROTA`.
* **RF04:** El sistema debe activar una señal visual inmediata en la pantalla del operario ante cada rechazo.
* **RF05:** El sistema debe permitir abrir, consultar y cerrar lotes de producción especificando el tipo de envase (`FRASCO` o `LATA`).
* **RF06:** El dashboard debe calcular dinámicamente la tasa de rechazo (%) por lote y el total de unidades inspeccionadas.

### Requisitos No Funcionales (RNF):
* **RNF01 (Stack Tecnológico):** Frontend desarrollado en React, Backend en Node.js con Express y Base de Datos PostgreSQL alojada en Neon Cloud.
* **RNF02 (Tiempo de Respuesta):** El registro y la respuesta de la API no deben superar los 500 ms por evento.
* **RNF03 (Usabilidad en Planta):** La interfaz del operario debe contar con tipografía grande, botones táctiles y señalética cromática intuitiva sin sobrecarga de texto.
* **RNF04 (Integridad de Datos):** La base de datos debe mantener integridad referencial mediante claves foráneas e índices de búsqueda.

---

## 7. Matriz de Alcance

* **🟢 MVP OBLIGATORIO (10 Semanas):** Simulación de inspección con dataset local $\rightarrow$ Clasificación con los 7 defectos $\rightarrow$ Semáforo visual en pantalla $\rightarrow$ Persistencia en PostgreSQL (Neon) $\rightarrow$ Dashboard con KPIs y totales $\rightarrow$ Control de acceso básico.
* **🟡 DESEABLES (Fase complementaria):** Filtros avanzados en tablas de auditoría, exportación de reportes a PDF/Excel y modo de simulación automática continua por temporizador.
* **🔴 FUERA DE ALCANCE:** Expulsión física por pistón neumático en cinta transportadora, programación de algoritmos de visión artificial desde cero (se asume la cámara como componente de fábrica) y conexiones a PLC industrial.
