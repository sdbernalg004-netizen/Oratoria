import React, { useState, useRef } from 'react';
import { SourceDocument, SpeechSection } from '../types';
import {
  Upload,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Type,
  Sun,
  Moon,
  FileText,
  Plus,
  Trash2,
  Sparkles,
  ExternalLink,
  CheckCircle,
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
  onPDFExtracted?: (extracted: ExtractedPDFData, pdfUrl?: string) => void;
  onGoToSplitView?: () => void;
}

export const DocumentReaderView: React.FC<DocumentReaderViewProps> = ({
  documents,
  currentDocId,
  onSelectDocument,
  onAddDocument,
  onUpdateDocument,
  onDeleteDocument,
  onPDFExtracted,
  onGoToSplitView,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocContent, setNewDocContent] = useState('');

  const currentDoc =
    documents.find((d) => d.id === currentDocId) || documents[0];

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

  // Handle uploading files (PDF or text/markdown)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name.replace(/\.[^/.]+$/, '');
    setIsProcessingFile(true);
    setSuccessBanner(null);

    try {
      if (file.type === 'application/pdf') {
        const pdfUrl = URL.createObjectURL(file);

        // Convert to base64 to extract sections with Gemini
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

        // Call backend Gemini endpoint to parse PDF into sections
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

        const newDoc: SourceDocument = {
          id: `doc_pdf_${Date.now()}`,
          title: extractedData.title || fileName,
          type: 'pdf',
          content: extractedData.fullText || '',
          pdfUrl,
          pages: extractedData.pages && extractedData.pages.length > 0 ? extractedData.pages : undefined,
          currentPage: 1,
          totalPages: extractedData.pages && extractedData.pages.length > 0 ? extractedData.pages.length : 1,
          theme: 'dark', // default dark background
          fontSize: 20,
          lineHeight: 1.6,
        };

        onAddDocument(newDoc);

        // Notify parent to reload all speech sections and update Atril Dividido
        if (onPDFExtracted) {
          onPDFExtracted(extractedData, pdfUrl);
        }

        setSuccessBanner(`¡PDF cargado exitosamente! Se recargaron las secciones del discurso en el Atril Dividido.`);
      } else {
        // Text / markdown file
        const textReader = new FileReader();
        textReader.onload = (event) => {
          const text = (event.target?.result as string) || '';
          const paragraphs = text.split('\n\n').filter(Boolean);
          const pages: string[] = [];
          let cur = '';

          paragraphs.forEach((p) => {
            if (cur.length + p.length > 900) {
              pages.push(cur);
              cur = p + '\n\n';
            } else {
              cur += p + '\n\n';
            }
          });
          if (cur.trim()) pages.push(cur);

          // Build sections from paragraphs
          const sections: SpeechSection[] = paragraphs.slice(0, 5).map((para, i) => ({
            id: `sec-${i + 1}`,
            title: i === 0 ? '1. Introducción y Apertura' : i === paragraphs.length - 1 ? `${i + 1}. Conclusión y Cierre` : `Punto ${i + 1}`,
            estimatedMinutes: 1.5,
            notes: para.slice(0, 300),
          }));

          const extractedData: ExtractedPDFData = {
            title: fileName,
            fullText: text,
            pages,
            sections,
            suggestedTargetSeconds: Math.max(120, Math.round((text.split(/\s+/).length / 135) * 60)),
          };

          const newDoc: SourceDocument = {
            id: `doc_text_${Date.now()}`,
            title: fileName,
            type: 'text',
            content: text,
            pages: pages.length > 0 ? pages : [text],
            currentPage: 1,
            totalPages: Math.max(1, pages.length),
            theme: 'dark',
            fontSize: 22,
            lineHeight: 1.7,
          };

          onAddDocument(newDoc);

          if (onPDFExtracted) {
            onPDFExtracted(extractedData);
          }

          setSuccessBanner(`¡Archivo cargado! Se han actualizado las secciones del discurso en el Atril Dividido.`);
        };
        textReader.readAsText(file);
      }
    } catch (err: any) {
      console.error('Error handling file upload:', err);
    } finally {
      setIsProcessingFile(false);
      e.target.value = '';
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

    const paragraphs = newDocContent.split('\n\n').filter(Boolean);
    const pages: string[] = [];
    let cur = '';

    paragraphs.forEach((p) => {
      if (cur.length + p.length > 900) {
        pages.push(cur);
        cur = p + '\n\n';
      } else {
        cur += p + '\n\n';
      }
    });
    if (cur.trim()) pages.push(cur);

    const sections: SpeechSection[] = paragraphs.slice(0, 5).map((para, i) => ({
      id: `sec-${i + 1}`,
      title: i === 0 ? '1. Introducción y Apertura' : i === paragraphs.length - 1 ? `${i + 1}. Conclusión y Cierre` : `Punto ${i + 1}`,
      estimatedMinutes: 1.5,
      notes: para.slice(0, 300),
    }));

    const extractedData: ExtractedPDFData = {
      title: newDocTitle.trim(),
      fullText: newDocContent,
      pages,
      sections,
      suggestedTargetSeconds: Math.max(120, Math.round((newDocContent.split(/\s+/).length / 135) * 60)),
    };

    const newDoc: SourceDocument = {
      id: `doc_custom_${Date.now()}`,
      title: newDocTitle.trim(),
      type: 'outline',
      content: newDocContent,
      pages: pages.length > 0 ? pages : [newDocContent],
      currentPage: 1,
      totalPages: Math.max(1, pages.length),
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
    setSuccessBanner('¡Bosquejo creado! Se han sincronizado las secciones y el texto en el Atril Dividido.');
  };

  // Get current page content
  const pageIndex = (currentDoc?.currentPage || 1) - 1;
  const currentPageText =
    currentDoc?.pages && currentDoc.pages[pageIndex]
      ? currentDoc.pages[pageIndex]
      : currentDoc?.content || '';

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
        className="flex flex-wrap items-center justify-between gap-3 px-5 py-2.5 border-b text-xs select-none"
        style={{
          backgroundColor: currentTheme.headerBg,
          borderColor: currentTheme.border,
          color: currentTheme.headerText,
        }}
      >
        {/* Document Selector & Title */}
        <div className="flex items-center gap-3">
          <BookOpen className="w-4 h-4 text-blue-500 shrink-0" />
          <select
            value={currentDoc?.id}
            onChange={(e) => onSelectDocument(e.target.value)}
            className="font-semibold bg-transparent text-sm cursor-pointer focus:outline-none max-w-[240px] sm:max-w-[320px] truncate"
            style={{ color: currentTheme.text }}
          >
            {documents.map((d) => (
              <option key={d.id} value={d.id} className="text-white bg-neutral-900">
                {d.title}
              </option>
            ))}
          </select>
          <span className="hidden sm:inline text-[11px] opacity-75">
            - Guardado
          </span>
        </div>

        {/* Center / Right controls: Font, Theme, Upload */}
        <div className="flex items-center gap-3">
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

          {/* Theme Switcher Pills (Dark is primary) */}
          <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
            <button
              onClick={() =>
                currentDoc && onUpdateDocument({ ...currentDoc, theme: 'dark' })
              }
              className={`w-5 h-5 rounded-md border ${
                currentDoc?.theme === 'dark' || !currentDoc?.theme ? 'ring-2 ring-blue-500' : ''
              }`}
              style={{ backgroundColor: '#0c0c0e' }}
              title="Fondo Oscuro (Recomendado)"
            />
            <button
              onClick={() =>
                currentDoc && onUpdateDocument({ ...currentDoc, theme: 'warm-cream' })
              }
              className={`w-5 h-5 rounded-md border ${
                currentDoc?.theme === 'warm-cream' ? 'ring-2 ring-blue-500' : ''
              }`}
              style={{ backgroundColor: '#FBF6EE' }}
              title="Fondo Cálido / Papiro"
            />
            <button
              onClick={() =>
                currentDoc && onUpdateDocument({ ...currentDoc, theme: 'sepia' })
              }
              className={`w-5 h-5 rounded-md border ${
                currentDoc?.theme === 'sepia' ? 'ring-2 ring-blue-500' : ''
              }`}
              style={{ backgroundColor: '#F4ECD8' }}
              title="Fondo Sepia"
            />
            <button
              onClick={() =>
                currentDoc && onUpdateDocument({ ...currentDoc, theme: 'white' })
              }
              className={`w-5 h-5 rounded-md border ${
                currentDoc?.theme === 'white' ? 'ring-2 ring-blue-500' : ''
              }`}
              style={{ backgroundColor: '#FFFFFF' }}
              title="Fondo Blanco"
            />
          </div>

          {/* Upload Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessingFile}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition-colors shadow-sm disabled:opacity-50"
          >
            {isProcessingFile ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Extrayendo Secciones...</span>
              </>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5" />
                <span>Subir PDF / Bosquejo</span>
              </>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,.md"
            onChange={handleFileUpload}
            className="hidden"
          />

          <button
            onClick={() => setShowUploadModal(true)}
            className="p-1.5 rounded-lg hover:bg-white/10 opacity-80 hover:opacity-100"
            title="Crear o pegar nuevo bosquejo de texto"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Success Notification Banner when sections are reloaded */}
      {successBanner && (
        <div className="flex items-center justify-between px-5 py-2.5 bg-blue-950/80 border-b border-blue-800/60 text-xs text-blue-200 animate-fade-in z-20">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successBanner}</span>
          </div>
          {onGoToSplitView && (
            <button
              onClick={onGoToSplitView}
              className="flex items-center gap-1 font-semibold text-white hover:text-blue-300 underline underline-offset-2 ml-3 shrink-0"
            >
              <span>Abrir en Atril Dividido</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* Main Reading Canvas */}
      <div className="flex-1 relative overflow-y-auto custom-scrollbar p-6 sm:p-10 flex flex-col items-center">
        {/* Navigation Arrow Left `<` */}
        <button
          onClick={handlePrevPage}
          disabled={!currentDoc || currentDoc.currentPage <= 1}
          className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/5 hover:bg-white/15 transition-all disabled:opacity-20 disabled:cursor-not-allowed shadow-sm z-10"
          title="Página / Pantalla anterior"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Navigation Arrow Right `>` */}
        <button
          onClick={handleNextPage}
          disabled={!currentDoc || currentDoc.currentPage >= currentDoc.totalPages}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/5 hover:bg-white/15 transition-all disabled:opacity-20 disabled:cursor-not-allowed shadow-sm z-10"
          title="Página / Pantalla siguiente"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Reader Document Body */}
        {currentDoc?.type === 'pdf' && currentDoc.pdfUrl ? (
          <div className="w-full h-full min-h-[520px] max-w-4xl rounded-xl overflow-hidden shadow-sm border border-neutral-800 bg-neutral-900">
            <iframe
              src={currentDoc.pdfUrl}
              className="w-full h-full min-h-[550px] border-0"
              title={currentDoc.title}
            />
          </div>
        ) : (
          <article
            className="w-full max-w-3xl py-4 px-6 sm:px-12 leading-relaxed font-sans select-text"
            style={{
              fontSize: `${currentDoc?.fontSize || 22}px`,
              lineHeight: currentDoc?.lineHeight || 1.7,
            }}
          >
            {currentPageText.split('\n\n').map((para, idx) => (
              <p key={idx} className="mb-6 whitespace-pre-line text-justify">
                {para}
              </p>
            ))}
          </article>
        )}
      </div>

      {/* Bottom Pagination Bar */}
      <footer
        className="flex items-center justify-between px-6 py-2.5 border-t text-xs select-none"
        style={{
          backgroundColor: currentTheme.footerBg,
          borderColor: currentTheme.border,
          color: currentTheme.headerText,
        }}
      >
        <span className="text-[11px] opacity-75">
          {currentDoc?.type === 'pdf'
            ? 'Documento PDF Cargado con Secciones'
            : 'Modo Lectura Activa para Oratoria'}
        </span>

        {/* "Pantalla X de Y" display */}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl text-white">
            <h3 className="text-base font-bold mb-1">
              Agregar Fuente de Consulta o Bosquejo
            </h3>
            <p className="text-xs text-neutral-400 mb-4">
              Pega el texto de tu discurso, bosquejo de asamblea o notas para irlo
              leyendo durante el ensayo y generar automáticamente las secciones.
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
                  Contenido del Texto / Párrafos
                </label>
                <textarea
                  required
                  rows={8}
                  value={newDocContent}
                  onChange={(e) => setNewDocContent(e.target.value)}
                  placeholder="Pega aquí los párrafos o puntos clave..."
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
                  className="px-5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm"
                >
                  Guardar y Recargar Secciones
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
