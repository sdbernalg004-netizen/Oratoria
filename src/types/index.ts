export interface TimerPreset {
  id: string;
  name: string;
  category: 'pitch' | 'toastmasters' | 'ted' | 'custom' | 'academic';
  minutes: number;
  seconds: number;
  description: string;
}

export interface SoundAlertSettings {
  enabled: boolean;
  volume: number; // 0 to 1
  halfwayAlert: boolean;
  oneMinuteAlert: boolean;
  thirtySecondsAlert: boolean;
  timeExpiredAlert: boolean;
  overtimeBeeper: boolean;
}

export interface SpeechSection {
  id: string;
  title: string;
  estimatedMinutes?: number;
  notes: string;
}

export interface SpeechDraft {
  id: string;
  title: string;
  topic: string;
  targetSeconds: number;
  sections: SpeechSection[];
  fullText: string;
  lastEdited: number;
}

export interface SourceDocument {
  id: string;
  title: string;
  type: 'text' | 'pdf' | 'outline';
  content: string; // text content or base64 / blob URL for PDF
  pdfUrl?: string;
  pages?: string[]; // for paginated text reading
  currentPage: number;
  totalPages: number;
  theme: 'warm-cream' | 'white' | 'sepia' | 'dark';
  fontSize: number; // in px
  lineHeight: number;
}

export interface AISpeechAnalysis {
  overallScore: number;
  summary: string;
  pacingAnalysis: {
    status: 'Adecuado' | 'Acelerado' | 'Lento' | 'Irregular';
    feedback: string;
  };
  dictionAndModulation: {
    score: number;
    feedback: string;
  };
  outlineCoverage: {
    score: number;
    feedback: string;
  };
  actionableTips: string[];
  recommendedExercise: string;
  analyzedAt: number;
}

export interface RehearsalRecord {
  id: string;
  speechId?: string;
  speechTitle: string;
  timestamp: number;
  targetSeconds: number;
  actualSeconds: number;
  isOvertime: boolean;
  overtimeSeconds: number;
  audioStorageKey?: string;
  audioBlobUrl?: string;
  wordCount?: number;
  estimatedWPM?: number;
  notes?: string;
  rating?: number;
  aiAnalysis?: AISpeechAnalysis;
  sourceTitle?: string;
}
