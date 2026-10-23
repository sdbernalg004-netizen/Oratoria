import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import mammoth from 'mammoth';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Generous limit for base64 audio and reference texts
app.use(express.json({ limit: '60mb' }));
app.use(express.urlencoded({ extended: true, limit: '60mb' }));

// Server-side Gemini initialization with telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Endpoint for AI Speech Analysis & Oratory Coaching
app.post('/api/analyze-speech', async (req, res) => {
  try {
    const {
      speechTitle,
      targetSeconds,
      actualSeconds,
      referenceSourceText,
      audioBase64,
      audioMimeType = 'audio/webm',
      userNotes,
      isJehovahsWitness = false,
      isJwVerified = false,
    } = req.body;

    const useVerifiedJwCounsel = Boolean(isJehovahsWitness && isJwVerified);

    const safeTarget = Number.isFinite(Number(targetSeconds)) && Number(targetSeconds) > 0 ? Number(targetSeconds) : 300;
    const safeActual = Number.isFinite(Number(actualSeconds)) && Number(actualSeconds) >= 0 ? Number(actualSeconds) : 0;
    const delta = safeActual - safeTarget;
    const isOvertime = delta > 0;
    const timeSummary = `Tiempo objetivo: ${Math.floor(safeTarget / 60)}m ${safeTarget % 60}s. Tiempo logrado: ${Math.floor(safeActual / 60)}m ${safeActual % 60}s (${isOvertime ? `Excedido por +${delta}s` : `Completado con ${Math.abs(delta)}s de anticipación`}).`;

    const jwCounselGuide = useVerifiedJwCounsel
      ? `
MARCO DE CONSEJO Y ENTRENAMIENTO DE ORATORIA (VERIFICADO CON PROTECCIÓN DE DERECHOS DE AUTOR):
El orador ha verificado su participación en la escuela teocrática y ha aceptado las condiciones de respeto a los derechos de autor de jw.org.
Orienta tu evaluación pedagógica según los principios de oratoria de los 53 aspectos del manual de estudio:
"Benefíciese de la Escuela del Ministerio Teocrático" (enlace oficial: https://www.jw.org/es/biblioteca/libros/Benef%C3%ADciese-de-la-Escuela-del-Ministerio-Teocr%C3%A1tico/).

REGLA ESTRICTA DE DERECHOS DE AUTOR (CUMPLIMIENTO OBLIGATORIO):
1. PROHIBIDO reproducir, citar textualmente o copiar párrafos protegidos por derechos de autor del libro «Benefíciese» o de cualquier publicación de Watch Tower Bible and Tract Society of Pennsylvania.
2. Redacta el 100% de tus observaciones con tus propias palabras originales como entrenador vocal, mencionando únicamente el número y tema general del aspecto de oratoria a trabajar (por ejemplo: Aspecto 1: Lectura con precisión, Aspecto 4: Modulación, Aspecto 5: Pausas oportunas, Aspecto 6: Énfasis debido, Aspecto 7: Énfasis en las ideas principales, Aspecto 9: Entusiasmo y calidez, Aspecto 12: Contacto visual, Aspecto 14: Uso eficaz de los textos bíblicos, Aspecto 39: Introducción eficaz, Aspecto 40: Conclusión apropiada, Aspecto 41: Respeto del tiempo asignado).
3. En cada consejo dentro de "actionableTips", invita al estudiante a leer directamente la lección correspondiente en la fuente oficial en jw.org.
`
      : `
MARCO DE CONSEJO Y ENTRENAMIENTO DE ORATORIA:
El orador utiliza el modo de Oratoria General Contemporánea. Actúa como un juez y coach de elocuencia y comunicación pública profesional (tomando principios universales de la red, Toastmasters International, conferencias TED, Dale Carnegie y retórica clásica contemporánea).
Tus consejos deben provenir de las mejores prácticas universales de la oratoria pública, presencia escénica, variedad vocal y persuasión.
`;

    const promptText = `
${jwCounselGuide}
El orador acaba de ensayar su discurso titulado: "${speechTitle || 'Discurso de Oratoria'}".
Métricas de tiempo registradas:
${timeSummary}

${referenceSourceText ? `\n--- FUENTE DE CONSULTA / BOSQUEJO UTILIZADO ---\n${referenceSourceText.slice(0, 8000)}\n----------------------------------------\n` : ''}
${userNotes ? `\nAutoevaluación previa del orador: "${userNotes}"\n` : ''}

CONFIDENCIALIDAD ESTRICTA: El material y bosquejos del orador son de uso estrictamente personal y privado.

Por favor, realiza un análisis integral y constructivo de este ensayo.
Si se incluye el audio del ensayo adjunto, analiza cuidadosamente la cadencia, tono, modulación, pausas y claridad vocal.
Si no hay audio reproducible, analiza con base en las métricas de tiempo, la complejidad del bosquejo/fuente de consulta y las recomendaciones de ritmo oratorio.

Devuelve tu respuesta ÚNICAMENTE en formato JSON con la siguiente estructura exacta:
{
  "overallScore": number (de 1 a 100),
  "summary": "Resumen ejecutivo motivador y claro en 2-3 oraciones",
  "pacingAnalysis": {
    "status": "Adecuado" | "Acelerado" | "Lento" | "Irregular",
    "feedback": "Evaluación del ritmo, pausas enfáticas y uso del tiempo programado."
  },
  "dictionAndModulation": {
    "score": number (de 1 a 10),
    "feedback": "Evaluación de claridad, modulación, volumen y variedad tonal para conectar con el público."
  },
  "outlineCoverage": {
    "score": number (de 1 a 10),
    "feedback": "Cómo se adaptó la exposición al bosquejo o fuente de consulta, transiciones y énfasis en puntos principales."
  },
  "actionableTips": [
    "Consejo 1 práctico y específico con redacción 100% original para aplicar en el siguiente intento",
    "Consejo 2 práctico y específico con redacción 100% original",
    "Consejo 3 práctico y específico con redacción 100% original"
  ],
  "recommendedExercise": "Un ejercicio vocal o de respiración recomendado para su próxima práctica",
  "isJwCounsel": ${useVerifiedJwCounsel ? 'true' : 'false'},
  "jwCounselSource": "${useVerifiedJwCounsel ? 'Guía de 53 Aspectos · Consultar texto oficial en jw.org' : 'Oratoria General y Fuentes de la Red'}"
}
`;

    const contentsParts: any[] = [];

    // If audio is provided, attach as inline data for multimodal listening
    if (audioBase64) {
      contentsParts.push({
        inlineData: {
          mimeType: audioMimeType,
          data: audioBase64,
        },
      });
    }

    contentsParts.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts: contentsParts },
      config: {
        responseMimeType: 'application/json',
        temperature: 0.7,
      },
    });

    const textOutput = response.text || '{}';
    let analysis;
    try {
      analysis = JSON.parse(textOutput);
    } catch {
      // Clean possible markdown code fences if any
      const cleaned = textOutput.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analysis = JSON.parse(cleaned);
    }

    return res.json({ success: true, analysis });
  } catch (error: any) {
    console.error('Error generating speech analysis:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error al procesar el análisis de voz y oratoria con IA.',
    });
  }
});

