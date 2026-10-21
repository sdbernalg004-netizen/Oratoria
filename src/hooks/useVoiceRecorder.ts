import { useState, useRef, useCallback, useEffect } from 'react';

export interface RecordedAudioResult {
  blob: Blob;
  url: string;
  duration: number; // in seconds
}

export function useVoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [micLevel, setMicLevel] = useState(0); // 0 to 100
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [recordedAudio, setRecordedAudio] = useState<RecordedAudioResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedDurationRef = useRef<number>(0);
  const pauseStartRef = useRef<number>(0);

  const updateMicLevel = useCallback(() => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Calculate RMS volume
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const average = sum / dataArray.length;
    // Map average (0-128 typically) to 0-100 with sensitivity curve
    const normalized = Math.min(100, Math.round((average / 60) * 100));
    setMicLevel(normalized);

    animationFrameRef.current = requestAnimationFrame(updateMicLevel);
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      setErrorMessage(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Release test tracks
      stream.getTracks().forEach((track) => track.stop());
      setHasPermission(true);
      return true;
    } catch (err: unknown) {
      console.warn('Microphone permission request error:', err);
      setHasPermission(false);
      setErrorMessage('Acceso al micrófono no concedido o no disponible en este dispositivo.');
      return false;
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setErrorMessage(null);
      audioChunksRef.current = [];
      pausedDurationRef.current = 0;

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;
      setHasPermission(true);

      // Set up AudioContext for VU meter
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      audioCtxRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.7;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Determine supported mimeType
      let mimeType = 'audio/webm';
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
          mimeType = 'audio/ogg';
        } else {
          mimeType = '';
        }
      }

      const recorderOptions: MediaRecorderOptions = mimeType ? { mimeType } : {};
      const recorder = new MediaRecorder(stream, recorderOptions);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.start(250); // Emit chunk every 250ms
      startTimeRef.current = Date.now();
      setIsRecording(true);
      setIsPaused(false);

      // Start VU meter loop
      updateMicLevel();
    } catch (err: unknown) {
      console.error('Error starting audio recording:', err);
      setHasPermission(false);
      setErrorMessage('No se pudo acceder al micrófono para la grabación del ensayo.');
    }
  }, [updateMicLevel]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      pauseStartRef.current = Date.now();
      setIsPaused(true);
    }
  }, []);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      if (pauseStartRef.current > 0) {
        pausedDurationRef.current += Date.now() - pauseStartRef.current;
        pauseStartRef.current = 0;
      }
      setIsPaused(false);
    }
  }, []);

  const stopRecording = useCallback((): Promise<RecordedAudioResult | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
        setIsRecording(false);
        setIsPaused(false);
        setMicLevel(0);
        resolve(null);
        return;
      }

      const recorder = mediaRecorderRef.current;

      recorder.onstop = () => {
        // Calculate duration
        const totalDurationMs = Date.now() - startTimeRef.current - pausedDurationRef.current;
        const durationSec = Math.max(1, Math.round(totalDurationMs / 1000));

        const blobType = recorder.mimeType || 'audio/webm';
        const finalBlob = new Blob(audioChunksRef.current, { type: blobType });
        const url = URL.createObjectURL(finalBlob);

        const result: RecordedAudioResult = {
          blob: finalBlob,
          url,
          duration: durationSec,
        };

        setRecordedAudio(result);
        setIsRecording(false);
        setIsPaused(false);
        setMicLevel(0);

        // Clean up tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
          audioCtxRef.current.close().catch(() => {});
          audioCtxRef.current = null;
        }

        if (animationFrameRef.current !== null) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }

        resolve(result);
      };

      recorder.stop();
    });
  }, []);

  const clearRecording = useCallback(() => {
    if (recordedAudio?.url) {
      URL.revokeObjectURL(recordedAudio.url);
    }
    setRecordedAudio(null);
  }, [recordedAudio]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
      }
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return {
    isRecording,
    isPaused,
    micLevel,
    hasPermission,
    recordedAudio,
    errorMessage,
    requestPermission,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    clearRecording,
  };
}
