import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { SpeechDraft, SourceDocument, RehearsalRecord } from '../types';

export interface CloudSpeechData {
  id: string;
  userId: string;
  title: string;
  category?: string;
  targetMinutes?: number;
  speechNotes?: string;
  sections?: Array<{
    id: string;
    title: string;
    notes: string;
    estimatedMinutes?: number;
    keyPoints?: string[];
  }>;
  sourceFileName?: string;
  sourceFileType?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CloudRehearsalData {
  id: string;
  userId: string;
  speechId?: string;
  speechTitle?: string;
  durationSeconds: number;
  targetSeconds?: number;
  evaluation?: string;
  createdAt?: string;
}

// Save or sync user profile
export async function syncUserProfile(user: {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}) {
  const userPath = `users/${user.uid}`;
  try {
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(
      userDocRef,
      {
        displayName: user.displayName || 'Orador',
        email: user.email || '',
        photoURL: user.photoURL || '',
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, userPath);
  }
}

// Save speech outline / bosquejo to Firestore
export async function saveSpeechOutline(
  userId: string,
  speech: SpeechDraft,
  sourceDoc?: SourceDocument
): Promise<void> {
  const speechPath = `speeches/${speech.id}`;
  try {
    const docRef = doc(db, 'speeches', speech.id);
    const payload: Record<string, unknown> = {
      userId,
      title: speech.title.slice(0, 200) || 'Bosquejo sin título',
      category: (speech.topic || 'General').slice(0, 60),
      targetMinutes: Number((speech.targetSeconds / 60).toFixed(1)),
      speechNotes: (speech.fullText || '').slice(0, 50000),
      sections: (speech.sections || []).map((sec) => ({
        id: sec.id,
        title: (sec.title || '').slice(0, 150),
        notes: (sec.notes || '').slice(0, 5000),
        estimatedMinutes: sec.estimatedMinutes || 1,
        keyPoints: (sec.keyPoints || []).map((kp) => kp.slice(0, 200)),
      })),
      sourceFileName: sourceDoc?.title?.slice(0, 255) || 'manual',
      sourceFileType: sourceDoc?.type?.slice(0, 50) || 'outline',
      updatedAt: new Date().toISOString(),
      createdAt: new Date(speech.lastEdited || Date.now()).toISOString(),
    };

    await setDoc(docRef, payload, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, speechPath);
  }
}

// Delete speech from Firestore
export async function deleteSpeechOutline(speechId: string): Promise<void> {
  const speechPath = `speeches/${speechId}`;
  try {
    const docRef = doc(db, 'speeches', speechId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, speechPath);
  }
}

// Subscribe to real-time speech outlines for current user
export function subscribeToUserSpeeches(
  userId: string,
  onUpdate: (speeches: SpeechDraft[], sourceDocs: SourceDocument[]) => void
): Unsubscribe {
  const speechesCollection = collection(db, 'speeches');
  const q = query(speechesCollection, where('userId', '==', userId));

  return onSnapshot(
    q,
    (snapshot) => {
      const parsedDrafts: SpeechDraft[] = [];
      const parsedDocs: SourceDocument[] = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const speechDraft: SpeechDraft = {
          id: docSnap.id,
          title: data.title || 'Bosquejo guardado',
          topic: data.category || 'General',
          targetSeconds: Math.round((data.targetMinutes || 5) * 60),
          sections: (data.sections || []).map((s: any, idx: number) => ({
            id: s.id || `sec-${idx}`,
            title: s.title || `Sección ${idx + 1}`,
            estimatedMinutes: s.estimatedMinutes || 1,
            notes: s.notes || '',
            keyPoints: s.keyPoints || [],
          })),
          fullText: data.speechNotes || '',
          lastEdited: data.updatedAt ? new Date(data.updatedAt).getTime() : Date.now(),
        };
        parsedDrafts.push(speechDraft);

        // Also create or sync corresponding source document for the Dark Reader
        parsedDocs.push({
          id: `doc-${docSnap.id}`,
          title: data.sourceFileName || data.title,
          type: (data.sourceFileType as any) || 'outline',
          content: data.speechNotes || '',
          currentPage: 1,
          totalPages: 1,
          theme: 'dark',
          fontSize: 18,
          lineHeight: 1.7,
        });
      });

      onUpdate(parsedDrafts, parsedDocs);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'speeches');
    }
  );
}

// Save rehearsal log to Firestore
export async function saveRehearsalLog(userId: string, record: RehearsalRecord): Promise<void> {
  const rehearsalPath = `rehearsals/${record.id}`;
  try {
    const docRef = doc(db, 'rehearsals', record.id);
    const payload: Record<string, unknown> = {
      userId,
      durationSeconds: record.actualSeconds,
      targetSeconds: record.targetSeconds,
      speechId: record.speechId || 'custom',
      speechTitle: (record.speechTitle || 'Ensayo general').slice(0, 200),
      evaluation: record.aiAnalysis ? JSON.stringify(record.aiAnalysis).slice(0, 20000) : '',
      createdAt: new Date(record.timestamp).toISOString(),
    };
    await setDoc(docRef, payload, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, rehearsalPath);
  }
}

// Subscribe to real-time rehearsals for user
export function subscribeToUserRehearsals(
  userId: string,
  onUpdate: (rehearsals: RehearsalRecord[]) => void
): Unsubscribe {
  const rehearsalsCol = collection(db, 'rehearsals');
  const q = query(rehearsalsCol, where('userId', '==', userId));

  return onSnapshot(
    q,
    (snapshot) => {
      const records: RehearsalRecord[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        let parsedAi = undefined;
        if (d.evaluation) {
          try {
            parsedAi = JSON.parse(d.evaluation);
          } catch {
            // ignore
          }
        }
        records.push({
          id: docSnap.id,
          speechId: d.speechId,
          speechTitle: d.speechTitle || 'Ensayo',
          timestamp: d.createdAt ? new Date(d.createdAt).getTime() : Date.now(),
          targetSeconds: d.targetSeconds || 300,
          actualSeconds: d.durationSeconds || 0,
          isOvertime: (d.durationSeconds || 0) > (d.targetSeconds || 300),
          overtimeSeconds: Math.max(0, (d.durationSeconds || 0) - (d.targetSeconds || 300)),
          aiAnalysis: parsedAi,
        });
      });
      onUpdate(records);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'rehearsals');
    }
  );
}
