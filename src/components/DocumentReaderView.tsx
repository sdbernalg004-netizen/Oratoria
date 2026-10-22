import React, { useState, useRef, useEffect } from 'react';
import { SourceDocument, SpeechSection, SpeechDraft } from '../types';
import {
  Upload,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  FileText,
  Plus,
  Trash2,
  CheckCircle,
  Edit3,
  Check,
  X,
  ScrollText,
  Layers,
  FileSearch,
  ListOrdered,
  Clock,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

interface ExtractedPDFData {
  title: string;
  fullText: string;
  suggestedTargetSeconds?: number;
  sections?: SpeechSection[];
  pages?: string[];
}

interface DocumentReaderViewProps {
  documents: SourceDocument[];
  currentDocId: string;
  onSelectDocument: (id: string) => void;
  onAddDocument: (doc: SourceDocument) => void;
  onUpdateDocument: (doc: SourceDocument) => void;
  onDeleteDocument: (id: string) => void;
  onUploadFile?: (file: File) => void;
  isProcessingFile?: boolean;
  onGoToSplitView?: () => void;
  onPDFExtracted?: (extracted: ExtractedPDFData, pdfUrl?: string) => void;
  currentSpeech?: SpeechDraft;
  onUpdateSpeech?: (speech: SpeechDraft) => void;
}

// Utility to split raw text into clean verbatim pages without altering or summarizing any words
function splitTextIntoVerbatimPages(rawText: string, maxCharsPerPage: number = 900): string[] {
  if (!rawText || !rawText.trim()) return [''];
  const paragraphs = rawText.split('\n\n');
  const pages: string[] = [];
  let currentPage = '';

  for (const para of paragraphs) {
    if ((currentPage + '\n\n' + para).length > maxCharsPerPage && currentPage.trim().length > 0) {
      pages.push(currentPage.trim());
      currentPage = para;
    } else {
      currentPage = currentPage ? `${currentPage}\n\n${para}` : para;
    }
  }
  if (currentPage.trim().length > 0) {
    pages.push(currentPage.trim());
  }
  return pages.length > 0 ? pages : [rawText];
}

export const DocumentReaderView: React.FC<DocumentReaderViewProps> = ({
  documents,
  currentDocId,
  onSelectDocument,
  onAddDocument,
  onUpdateDocument,
  onDeleteDocument,
  onUploadFile,
  isProcessingFile = false,
  onGoToSplitView,
  onPDFExtracted,
  currentSpeech,
  onUpdateSpeech,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [localProcessing, setLocalProcessing] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocContent, setNewDocContent] = useState('');

  // Reader mode: 'continuous' (all text in smooth scroll) vs 'paginated' (by screens) vs 'sections' (structured speech points)
  const [readingMode, setReadingMode] = useState<'continuous' | 'paginated' | 'sections'>('continuous');
  const [checkedPoints, setCheckedPoints] = useState<Record<string, boolean>>({});

  const toggleCheckPoint = (key: string) => {
    setCheckedPoints((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // For PDF: toggle between 'text' (dark verbatim reader) and 'pdf-embed' (original PDF viewer)
  const [pdfDisplayMode, setPdfDisplayMode] = useState<'text' | 'pdf-embed'>('text');

  // In-place direct text editor mode so the user can keep 100% control of their outline
  const [isEditingText, setIsEditingText] = useState(false);
  const [editedTextContent, setEditedTextContent] = useState('');

  const currentDoc =
    documents.find((d) => d.id === currentDocId) || documents[0];

  useEffect(() => {
    if (currentDoc) {
      setEditedTextContent(currentDoc.content || '');
      setIsEditingText(false);
    }
  }, [currentDoc?.id]);

  // Theme palettes - Dark is the default
  const themes = {
    dark: {
      bg: '#0c0c0e',
      text: '#f4f4f5',
      border: '#27272a',
      headerBg: '#141417',
      headerText: '#a1a1aa',
      footerBg: '#141417',
    },
    'warm-cream': {
      bg: '#FBF6EE',
      text: '#1e293b',
      border: '#e2d9cc',
      headerBg: '#f2ece0',
      headerText: '#475569',
      footerBg: '#f2ece0',
    },
    sepia: {
      bg: '#f4ecd8',
      text: '#292524',
      border: '#ded5be',
      headerBg: '#eae1cb',
      headerText: '#57534e',
      footerBg: '#eae1cb',
    },
    white: {
      bg: '#ffffff',
      text: '#0f172a',
      border: '#e2e8f0',
      headerBg: '#f8fafc',
      headerText: '#64748b',
      footerBg: '#f8fafc',
    },
  };

  const currentTheme = themes[currentDoc?.theme || 'dark'];

  // Handle saving direct text edits
  const handleSaveDirectEdit = () => {
    if (!currentDoc) return;
    const verbatimPages = splitTextIntoVerbatimPages(editedTextContent);
    const updated: SourceDocument = {
      ...currentDoc,
      content: editedTextContent,
      pages: verbatimPages,
      currentPage: 1,
      totalPages: Math.max(1, verbatimPages.length),
    };
    onUpdateDocument(updated);
    setIsEditingText(false);
    setSuccessBanner('¡Texto del bosquejo actualizado exactamente como lo escribiste!');
  };

  // Handle uploading files (PDF or text/markdown/Word)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (onUploadFile) {
      onUploadFile(file);
      e.target.value = '';
      return;
    }

    const fileName = file.name.replace(/\.[^/.]+$/, '');
    setLocalProcessing(true);
    setSuccessBanner(null);

    try {
      if (file.type === 'application/pdf') {
        const pdfUrl = URL.createObjectURL(file);

        // Convert to base64
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            const dataUrl = reader.result as string;
            const base64 = dataUrl.split(',')[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const pdfBase64 = await base64Promise;

        // Call backend Gemini endpoint
        const res = await fetch('/api/extract-pdf-sections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pdfBase64, fileName }),
        });

        const resData = await res.json();
        let extractedData: ExtractedPDFData = {
          title: fileName,
          fullText: '',
          pages: [],
          sections: [],
          suggestedTargetSeconds: 420,
        };

        if (resData.success && resData.data) {
          extractedData = resData.data;
        }

        const verbatimPages = splitTextIntoVerbatimPages(extractedData.fullText || '');

        const newDoc: SourceDocument = {
          id: `doc_pdf_${Date.now()}`,
          title: extractedData.title || fileName,
          type: 'pdf',
          content: extractedData.fullText || '',
          pdfUrl,
          pages: verbatimPages,
          currentPage: 1,
          totalPages: Math.max(1, verbatimPages.length),
          theme: 'dark',
          fontSize: 20,
          lineHeight: 1.6,
        };

        onAddDocument(newDoc);

        if (onPDFExtracted) {
          onPDFExtracted(extractedData, pdfUrl);
        }

        setSuccessBanner(`¡PDF cargado con texto íntegro! Se preservaron todas las palabras e ideas originales.`);
      } else {
        // Text / markdown file
        const textReader = new FileReader();
        textReader.onload = (event) => {
          const text = (event.target?.result as string) || '';
          const verbatimPages = splitTextIntoVerbatimPages(text);

          const newDoc: SourceDocument = {
            id: `doc_text_${Date.now()}`,
            title: fileName,
            type: 'text',
            content: text,
            pages: verbatimPages,
            currentPage: 1,
            totalPages: Math.max(1, verbatimPages.length),
            theme: 'dark',
            fontSize: 22,
            lineHeight: 1.7,
          };

          onAddDocument(newDoc);
          setSuccessBanner(`¡Bosquejo cargado con texto íntegro!`);
        };
        textReader.readAsText(file);
      }
    } catch (err: any) {
      console.error('Error uploading file in reader:', err);
    } finally {
      setLocalProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handlePrevPage = () => {
    if (currentDoc && currentDoc.currentPage > 1) {
      onUpdateDocument({
        ...currentDoc,
        currentPage: currentDoc.currentPage - 1,
      });
    }
  };

  const handleNextPage = () => {
    if (currentDoc && currentDoc.currentPage < currentDoc.totalPages) {
      onUpdateDocument({
        ...currentDoc,
        currentPage: currentDoc.currentPage + 1,
      });
    }
  };

  const handleCreateTextDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocTitle.trim() || !newDocContent.trim()) return;

    const verbatimPages = splitTextIntoVerbatimPages(newDocContent);

    const paragraphs = newDocContent.split('\n\n').filter(Boolean);
    const sections: SpeechSection[] = paragraphs.slice(0, 5).map((para, i) => ({
      id: `sec-${i + 1}`,
      title: i === 0 ? '1. Introducción' : i === paragraphs.length - 1 ? `${i + 1}. Conclusión` : `Punto ${i + 1}`,
      estimatedMinutes: 1.5,
      notes: para.slice(0, 300),
    }));

    const extractedData: ExtractedPDFData = {
      title: newDocTitle.trim(),
      fullText: newDocContent,
      pages: verbatimPages,
      sections,
      suggestedTargetSeconds: Math.max(120, Math.round((newDocContent.split(/\s+/).length / 135) * 60)),
    };

    const newDoc: SourceDocument = {
      id: `doc_custom_${Date.now()}`,
      title: newDocTitle.trim(),
      type: 'outline',
      content: newDocContent,
      pages: verbatimPages,
      currentPage: 1,
      totalPages: Math.max(1, verbatimPages.length),
      theme: 'dark',
      fontSize: 22,
      lineHeight: 1.7,
    };

    onAddDocument(newDoc);
    if (onPDFExtracted) {
      onPDFExtracted(extractedData);
    }

    setNewDocTitle('');
    setNewDocContent('');
    setShowUploadModal(false);
    setSuccessBanner('¡Bosquejo creado con texto íntegro sin alteraciones!');
  };

  // Get current page content
  const pageIndex = (currentDoc?.currentPage || 1) - 1;
  const currentPageText =
    currentDoc?.pages && currentDoc.pages[pageIndex]
      ? currentDoc.pages[pageIndex]
      : currentDoc?.content || '';

  const isPdf = currentDoc?.type === 'pdf';

  return (
    <div
      className="flex flex-col h-full rounded-2xl shadow-xl overflow-hidden relative border transition-colors duration-200"
      style={{
        backgroundColor: currentTheme.bg,
        borderColor: currentTheme.border,
        color: currentTheme.text,
      }}
    >
      {/* Top Document Bar */}
      <div
        className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 py-2.5 border-b text-xs select-none"
        style={{
          backgroundColor: currentTheme.headerBg,
          borderColor: currentTheme.border,
          color: currentTheme.headerText,
        }}
      >
        {/* Document Selector & Title */}
        <div className="flex items-center gap-2.5">
          <BookOpen className="w-4 h-4 text-blue-500 shrink-0" />
          <select
            value={currentDoc?.id}
            onChange={(e) => onSelectDocument(e.target.value)}
            className="font-semibold bg-transparent text-sm cursor-pointer focus:outline-none max-w-[200px] sm:max-w-[280px] truncate"
            style={{ color: currentTheme.text }}
          >
            {documents.map((d) => (
              <option key={d.id} value={d.id} className="text-white bg-neutral-900">
                {d.title}
              </option>
            ))}
          </select>
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-medium">
            Texto Íntegro
          </span>
        </div>

        {/* Center / Right controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Mode Switcher: Continuous vs Paginated vs Secciones */}
          <div className="flex items-center bg-white/5 rounded-lg p-0.5 border border-white/10 text-[11px]">
            <button
              onClick={() => setReadingMode('continuous')}
              className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                readingMode === 'continuous'
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="Ver todo el bosquejo en desplazamiento continuo"
            >
              <ScrollText className="w-3 h-3" />
              <span className="hidden sm:inline">Continuo</span>
            </button>
            <button
              onClick={() => setReadingMode('paginated')}
              className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                readingMode === 'paginated'
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="Ver por pantallas paginadas"
            >
              <Layers className="w-3 h-3" />
              <span className="hidden sm:inline">Paginado</span>
            </button>
            <button
              onClick={() => setReadingMode('sections')}
              className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                readingMode === 'sections'
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="Ver el bosquejo dividido en secciones y puntos clave de oratoria"
            >
              <ListOrdered className="w-3 h-3" />
              <span className="hidden sm:inline">Secciones</span>
            </button>
          </div>

          {/* If PDF, option to view original PDF document or text */}
          {isPdf && currentDoc.pdfUrl && (
            <div className="flex items-center bg-white/5 rounded-lg p-0.5 border border-white/10 text-[11px]">
              <button
                onClick={() => setPdfDisplayMode('text')}
                className={`px-2 py-1 rounded transition-colors ${
                  pdfDisplayMode === 'text'
                    ? 'bg-neutral-800 text-white font-medium'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="Lectura en modo texto oscuro"
              >
                Texto
              </button>
              <button
                onClick={() => setPdfDisplayMode('pdf-embed')}
                className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                  pdfDisplayMode === 'pdf-embed'
                    ? 'bg-neutral-800 text-white font-medium'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="Visor PDF original con formato exacto"
              >
                <FileSearch className="w-3 h-3" />
                <span>PDF Original</span>
              </button>
            </div>
          )}

          {/* Edit Outline Text Button */}
          {!isEditingText ? (
            <button
              onClick={() => {
                setEditedTextContent(currentDoc?.content || '');
                setIsEditingText(true);
              }}
              className="flex items-center gap-1 px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-medium border border-neutral-700 transition-colors"
              title="Editar o ajustar el texto directamente tal cual lo necesitas"
            >
              <Edit3 className="w-3 h-3 text-blue-400" />
              <span className="hidden sm:inline">Editar Bosquejo</span>
            </button>
          ) : (
            <div className="flex items-center gap-1">
              <button
                onClick={handleSaveDirectEdit}
                className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
              >
                <Check className="w-3 h-3" />
                <span>Guardar</span>
              </button>
              <button
                onClick={() => setIsEditingText(false)}
                className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                title="Cancelar edición"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Font Size Adjuster */}
          <div className="flex items-center gap-1 bg-white/5 rounded-lg px-2 py-1">
            <button
              onClick={() =>
                currentDoc &&
                onUpdateDocument({
                  ...currentDoc,
                  fontSize: Math.max(16, currentDoc.fontSize - 2),
                })
              }
              className="px-1 text-xs font-bold opacity-80 hover:opacity-100"
              title="Reducir fuente"
            >
              A-
            </button>
            <span className="text-[11px] font-mono px-1">
              {currentDoc?.fontSize || 22}px
            </span>
            <button
              onClick={() =>
                currentDoc &&
                onUpdateDocument({
                  ...currentDoc,
                  fontSize: Math.min(36, currentDoc.fontSize + 2),
                })
              }
              className="px-1 text-xs font-bold opacity-80 hover:opacity-100"
              title="Aumentar fuente"
            >
              A+
            </button>
          </div>

          {/* Theme Palette Dots */}
          <div className="hidden sm:flex items-center gap-1.5 bg-white/5 rounded-lg p-1">
            <button
              onClick={() =>
                currentDoc && onUpdateDocument({ ...currentDoc, theme: 'dark' })
              }
              className={`w-5 h-5 rounded-md border ${
                currentDoc?.theme === 'dark' ? 'ring-2 ring-blue-500' : ''
              }`}
              style={{ backgroundColor: '#0c0c0e', borderColor: '#27272a' }}
              title="Fondo Oscuro Profesional"
            />
            <button
              onClick={() =>
                currentDoc && onUpdateDocument({ ...currentDoc, theme: 'warm-cream' })
              }
              className={`w-5 h-5 rounded-md border ${
                currentDoc?.theme === 'warm-cream' ? 'ring-2 ring-blue-500' : ''
              }`}
              style={{ backgroundColor: '#FBF6EE', borderColor: '#e2d9cc' }}
              title="Crema Cálido"
            />
            <button
              onClick={() =>
                currentDoc && onUpdateDocument({ ...currentDoc, theme: 'sepia' })
              }
              className={`w-5 h-5 rounded-md border ${
                currentDoc?.theme === 'sepia' ? 'ring-2 ring-blue-500' : ''
              }`}
              style={{ backgroundColor: '#f4ecd8', borderColor: '#ded5be' }}
              title="Sepia"
            />
            <button
              onClick={() =>
                currentDoc && onUpdateDocument({ ...currentDoc, theme: 'white' })
              }
              className={`w-5 h-5 rounded-md border ${
                currentDoc?.theme === 'white' ? 'ring-2 ring-blue-500' : ''
              }`}
              style={{ backgroundColor: '#FFFFFF', borderColor: '#e2e8f0' }}
              title="Fondo Blanco"
            />
          </div>

          {/* Upload Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessingFile || localProcessing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition-colors shadow-sm disabled:opacity-50"
          >
            {isProcessingFile || localProcessing ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Cargando...</span>
              </>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5" />
                <span>Subir Archivo</span>
              </>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.doc,.txt,.md"
            onChange={handleFileUpload}
            className="hidden"
          />

          <button
            onClick={() => setShowUploadModal(true)}
            className="p-1.5 rounded-lg hover:bg-white/10 opacity-80 hover:opacity-100"
            title="Pegar o escribir nuevo bosquejo"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successBanner && (
        <div className="flex items-center justify-between px-5 py-2 bg-blue-950/80 border-b border-blue-800/60 text-xs text-blue-200 animate-fade-in z-20">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successBanner}</span>
          </div>
          <button
            onClick={() => setSuccessBanner(null)}
            className="text-neutral-400 hover:text-white text-xs ml-3"
          >
            Entendido
          </button>
        </div>
      )}

      {/* Main Reading Canvas */}
      <div className="flex-1 relative overflow-y-auto custom-scrollbar p-5 sm:p-8 flex flex-col items-center">
        {/* If in edit mode: Direct In-Place Editor */}
        {isEditingText ? (
          <div className="w-full max-w-3xl flex flex-col flex-1 h-full min-h-[420px]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-neutral-300">
                Edita o pega el texto exacto de tu bosquejo:
              </span>
              <span className="text-[11px] text-neutral-400">
                Tus palabras se mantendrán intactas
              </span>
            </div>
            <textarea
              value={editedTextContent}
              onChange={(e) => setEditedTextContent(e.target.value)}
              className="flex-1 w-full p-4 rounded-xl bg-neutral-900 border border-neutral-700 text-white font-sans text-sm sm:text-base leading-relaxed focus:outline-none focus:border-blue-500 resize-none min-h-[380px]"
              placeholder="Escribe o pega aquí el texto tal cual tu bosquejo..."
            />
            <div className="flex items-center justify-end gap-3 mt-3">
              <button
                onClick={() => setIsEditingText(false)}
                className="px-4 py-2 text-xs text-neutral-400 hover:text-white bg-neutral-800 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveDirectEdit}
                className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow"
              >
                Guardar Texto Íntegro
              </button>
            </div>
          </div>
        ) : isPdf && pdfDisplayMode === 'pdf-embed' && currentDoc?.pdfUrl ? (
          /* Visor PDF original con formato intacto */
          <div className="w-full h-full min-h-[520px] max-w-4xl rounded-xl overflow-hidden shadow-sm border border-neutral-800 bg-neutral-900">
            <iframe
              src={currentDoc.pdfUrl}
              className="w-full h-full min-h-[550px] border-0"
              title={currentDoc.title}
            />
          </div>
        ) : readingMode === 'continuous' ? (
          /* Modo Desplazamiento Continuo: Muestra todo el bosquejo tal cual con párrafos fieles */
          <article
            className="w-full max-w-3xl py-4 px-4 sm:px-8 leading-relaxed font-sans select-text text-left"
            style={{
              fontSize: `${currentDoc?.fontSize || 22}px`,
              lineHeight: currentDoc?.lineHeight || 1.7,
            }}
          >
            {(currentDoc?.content || '').split('\n\n').map((para, idx) => (
              <p key={idx} className="mb-6 whitespace-pre-wrap">
                {para}
              </p>
            ))}
          </article>
        ) : readingMode === 'sections' ? (
          /* Modo Secciones: Visualiza las divisiones, notas y puntos clave interactivos */
          <div className="w-full max-w-3xl py-4 space-y-4 text-left">
            {/* Header notification with privacy & fidelity reassurance */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-900/80 border border-neutral-800 text-xs">
              <div className="flex items-center gap-2 text-neutral-300">
                <ListOrdered className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="font-semibold text-white">
                  Secciones del Bosquejo ({((currentSpeech?.sections && currentSpeech.sections.length > 0 ? currentSpeech.sections : currentDoc?.sections) || []).length})
                </span>
                <span className="text-neutral-500 hidden sm:inline">· Puntos clave para el orador</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-800/40">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Uso personal protegido</span>
              </div>
            </div>

            {((currentSpeech?.sections && currentSpeech.sections.length > 0 ? currentSpeech.sections : currentDoc?.sections) || []).length > 0 ? (
              <div className="space-y-4">
                {((currentSpeech?.sections && currentSpeech.sections.length > 0 ? currentSpeech.sections : currentDoc?.sections) || []).map((sec, idx) => (
                  <div
                    key={sec.id || idx}
                    className="p-5 rounded-2xl border transition-all shadow-md bg-neutral-900/70 border-neutral-800/90 hover:border-neutral-700/80"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-neutral-800">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center text-xs font-bold font-mono">
                          {idx + 1}
                        </span>
                        <h4 className="font-bold text-white text-base">
                          {sec.title}
                        </h4>
                      </div>

                      {sec.estimatedMinutes && (
                        <div className="flex items-center gap-1 text-xs text-neutral-400 bg-neutral-950 px-2.5 py-1 rounded-lg border border-neutral-800 font-mono">
                          <Clock className="w-3 h-3 text-amber-400" />
                          <span>~{sec.estimatedMinutes} min</span>
                        </div>
                      )}
                    </div>

                    {/* Section Notes / Text */}
                    {sec.notes && (
                      <div
                        className="text-neutral-300 leading-relaxed font-sans whitespace-pre-wrap mb-4"
                        style={{ fontSize: `${Math.max(16, (currentDoc?.fontSize || 20) - 2)}px` }}
                      >
                        {sec.notes}
                      </div>
                    )}

                    {/* Key points checklist */}
                    {sec.keyPoints && sec.keyPoints.length > 0 && (
                      <div className="p-3.5 rounded-xl bg-neutral-950/60 border border-neutral-800/80 space-y-2 mt-3">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 block">
                          Puntos Clave a enfatizar:
                        </span>
                        <div className="space-y-1.5">
                          {sec.keyPoints.map((kp, kpIdx) => {
                            const pointId = `${sec.id}-kp-${kpIdx}`;
                            const isChecked = !!checkedPoints[pointId];
                            return (
                              <button
                                key={kpIdx}
                                onClick={() => toggleCheckPoint(pointId)}
                                className={`w-full flex items-start gap-2.5 p-2 rounded-lg text-left transition-colors text-xs ${
                                  isChecked
                                    ? 'bg-emerald-950/30 text-emerald-300 border border-emerald-800/30'
                                    : 'hover:bg-neutral-800/60 text-neutral-300'
                                }`}
                              >
                                <div
                                  className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center border transition-colors shrink-0 ${
                                    isChecked
                                      ? 'bg-emerald-600 border-emerald-500 text-white'
                                      : 'border-neutral-600 bg-neutral-900'
                                  }`}
                                >
                                  {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                                </div>
                                <span className={isChecked ? 'line-through opacity-75' : ''}>{kp}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-neutral-900/50 rounded-2xl border border-neutral-800 space-y-3">
                <FileText className="w-8 h-8 text-neutral-500 mx-auto" />
                <p className="text-sm font-semibold text-white">No se detectaron secciones divididas aún</p>
                <p className="text-xs text-neutral-400 max-w-md mx-auto">
                  Puedes leer el texto en modo <strong>Continuo</strong> o subir un archivo PDF o Word para recargar secciones automáticas.
                </p>
                <button
                  onClick={() => setReadingMode('continuous')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-colors shadow"
                >
                  Cambiar a Modo Continuo
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Modo Paginado con flechas */
          <>
            <button
              onClick={handlePrevPage}
              disabled={!currentDoc || currentDoc.currentPage <= 1}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/5 hover:bg-white/15 transition-all disabled:opacity-20 disabled:cursor-not-allowed shadow-sm z-10"
              title="Página anterior"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              onClick={handleNextPage}
              disabled={!currentDoc || currentDoc.currentPage >= currentDoc.totalPages}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/5 hover:bg-white/15 transition-all disabled:opacity-20 disabled:cursor-not-allowed shadow-sm z-10"
              title="Página siguiente"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            <article
              className="w-full max-w-3xl py-4 px-6 sm:px-12 leading-relaxed font-sans select-text text-left"
              style={{
                fontSize: `${currentDoc?.fontSize || 22}px`,
                lineHeight: currentDoc?.lineHeight || 1.7,
              }}
            >
              {currentPageText.split('\n\n').map((para, idx) => (
                <p key={idx} className="mb-6 whitespace-pre-wrap">
                  {para}
                </p>
              ))}
            </article>
          </>
        )}
      </div>

      {/* Bottom Pagination / Status Bar */}
      <footer
        className="flex items-center justify-between px-6 py-2.5 border-t text-xs select-none"
        style={{
          backgroundColor: currentTheme.footerBg,
          borderColor: currentTheme.border,
          color: currentTheme.headerText,
        }}
      >
        <span className="text-[11px] opacity-80 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Texto textual del bosquejo original</span>
        </span>

        {/* Pagination controls (active in paginated mode) */}
        {readingMode === 'paginated' && (
          <div className="flex items-center gap-2 font-medium">
            <button
              onClick={handlePrevPage}
              disabled={!currentDoc || currentDoc.currentPage <= 1}
              className="p-1 hover:opacity-100 disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span>
              Pantalla {currentDoc?.currentPage || 1} de {currentDoc?.totalPages || 1}
            </span>
            <button
              onClick={handleNextPage}
              disabled={!currentDoc || currentDoc.currentPage >= currentDoc.totalPages}
              className="p-1 hover:opacity-100 disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
          {documents.length > 1 && (
            <button
              onClick={() => currentDoc && onDeleteDocument(currentDoc.id)}
              className="p-1 text-red-400 hover:text-red-300 opacity-80 hover:opacity-100 transition-opacity"
              title="Eliminar este documento"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </footer>

      {/* Upload or Create Outline Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl text-white">
            <h3 className="text-base font-bold mb-1">
              Agregar Bosquejo o Fuente de Consulta
            </h3>
            <p className="text-xs text-neutral-400 mb-4">
              Pega el texto de tu discurso tal cual lo preparaste. Se conservarán exactamente todas tus palabras e ideas.
            </p>

            <form onSubmit={handleCreateTextDoc} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Título del Documento o Bosquejo
                </label>
                <input
                  type="text"
                  required
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  placeholder="Ej: Bosquejo de Oratoria - Sesión 1"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Contenido del Texto (Palabra por palabra)
                </label>
                <textarea
                  required
                  rows={8}
                  value={newDocContent}
                  onChange={(e) => setNewDocContent(e.target.value)}
                  placeholder="Pega aquí los párrafos o puntos exactos..."
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 resize-none font-sans leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white bg-neutral-800 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm"
                >
                  Guardar Texto Íntegro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