// Endpoint to extract speech sections, teleprompter text, and reader pages from uploaded PDF or text
app.post('/api/extract-pdf-sections', async (req, res) => {
  try {
    const { pdfBase64, fileName = 'Discurso_Cargado' } = req.body;

    if (!pdfBase64) {
      return res.status(400).json({ success: false, error: 'No se recibió el archivo PDF en base64.' });
    }

    const promptText = `Lee atentamente este documento PDF adjunto.
INSTRUCCIÓN CRÍTICA DE MÁXIMA PRIORIDAD:
NO MODIFIQUES EL TEXTO NI LAS IDEAS DEL AUTOR. El orador necesita que sus ideas, palabras, citas, encabezados y orden se mantengan TAL CUAL aparecen en el bosquejo original. NO resumas, NO inventes redacción propia, NO 'mejores' el estilo ni omitas oraciones.

Tareas:
1. En 'fullText': Extrae la transcripción ÍNTEGRA, EXACTA y VERBATIM (palabra por palabra) de todo el documento tal cual está escrito.
2. En 'sections': Identifica las divisiones o puntos reales del documento (conservando sus títulos exactos o ideas principales textuales). Para cada una provee:
   - 'title': Título o encabezado textual del punto según el documento.
   - 'estimatedMinutes': Tiempo estimado en minutos (a 135 palabras por minuto).
   - 'notes': El texto literal o ideas textuales de ese punto del documento (sin parafrasear).
   - 'keyPoints': Lista de 2 a 5 puntos o frases textuales clave del documento para que el orador los revise mientras habla.
3. En 'pages': Divide el texto íntegro en pantallas de lectura sin cambiar ninguna palabra.
4. En 'suggestedTargetSeconds': Tiempo total recomendado en segundos basado en la longitud real del documento.

Devuelve tu respuesta ÚNICAMENTE en JSON válido con esta estructura:
{
  "title": "${fileName}",
  "fullText": "Transcripción íntegra y exacta palabra por palabra del documento...",
  "suggestedTargetSeconds": 420,
  "sections": [
    {
      "id": "sec-1",
      "title": "Título textual del punto",
      "estimatedMinutes": 1.5,
      "notes": "Texto textual del documento para este punto...",
      "keyPoints": [
        "Frase o idea textual clave 1",
        "Frase o idea textual clave 2"
      ]
    }
  ],
  "pages": [
    "Pantalla 1 con texto íntegro...",
    "Pantalla 2 con texto íntegro..."
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'application/pdf',
              data: pdfBase64,
            },
          },
          { text: promptText },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    });

    const textOutput = response.text || '{}';
    let extractedData;
    try {
      extractedData = JSON.parse(textOutput);
    } catch {
      const cleaned = textOutput.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      extractedData = JSON.parse(cleaned);
    }

    return res.json({ success: true, data: extractedData });
  } catch (error: any) {
    console.error('Error extracting PDF sections with Gemini:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error al procesar el PDF con IA.',
    });
  }
});

// Endpoint to extract speech sections and key points from Word (.docx) files
app.post('/api/extract-docx-sections', async (req, res) => {
  try {
    const { docxBase64, fileName = 'Discurso_Word' } = req.body;

    if (!docxBase64) {
      return res.status(400).json({ success: false, error: 'No se recibió el archivo Word en base64.' });
    }

    const buffer = Buffer.from(docxBase64, 'base64');
    let extractedText = '';

    try {
      const mammothResult = await mammoth.extractRawText({ buffer });
      extractedText = mammothResult.value;
    } catch (mError: any) {
      console.warn('Mammoth text extraction fallback:', mError);
      extractedText = buffer.toString('utf8').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, ' ');
    }

    if (!extractedText.trim()) {
      return res.status(400).json({ success: false, error: 'No se pudo extraer texto del archivo Word.' });
    }

    // Pass the verbatim text to Gemini ONLY to extract section markers and key points,
    // explicitly instructing NEVER to alter or paraphrase the text.
    const promptText = `Lee atentamente el siguiente texto extraído directamente de un archivo Word (título: "${fileName}").
INSTRUCCIÓN CRÍTICA DE MÁXIMA PRIORIDAD:
NO MODIFIQUES EL TEXTO NI LAS IDEAS DEL AUTOR. El orador necesita que sus ideas, citas, notas y bosquejo se mantengan EXACTAMENTE como él los escribió. NO resumas, NO cambies vocabulario, NO agregues introducciones inventadas.

Texto exacto del documento:
${extractedText.slice(0, 20000)}

Tareas:
1. En 'sections': Identifica las divisiones, encabezados o puntos principales tal como están en el texto original.
   - 'title': Encabezado o título textual del punto.
   - 'estimatedMinutes': Tiempo en minutos a 135 palabras por minuto.
   - 'notes': Texto textual correspondiente a ese punto (sin resumir).
   - 'keyPoints': 2 a 5 frases textuales clave tomadas directamente del documento.
2. En 'suggestedTargetSeconds': Tiempo total recomendado en segundos según el conteo de palabras del texto.

Devuelve tu respuesta ÚNICAMENTE en JSON válido con esta estructura:
{
  "title": "${fileName}",
  "suggestedTargetSeconds": 420,
  "sections": [
    {
      "id": "sec-1",
      "title": "Encabezado textual 1",
      "estimatedMinutes": 1.5,
      "notes": "Texto textual del documento...",
      "keyPoints": [
        "Punto textual 1",
        "Punto textual 2"
      ]
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: promptText,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    });

    const textOutput = response.text || '{}';
    let extractedData;
    try {
      extractedData = JSON.parse(textOutput);
    } catch {
      const cleaned = textOutput.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      extractedData = JSON.parse(cleaned);
    }

    // Always guarantee that fullText is the exact, uncompromised rawText from mammoth
    return res.json({
      success: true,
      data: {
        ...extractedData,
        fullText: extractedText,
      },
      rawText: extractedText,
    });
  } catch (error: any) {
    console.error('Error extracting Word sections with Gemini:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error al procesar el archivo Word con IA.',
    });
  }
});

// Setup Vite development middlewares or serve static build in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`OratoriaPro server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
