# OratoriaPro — Cronómetro y Atril Digital de Ensayos

Aplicación web especializada para oradores, conferencistas y ponentes que combina un cronómetro de cuenta regresiva de alta visibilidad con alertas sonoras por hitos, grabadora de voz integrada para autoevaluación, gestor de notas de discurso y modo atril en pantalla completa.

### User Review & Critical Decisions

> [!IMPORTANT]
> Se han incorporado las elecciones clave seleccionadas para el flujo de ensayo:

- **Sistema de Tiempo Confirmado**: Cuenta regresiva fija y personalizable (con presets rápidos de 3, 5, 7, 10, 15 y 20 minutos, además de selector exacto de minutos y segundos) con avisos sonoros mediante Web Audio API (campanas claras a la mitad del tiempo, a 1 minuto, a 30 segundos y al expirar).
- **Herramienta de Apoyo Confirmada**: Grabadora de voz sincrónica integrada mediante `MediaRecorder` y `AudioContext`, con visualizador en vivo de niveles, reproductor con control de velocidad (0.75x a 1.5x), marcadores de tiempo de ensayo y opción de descarga del audio en formato WebM/WAV.
- **Distribución de Pantalla Confirmada**: Modo atril profesional con vista dividida (cronómetro y controles en un panel, guión y notas de apoyo en el otro con control de tamaño de letra y desplazamiento asistido) y modo de pantalla completa para atril o podio.

---

### 1. Overview & Core Concept

- **Qué hace**: Proporciona un entorno de ensayo sin distracciones para oratoria y presentaciones públicas. Permite ajustar el tiempo exacto del discurso, activar alertas sonoras no invasivas pero perceptibles que guíen el ritmo, grabar el audio del ensayo en tiempo real, visualizar notas y guiones con tipografía adaptable y revisar el historial de ensayos con métricas de duración real vs. planeada.
- **Audiencia objetivo**: Estudiantes, profesionales, divulgadores, oradores de eventos tipo TED, concursantes de debate y cualquier persona preparando discursos o presentaciones ejecutivas.
- **Valor diferencial**: En lugar de un cronómetro de cocina genérico, integra la acústica de alertas pensadas para el ritmo de la voz, teleprómpter/notas de apoyo con tipografía de lectura a distancia y grabación directa para escuchar y corregir muletillas o pausas.

---

### 2. User Experience & Visual Design

- **Flujos de usuario principales**:
  1. *Configuración rápida*: Selección de duración objetivo (presets tipo "Elevator Pitch 3m", "Charla relámpago 5m", "Conferencia 15m" o tiempo personalizado) y activación de alertas sonoras deseadas.
  2. *Preparación del guión*: Entrada o edición de notas organizadas por secciones (Introducción, Desarrollo, Conclusión, Puntos clave) con selector de tamaño de fuente (`A-` / `A+`).
  3. *Ensayo activo*: Inicio del cronómetro con grabación de voz opcional o simultánea. El cronómetro muestra minutos, segundos y una barra de progreso sutil. Cambio de estado visual al alcanzar zonas críticas (advertencia y tiempo agotado sin saturación agresiva).
  4. *Modo Pantalla Completa / Podio*: Expansión a pantalla completa para colocar el dispositivo a 1-2 metros en una mesa o atril, maximizando el display del tiempo y el contraste de lectura.
  5. *Autoevaluación posterior*: Al detener el ensayo, se genera un registro con la duración lograda, el archivo de audio para reproducción inmediata con barra de desplazamiento y posibilidad de añadir reflexiones o notas de mejora.

- **Identidad Visual y Tema**:
  - *Estilo y atmósfera*: Atril profesional moderno con enfoque minimalista oscuro (`bg-neutral-950`, superficies `neutral-900` con bordes suaves `border-neutral-800`), reduciendo la fatiga visual y garantizando legibilidad óptima bajo luces de escenario o cuartos de ensayo.
  - *Colores estructurales y acentos (60-30-10)*:
    - 60% Fondo neutro profundo (`#0A0A0B` / `#121214`).
    - 30% Paneles estructurales y tipografía clara (`#1E1E24`, texto primario `#F4F4F5`, texto secundario `#A1A1AA`).
    - 10% Acento funcional: Índigo/Azul orador (`#3B82F6` / `#6366F1`) para acciones principales, Ámbar sereno (`#F59E0B`) para zona de cierre inminente y Carmesí templado (`#EF4444`) para tiempo sobrepasado.
  - *Tipografía y números tabulares*:
    - Display numérico: `font-mono tabular-nums tracking-tight` de gran escala para lectura instantánea sin brincos de layout.
    - Textos y notas: `Plus Jakarta Sans` para lectura ergonómica de apuntes y etiquetas.
  - *Controles e interactividad*: Botones con respuesta inmediata ($\le 150\text{ms}$), teclado de atajos rápidos (Espacio = Iniciar/Pausar, R = Reiniciar, M = Silenciar alertas, F = Pantalla completa).

