import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';

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
    } = req.body;

    const delta = actualSeconds - targetSeconds;
    const isOvertime = delta > 0;
    const timeSummary = `Tiempo objetivo: ${Math.floor(targetSeconds / 60)}m ${targetSeconds % 60}s. Tiempo logrado: ${Math.floor(actualSeconds / 60)}m ${actualSeconds % 60}s (${isOvertime ? `Excedido por +${delta}s` : `Completado con ${Math.abs(delta)}s de anticipación`}).`;

    const promptText = `
Eres un entrenador y juez experto en oratoria, elocuencia y comunicación pública (estilo Toastmasters, TED, y conferencias magistrales).
El orador acaba de ensayar su discurso titulado: "${speechTitle || 'Discurso de Oratoria'}".
Métricas de tiempo registradas:
${timeSummary}

${referenceSourceText ? `\n--- FUENTE DE CONSULTA / BOSQUEJO UTILIZADO ---\n${referenceSourceText.slice(0, 8000)}\n----------------------------------------\n` : ''}
${userNotes ? `\nAutoevaluación previa del orador: "${userNotes}"\n` : ''}

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
    "Consejo 1 práctico y específico para aplicar en el siguiente intento",
    "Consejo 2 práctico y específico",
    "Consejo 3 práctico y específico"
  ],
  "recommendedExercise": "Un ejercicio vocal o de respiración recomendado para su próxima práctica (ej: lectura con lápiz, práctica de pausas de 2 segundos, etc.)"
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

    const promptText = `Lee este documento PDF adjunto y prepáralo como material de ensayo de oratoria para un orador.
1. Extrae y organiza el contenido en secciones claras de oratoria (ej: Introducción, Puntos principales, Anécdotas/Citas, Conclusión).
2. Para cada sección provee un título elocuente, el tiempo estimado sugerido en minutos (a una velocidad oratoria típica de 135 palabras por minuto), y los puntos clave en 'notes'.
3. Extrae el texto completo continuo en 'fullText' para teleprómpter.
4. Divide el texto en pantallas de lectura para el visor de atril en el array 'pages' (cada página con 1 a 3 párrafos legibles a distancia).
5. Calcula 'suggestedTargetSeconds' (total de segundos recomendados para este discurso).

Devuelve tu respuesta ÚNICAMENTE en JSON válido con esta estructura:
{
  "title": "${fileName}",
  "fullText": "Texto completo del documento...",
  "suggestedTargetSeconds": 420,
  "sections": [
    {
      "id": "sec-1",
      "title": "1. Introducción y Apertura",
      "estimatedMinutes": 1.5,
      "notes": "Puntos esenciales a transmitir en la apertura..."
    }
  ],
  "pages": [
    "Contenido de la primera pantalla de lectura...",
    "Contenido de la segunda pantalla de lectura..."
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
        temperature: 0.2,
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
