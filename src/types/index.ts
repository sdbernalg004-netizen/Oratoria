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
  overtimeBeeper: boolean; // gentle chime every 30s in overtime
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

export interface RehearsalRecord {
  id: string;
  speechId?: string;
  speechTitle: string;
  timestamp: number;
  targetSeconds: number;
  actualSeconds: number;
  isOvertime: boolean;
  overtimeSeconds: number;
  audioStorageKey?: string; // key in IndexedDB
  audioBlobUrl?: string; // transient blob url for session
  wordCount?: number;
  estimatedWPM?: number; // words per minute
  notes?: string;
  rating?: number; // 1-5 rating of self-assessment
}