---

### 3. Key Product Decisions & Trade-Offs

- **Generador de Audio Nativo vs. Archivos MP3 externos**:
  - *Decisión*: Usar Web Audio API (`AudioContext`, `OscillatorNode`, `GainNode`) para crear armónicos cálidos de campana tibetana/chime suave.
  - *Motivo*: Cero latencia, no depende de descargas de audio de red que puedan fallar sin conexión, volumen regulable matemáticamente y tono armónico no discordante que no asusta al orador.
- **Grabación de audio en el navegador con MediaStream**:
  - *Decisión*: Utilizar `MediaRecorder` nativo con captura de micrófono en chunks de audio Blob en memoria/IndexedDB, visualizador de onda por Canvas/SVG.
  - *Motivo*: Privacidad absoluta (el audio del ensayo no sale del equipo del usuario), funcionamiento instantáneo y reproducción inmediata.
- **Gestión de estado y persistencia**:
  - *Decisión*: `localStorage` para discursos guardados, configuración de alertas y notas; `IndexedDB` para almacenar grabaciones de voz de ensayos pasados sin exceder los 5MB de cuota de `localStorage`.
- **Vista adaptable de atril (Split / Focused)**:
  - *Decisión*: Ofrecer un conmutador simple entre vista dividida (Cronómetro + Notas) y vista enfocada (Cronómetro gigante), además de pantalla completa nativa.

---

### 4. Technical Architecture & Data Strategy *(Technical Reference)*

```
┌────────────────────────────────────────────────────────────────────────┐
│                          OratoriaPro Web App                           │
├────────────────────────────────────────────────────────────────────────┤
│  Top Navigation (Brand Wordmark · Presets · Atajos de Teclado · Full) │
├───────────────────────────────────┬────────────────────────────────────┤
│           Panel Atril             │             Panel Notas            │
│  ┌─────────────────────────────┐  │  ┌──────────────────────────────┐  │
│  │ Display Digital Gigante     │  │  │ Editor de Discurso / Puntos  │  │
│  │ (Minutos:Segundos · Estado) │  │  │ - Modo lectura / edición     │  │
│  │                             │  │  │ - Selector de tamaño de letra│  │
│  │ Barra de Progreso Circular/ │  │  │ - Tarjetas por secciones     │  │
│  │ Lineal por Porcentajes      │  │  │ (Intro, Cuerpo, Cierre)      │  │
│  ├─────────────────────────────┤  │  └──────────────────────────────┘  │
│  │ Controles de Tiempo:        │  ├────────────────────────────────────┤
│  │ Iniciar · Pausar · Reiniciar│  │       Grabador & Evaluador         │
│  │ Presets: 3m, 5m, 10m, Custom│  │  ┌──────────────────────────────┐  │
│  ├─────────────────────────────┤  │  │ Vúmetro / Nivel de micro     │  │
│  │ Módulo de Alertas Sonoras:  │  │  │ Grabación automática al dar  │  │
│  │ Hitos 50%, 75%, 90%, 100%   │  │  │ 'Play' o manual              │  │
│  │ Síntesis Web Audio Chimes   │  │  │ Reproductor con speed 0.75-  │  │
│  └─────────────────────────────┘  │  │ 1.5x y descarga de audio     │  │
│                                   │  └──────────────────────────────┘  │
├───────────────────────────────────┴────────────────────────────────────┤
│  Historial de Ensayos (Sesiones guardadas · Duraciones · Audios · Log) │
└────────────────────────────────────────────────────────────────────────┘
```

- **Módulos Principales**:
  - `useSpeechTimer`: Hook de tiempo ultrapreciso basado en `performance.now()`, con estados `idle`, `running`, `paused`, `finished`, `overtime`.
  - `useAudioRecorder`: Hook para gestión de permisos de micrófono, `MediaStream`, `MediaRecorder`, análisis de frecuencias en tiempo real para vúmetro, y codificación en Blob de audio.
  - `soundSynthesizer`: Motor Web Audio API que reproduce timbres armónicos sintetizados (aviso medio, aviso de preparación al cierre, campanada final y metrónomo suave opcional).
  - `SpeechNotesManager`: Componente de lectura y redacción de notas por secciones con auto-guardado y control tipográfico ergonómico.
  - `RehearsalHistory`: Historial de tomas y ensayos con comparativa de tiempo objetivo vs. tiempo real, reproductor de audio y notas de feedback propio.
