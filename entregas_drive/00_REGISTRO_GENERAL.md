# 00 | REGISTRO GENERAL — PROYECTO FINAL PP2 (V2)

**Tecnicatura Superior en Desarrollo de Software**  
**Cátedra:** Práctica Profesionalizante II (PP2) — Industria 4.0  
**Fecha de Actualización:** Septiembre 2026  

---

### 1. Datos del Estudiante y Proyecto
* **Estudiante:** Tomás Agustín Gudiño Rubiolo
* **Nombre del Proyecto:** NutriScan — Sistema de Inspección y Registro de Calidad 4.0
* **KIT 4.0 Seleccionado:** AVZ-02 — Visión para Control de Calidad
* **Organización / Entorno de Referencia:** Industria Alimenticia (Planta de Conservas y Alimentos — Línea de Envasado de Frascos de Salsa y Latas)

---

### 2. Diagnóstico y Problema
En la línea de producción de alta velocidad (60 unidades/minuto) se procesan frascos de vidrio y latas de conserva. La inspección visual manual actual genera fatiga en el operario, lo que provoca el escape de envases con defectos críticos hacia las cajas de despacho:
* **Frascos:** Sin tapa (derrames/contaminación), llenado bajo y sin etiqueta.
* **Latas:** Abolladuras, óxido superficial, abombamiento/hinchazón (riesgo microbiológico) y anilla rota.
* **Gestión actual:** Los fallos se anotan a mano en planillas al final del día, con frecuente pérdida de información, falta de trazabilidad y nula capacidad de alerta temprana.

---

### 3. Usuarios Destinatarios
1. **Operario de Línea:** Visualiza la terminal de planta con señalética semafórica (Verde = OK / Rojo = Rechazo) y alertas visuales para retiro manual de piezas falladas.
2. **Supervisor de Calidad:** Gestiona la apertura y cierre de lotes, audita el historial de inspecciones y supervisa la tasa de defectos en tiempo real.
3. **Jefe de Planta / Administrador:** Analiza reportes consolidados y métricas globales de productividad y fallas para mantenimiento de maquinaria.

---

### 4. Objetivo General y MVP (10 Semanas)
Desarrollar un sistema de software local/cloud (**NutriScan**) que capture las inspecciones emitidas por un subsistema de visión inteligente (simulado mediante dataset de imágenes), almacene los registros estructurados en una base de datos relacional PostgreSQL (Neon), active alarmas operativas en el puesto de trabajo y presente un panel de métricas en vivo para supervisión.

---

### 5. Alcance Definido

| Nivel | Funcionalidades Comprendidas |
| :--- | :--- |
| **🟢 MVP Obligatorio** | • Simulador de cámara con dataset fotográfico (frascos y latas).<br>• Detección y tipificación de los 7 defectos acordados.<br>• Terminal del operario con semáforo visual Verde/Rojo.<br>• Persistencia de inspecciones y alertas en PostgreSQL (Neon).<br>• Dashboard del supervisor con cálculo de tasa de rechazo (%) y totales.<br>• Autenticación básica con control de roles (Operario / Supervisor). |
| **🟡 Deseables** | • Filtros por rango horario en el historial.<br>• Exportación de reportes en PDF o Excel.<br>• Simulación temporizada continua. |
| **🔴 Fuera de Alcance** | • Mecanismo expulsor físico/neumático en cinta.<br>• Programación de modelos de redes neuronales desde cero (se consume como servicio/módulo no-code).<br>• Conexión física a PLC o sistemas SCADA/ERP corporativos. |

---

### 6. Stack Tecnológico Base
* **Frontend:** React (Vite) + Tailwind CSS + Chart.js
* **Backend:** Node.js + Express (Arquitectura modular en capas)
* **Base de Datos:** PostgreSQL (Serverless en Neon Cloud, base `nutriscan_db`)
* **Comunicación:** API REST con formato de intercambio JSON y autenticación JWT
* **Control de Versiones:** Git / GitHub

---

### 7. Datos, Hardware y Uso de IA
* **Datos / Captura:** Dataset local con imágenes de prueba categorizadas por tipo de envase y defecto.
* **Integración del KIT AVZ-02:** Emulación de cámara inteligente enviando payloads vía `POST /api/inspecciones`.
* **Uso Responsable de IA:** Asistencia de herramientas de IA (ChatGPT, Claude, Gemini) para modelado de arquitectura, consultas SQL, validación de reglas de negocio y diseño de casos de prueba. Documentado en la bitácora de IA.

---

### 8. Panel de Estado y Trazabilidad

* **Semana Académica:** Semana 7 / 10 (Funcionalidad KIT 4.0 AVZ-02 validada)
* **Estado General:** **🟢 AL DÍA**
* **Riesgo del MVP:** **🟢 BAJO** (Puesto de visión inteligente KIT AVZ-02 operativo con dataset visual, tandas automáticas, actuadores de rechazo físico, reglas de parada de emergencia, cierre de lote con visto bueno y auditoría agrupada. 34 tests S7 y 52 tests S6 pasando al 100%).
* **Puntaje Acumulado Provisorio:** **76 / 100 puntos** (S1: 10 + S2: 15 + S3: 8 + S4: 12 + S5: 15 + S6: 8 + S7: 8)
* **Matriz de Entregas:**
  * **Semana 01 (Problema y Requisitos):** 🟢 COMPLETO / EVIDENCIADO (10/10 pts)
  * **Semana 02 (Análisis y Diseño):** 🟢 COMPLETO / EVIDENCIADO (15/15 pts)
  * **Semana 03 (BD y Backend Inicial):** 🟢 COMPLETO / EVIDENCIADO (8/8 pts)
  * **Semana 04 (Backend y Lógica de Negocio):** 🟢 COMPLETO / EVIDENCIADO (12/12 pts)
  * **Semana 05 (Frontend y UI/UX):** 🟢 COMPLETO / EVIDENCIADO (15/15 pts)
  * **Semana 06 (Integración Fullstack y Flujo E2E):** 🟢 COMPLETO / EVIDENCIADO (8/8 pts)
  * **Semana 07 (Funcionalidad KIT 4.0 - Simulador AVZ-02):** 🟢 COMPLETO / EVIDENCIADO (8/8 pts)
  * **Semana 08 (Reportes, KPIs y Dashboards):** ⚪ PRÓXIMA (4 pts)
