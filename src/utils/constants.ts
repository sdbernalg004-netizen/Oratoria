import { TimerPreset, SoundAlertSettings, SpeechDraft, SourceDocument } from '../types';

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

export const INITIAL_SOURCE_DOCUMENTS: SourceDocument[] = [
  {
    id: 'doc-wanda-sample',
    title: 'S-34_S_104 con anotaciones',
    type: 'text',
    theme: 'dark',
    fontSize: 22,
    lineHeight: 1.7,
    currentPage: 24,
    totalPages: 28,
    content: `que él era incrédulo, ¿cómo obraría Wanda cuando su madre no estuviera presente?

Al principio Wanda lloraba antes de dormirse. Entonces recordó el consejo de su madre de llevar sus problemas a Jehová en oración. Oró y pronto pensó en examinar la guía telefónica para ver si había testigos de Jehová en aquella zona. Se comunicó con ellos y se enteró de que una familia de Testigos vivía cerca de la casa de su padre. "¡Qué contenta me puse!", dice Wanda. Con el ánimo que recibió de esta familia, Wanda pudo ayudar a su hermano y su hermana menores a reactivarse en el servicio cristiano.

Ella se encargaba de que estuviéramos preparados para las reuniones —recuerda—. Tenía que lavar la ropa, ver que estuviéramos peinados y asegurarme de que estuviéramos limpios y presentables. Era trabajo duro para una joven, pero lo hizo. En cierta ocasión el padre trató de impedir que fueran a la reunión dominical, pero la determinación y el respeto de los hijos conmovieron su corazón.`,
    pages: [
      `que él era incrédulo, ¿cómo obraría Wanda cuando su madre no estuviera presente?

Al principio Wanda lloraba antes de dormirse. Entonces recordó el consejo de su madre de llevar sus problemas a Jehová en oración. Oró y pronto pensó en examinar la guía telefónica para ver si había testigos de Jehová en aquella zona. Se comunicó con ellos y se enteró de que una familia de Testigos vivía cerca de la casa de su padre. "¡Qué contenta me puse!", dice Wanda. Con el ánimo que recibió de esta familia, Wanda pudo ayudar a su hermano y su hermana menores a reactivarse en el servicio cristiano.

Ella se encargaba de que estuviéramos preparados para las reuniones —recuerda—. Tenía que lavar la ropa, ver que estuviéramos peinados y asegurarme de que estuviéramos limpios y presentables. Era trabajo duro para una joven, pero lo hizo. En cierta ocasión el padre trató de impedir que fueran a la reunión dominical, pero la determinación y el respeto de los hijos conmovieron su corazón.`,
      `El ejemplo de perseverancia y fe viva:
1. La importancia de la oración constante ante la incertidumbre.
2. Cómo buscar apoyo espiritual en la comunidad local.
3. El cuidado de los más jóvenes con amor y paciencia.
4. Aplicación práctica: No desmayar cuando las circunstancias familiares sean desafiantes.

Puntos para enfatizar en la oratoria:
• Modulación suave y empática al relatar el sufrimiento inicial de Wanda.
• Aumento del brillo vocal y entusiasmo al pronunciar: "¡Qué contenta me puse!".
• Pausa tras la pregunta reflexiva para permitir que la congregación medite en la lección.`,
    ],
  },
  {
    id: 'doc-bosquejo-oratoria',
    title: 'Bosquejo General de Discurso Público',
    type: 'outline',
    theme: 'white',
    fontSize: 20,
    lineHeight: 1.6,
    currentPage: 1,
    totalPages: 3,
    content: `I. INTRODUCCIÓN (Tiempo sugerido: 1:30)
• Ilustración inicial: El valor de un buen cimiento.
• Pregunta de sondeo al auditorio: ¿Qué hace que una decisión sea verdaderamente sabia?
• Lectura del texto temático principal.

II. CUERPO DEL DISCURSO (Tiempo sugerido: 5:00)
A. Primer punto principal: Reconocer los peligros del desánimo.
   - Datos prácticos y ejemplo de la vida real.
   - Conexión con la audiencia: Todos enfrentamos presiones similares.
B. Segundo punto principal: Pasos concretos para actuar con confianza.
   - 1. Evaluar objetivamente la situación.
   - 2. Buscar consejo fidedigno.
   - 3. Mantener una actitud paciente y perseverante.

III. CONCLUSIÓN (Tiempo sugerido: 1:30)
• Resumen en dos oraciones claras.
• Exhortación final: Aplicar el principio desde hoy mismo.
• Agradecimiento y cierre con firmeza.`,
  },
];
