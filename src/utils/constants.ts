import { TimerPreset, SoundAlertSettings, SpeechDraft } from '../types';

export const DEFAULT_PRESETS: TimerPreset[] = [
  {
    id: 'pitch-2m',
    name: 'Elevator Pitch',
    category: 'pitch',
    minutes: 2,
    seconds: 0,
    description: 'Conciso y persuasivo: capturar atención y propuesta de valor.',
  },
  {
    id: 'flash-3m',
    name: 'Charla Relámpago',
    category: 'pitch',
    minutes: 3,
    seconds: 0,
    description: 'Presentación ágil de una sola idea potente.',
  },
  {
    id: 'toastmasters-5m',
    name: 'Toastmasters Breve',
    category: 'toastmasters',
    minutes: 5,
    seconds: 0,
    description: 'Discurso introductorio o rompehielos (4 a 6 min).',
  },
  {
    id: 'toastmasters-7m',
    name: 'Toastmasters Estándar',
    category: 'toastmasters',
    minutes: 7,
    seconds: 0,
    description: 'Estructura clásica: Apertura, 3 puntos clave y llamado.',
  },
  {
    id: 'executive-10m',
    name: 'Presentación Ejecutiva',
    category: 'academic',
    minutes: 10,
    seconds: 0,
    description: 'Reunión de directiva, reporte de avances o venta de proyecto.',
  },
  {
    id: 'ted-15m',
    name: 'Charla Tipo TED',
    category: 'ted',
    minutes: 15,
    seconds: 0,
    description: 'Narrativa inspiradora con desarrollo profundo y anécdota.',
  },
  {
    id: 'keynote-20m',
    name: 'Conferencia Magistral',
    category: 'academic',
    minutes: 20,
    seconds: 0,
    description: 'Exposición completa con contextualización y conclusiones.',
  },
];

export const DEFAULT_SOUND_SETTINGS: SoundAlertSettings = {
  enabled: true,
  volume: 0.8,
  halfwayAlert: true,
  oneMinuteAlert: true,
  thirtySecondsAlert: true,
  timeExpiredAlert: true,
  overtimeBeeper: true,
};

export const INITIAL_SPEECH_DRAFTS: SpeechDraft[] = [
  {
    id: 'speech-sample-1',
    title: 'El Poder de las Historias en la Comunicación',
    topic: 'Liderazgo y Oratoria',
    targetSeconds: 420, // 7 min
    lastEdited: Date.now(),
    sections: [
      {
        id: 'sec-1',
        title: '1. Gancho Inicial (0:00 - 1:15)',
        estimatedMinutes: 1.25,
        notes: '• Pregunta retórica al público: ¿Cuántos datos recuerdas de la última reunión?\n• Anécdota personal breve: La primera vez que hablé en público y se me olvidó todo el guión.\n• Pausa dramática de 2 segundos antes de la tesis central.',
      },
      {
        id: 'sec-2',
        title: '2. El Problema: Saturación de Datos (1:15 - 3:00)',
        estimatedMinutes: 1.75,
        notes: '• Las personas no toman decisiones por hojas de cálculo, sino por emociones justificadas con lógica.\n• Ejemplo claro: Comparar una diapositiva llena de texto vs. una historia de un cliente real.',
      },
      {
        id: 'sec-3',
        title: '3. La Fórmula de la Conexión (3:00 - 5:30)',
        estimatedMinutes: 2.5,
        notes: '• Los 3 elementos indispensables: Protagonista vulnerable, obstáculo insuperable, transformación.\n• Modulación de voz: Bajar el tono al describir el conflicto; aumentar ritmo y energía en la resolución.',
      },
      {
        id: 'sec-4',
        title: '4. Conclusión y Llamado a la Acción (5:30 - 7:00)',
        estimatedMinutes: 1.5,
        notes: '• Síntesis en una sola frase memorable.\n• Reto directo a la audiencia: En su próxima presentación, comiencen con una historia.\n• Cierre con agradecimiento firme, sin prisa.',
      },
    ],
    fullText: `¿Alguna vez se han preguntado por qué olvidamos el 90% de los gráficos que vemos en una presentación, pero recordamos intacta una fábula que nos contaron en la infancia?

Buenos días a todos. Hace cinco años me encontraba frente a una junta directiva. Tenía 40 diapositivas y tres minutos para convencerlos. Empecé a recitar números... y vi cómo uno a uno bajaban la mirada hacia sus teléfonos. En ese instante comprendí que hablar con datos sin emoción es como encender una vela en medio de una tormenta.

Hoy quiero compartir con ustedes cómo transformar ideas complejas en relatos inolvidables. Porque cuando comunicamos desde la historia, no solo transmitimos información: creamos una experiencia compartida.`,
  },
];
